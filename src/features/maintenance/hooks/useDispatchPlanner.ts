import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import type { TechnicianUser } from '../server/getTechnicians'
import type { ScheduledSlot } from '../server/getTechnicianSchedule'
import type { MaintenanceCluster } from '../types'

export interface DayColumn {
  name: string
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
  date: string
  dayLabel: string
}

export interface ProposedSlot {
  siteId: string
  siteIds: string[]
  siteName: string
  customerName: string
  disciplines: string[]
  city: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
}

interface TimeWindow {
  start: number
  end: number
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateIso(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function useDispatchPlanner(cluster: MaintenanceCluster | null, open: boolean) {
  const [selectedTechId, setSelectedTechId] = useState('usr_tom')
  const [currentMonday, setCurrentMonday] = useState<Date>(() => new Date(2025, 2, 17))
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState<Date>(() => new Date(2025, 2, 1))

  // Query options for technicians list
  const techniciansQuery = useQuery({
    ...maintenanceQueries.technicians(),
    enabled: open,
  })
  const technicians: TechnicianUser[] = techniciansQuery.data ?? []

  useEffect(() => {
    if (cluster) {
      setSelectedSiteIds(cluster.sites.map((s) => s.id))
      const city = cluster.city.toLowerCase()
      if (
        city.includes('kortrijk') ||
        city.includes('wevelgem') ||
        city.includes('heule') ||
        city.includes('kuurne') ||
        city.includes('harelbeke')
      ) {
        setSelectedTechId('usr_tom')
      } else if (city.includes('waregem') || city.includes('deerlijk')) {
        setSelectedTechId('usr_jens')
      } else {
        setSelectedTechId('usr_wout')
      }
    }
  }, [cluster])

  const recommendedTech = useMemo(() => {
    return technicians.find((t) => t.id === selectedTechId) || technicians[0] || null
  }, [technicians, selectedTechId])

  const otherTechs = useMemo(() => {
    return technicians.filter((t) => t.id !== recommendedTech?.id)
  }, [technicians, recommendedTech?.id])

  const weekDays: DayColumn[] = useMemo(() => {
    const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
    const dayKeys: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri'> = [
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
    ]
    return dayNames.map((name, i) => {
      const d = new Date(currentMonday)
      d.setDate(d.getDate() + i)
      return {
        name,
        dayKey: dayKeys[i],
        date: formatDateIso(d),
        dayLabel: `${d.getDate()} ${d.toLocaleString('nl-BE', { month: 'short' })}`,
      }
    })
  }, [currentMonday])

  const weekStartDate = weekDays[0]?.date || '2025-03-17'
  const weekEndDate = weekDays[4]?.date || '2025-03-21'

  // Query options for technician schedule
  const scheduleQuery = useQuery(
    maintenanceQueries.technicianSchedule(selectedTechId, weekStartDate, weekEndDate, {
      enabled: open,
    })
  )
  const existingSlots: ScheduledSlot[] = scheduleQuery.data ?? []
  const isLoadingSlots = scheduleQuery.isLoading

  const activeTech: TechnicianUser = useMemo(() => {
    return (
      technicians.find((t) => t.id === selectedTechId) || {
        id: selectedTechId,
        name: 'Technicus',
        role: 'TECHNICIAN' as const,
        isContractor: false,
        techCode: null,
        initials: null,
        title: 'Technicus',
        specialties: [],
        weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      }
    )
  }, [technicians, selectedTechId])

  const { proposedSlots, dayLoads, isOverCapacity } = useMemo(() => {
    if (!cluster) {
      return { proposedSlots: [], dayLoads: {}, isOverCapacity: false }
    }

    const availableWindowsByDay: Record<string, TimeWindow[]> = {}
    const loads: Record<string, number> = {}

    weekDays.forEach((day) => {
      const scheduledHours = activeTech.weeklySchedule[day.dayKey] ?? 8
      const windows: TimeWindow[] = []

      if (scheduledHours === 0) {
        availableWindowsByDay[day.date] = []
        loads[day.date] = 0
        return
      }

      if (scheduledHours <= 4) {
        windows.push({ start: 8 * 60 + 30, end: 12 * 60 + 30 })
      } else {
        windows.push({ start: 8 * 60 + 30, end: 12 * 60 })
        windows.push({ start: 13 * 60, end: 17 * 60 })
      }

      const dayExisting = existingSlots.filter((s) => s.date === day.date)
      let currentWindows = windows

      dayExisting.forEach((ex) => {
        const exStart = timeStringToMinutes(ex.startTime)
        const exEnd = timeStringToMinutes(ex.endTime)

        const nextWindows: TimeWindow[] = []
        currentWindows.forEach((win) => {
          if (exEnd <= win.start || exStart >= win.end) {
            nextWindows.push(win)
          } else {
            if (exStart > win.start) {
              nextWindows.push({ start: win.start, end: exStart })
            }
            if (exEnd < win.end) {
              nextWindows.push({ start: exEnd, end: win.end })
            }
          }
        })
        currentWindows = nextWindows
      })

      availableWindowsByDay[day.date] = currentWindows
      const existingTotal = dayExisting.reduce((acc, s) => acc + s.durationHours, 0)
      loads[day.date] = existingTotal
    })

    const proposed: ProposedSlot[] = []
    const selectedSites = cluster.sites.filter((s) => selectedSiteIds.includes(s.id))
    let hasOverflow = false

    for (const site of selectedSites) {
      const durationMinutes = Math.round(site.durationHours * 60)
      let placed = false

      for (const day of weekDays) {
        const windows = availableWindowsByDay[day.date]
        if (!windows || windows.length === 0) continue

        for (let i = 0; i < windows.length; i++) {
          const win = windows[i]
          if (win.end - win.start >= durationMinutes) {
            const startMinutes = win.start
            const endMinutes = win.start + durationMinutes

            proposed.push({
              siteId: site.id,
              siteIds: site.siteIds,
              siteName: site.name,
              customerName: site.customerName,
              disciplines: site.disciplines,
              city: cluster.city,
              date: day.date,
              startTime: minutesToTimeString(startMinutes),
              endTime: minutesToTimeString(endMinutes),
              durationHours: site.durationHours,
            })

            loads[day.date] = (loads[day.date] || 0) + site.durationHours

            if (endMinutes < win.end) {
              windows[i] = { start: endMinutes, end: win.end }
            } else {
              windows.splice(i, 1)
            }

            placed = true
            break
          }
        }

        if (placed) break
      }

      if (!placed) {
        hasOverflow = true
        const fallbackDay = weekDays[weekDays.length - 1]
        proposed.push({
          siteId: site.id,
          siteIds: site.siteIds,
          siteName: site.name,
          customerName: site.customerName,
          disciplines: site.disciplines,
          city: cluster.city,
          date: fallbackDay.date,
          startTime: '15:00',
          endTime: minutesToTimeString(15 * 60 + durationMinutes),
          durationHours: site.durationHours,
        })
        loads[fallbackDay.date] = (loads[fallbackDay.date] || 0) + site.durationHours
      }
    }

    const overCapacity = hasOverflow || Object.values(loads).some((load) => load > 8.0)

    return { proposedSlots: proposed, dayLoads: loads, isOverCapacity: overCapacity }
  }, [cluster, selectedSiteIds, existingSlots, weekDays, activeTech])

  const handleToggleSite = (id: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (!cluster) return
    if (selectedSiteIds.length === cluster.sites.length) {
      setSelectedSiteIds([])
    } else {
      setSelectedSiteIds(cluster.sites.map((s) => s.id))
    }
  }

  const handleNavigateWeek = (delta: number) => {
    const nextDate = new Date(currentMonday)
    nextDate.setDate(nextDate.getDate() + delta * 7)
    setCurrentMonday(nextDate)
  }

  const handleSelectCalendarDate = (date: Date) => {
    setCurrentMonday(getMonday(date))
    setIsCalendarPickerOpen(false)
  }

  const calendarDays = useMemo(() => {
    const y = pickerMonth.getFullYear()
    const m = pickerMonth.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)

    const days: Array<{ date: Date; isCurrentMonth: boolean; isCurrentWeek: boolean }> = []
    const startOffset = (firstDay.getDay() + 6) % 7
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(y, m, 1 - i)
      days.push({ date: d, isCurrentMonth: false, isCurrentWeek: false })
    }

    const currentMondayTime = currentMonday.getTime()
    const currentFridayTime = currentMondayTime + 4 * 86400000

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(y, m, day)
      const dTime = d.getTime()
      const isCurrentWeek = dTime >= currentMondayTime && dTime <= currentFridayTime
      days.push({ date: d, isCurrentMonth: true, isCurrentWeek })
    }

    const totalDays = days.length
    const endDays = (7 - (totalDays % 7)) % 7
    for (let i = 1; i <= endDays; i++) {
      const d = new Date(y, m + 1, i)
      days.push({ date: d, isCurrentMonth: false, isCurrentWeek: false })
    }

    return days
  }, [pickerMonth, currentMonday])

  const totalSelectedHours = useMemo(() => {
    if (!cluster) return 0
    return (
      Math.round(
        cluster.sites
          .filter((s) => selectedSiteIds.includes(s.id))
          .reduce((sum, s) => sum + s.durationHours, 0) * 10
      ) / 10
    )
  }, [cluster, selectedSiteIds])

  return {
    technicians,
    selectedTechId,
    setSelectedTechId,
    recommendedTech,
    otherTechs,
    activeTech,
    weekDays,
    currentMonday,
    existingSlots,
    isLoadingSlots,
    proposedSlots,
    dayLoads,
    isOverCapacity,
    selectedSiteIds,
    handleToggleSite,
    handleSelectAll,
    handleNavigateWeek,
    handleSelectCalendarDate,
    isCalendarPickerOpen,
    setIsCalendarPickerOpen,
    pickerMonth,
    setPickerMonth,
    calendarDays,
    totalSelectedHours,
  }
}
