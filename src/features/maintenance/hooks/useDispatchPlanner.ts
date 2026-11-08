import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import type { TechnicianUser } from '../server/getTechnicians'
import type { ScheduledSlot } from '../server/getTechnicianSchedule'
import type { MaintenanceCluster } from '../types'
import {
  formatDateIso,
  getEarliestSchedulableDate,
  getMonday,
  getTodayIso,
  minutesToTimeString,
  timeStringToMinutes,
  findAvailableSlotOnDay,
  type DayInterval,
} from '../utils/dateUtils'
import { areCitiesInSameRegion } from '../utils/regionUtils'

export interface DayColumn {
  name: string
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
  date: string
  dayLabel: string
  isPastOrToday: boolean
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

function getPreferredTechIdForCity(city?: string): string {
  if (!city) return 'usr_tom'
  const c = city.toLowerCase().trim()
  if (
    c.includes('kortrijk') ||
    c.includes('wevelgem') ||
    c.includes('heule') ||
    c.includes('kuurne') ||
    c.includes('harelbeke')
  ) {
    return 'usr_tom'
  }
  if (c.includes('waregem') || c.includes('deerlijk')) {
    return 'usr_jens'
  }
  return 'usr_wout'
}

export function useDispatchPlanner(
  cluster: MaintenanceCluster | null,
  open: boolean,
  initialSelectedSiteIds?: string[]
) {
  const [userSelectedTechId, setUserSelectedTechId] = useState<string | null>(null)
  const [userSelectedMonday, setUserSelectedMonday] = useState<Date | null>(null)

  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const earliest = getEarliestSchedulableDate()
    return new Date(earliest.getFullYear(), earliest.getMonth(), 1)
  })

  // Synchronize site selection and canonicalize IDs when dialog opens or initialSelectedSiteIds changes
  useEffect(() => {
    if (open && cluster) {
      if (initialSelectedSiteIds && initialSelectedSiteIds.length > 0) {
        // Map any requested site ID to the canonical cluster item ID
        const matched = new Set<string>()
        for (const reqId of initialSelectedSiteIds) {
          const found = cluster.sites.find(
            (s) => s.id === reqId || s.siteIds.includes(reqId)
          )
          if (found) {
            matched.add(found.id)
          } else {
            matched.add(reqId)
          }
        }
        setSelectedSiteIds(Array.from(matched))
      } else {
        setSelectedSiteIds(cluster.sites.map((s) => s.id))
      }
    }
  }, [open, cluster, initialSelectedSiteIds])

  // Total required hours of selected jobs
  const totalSelectedHours = useMemo(() => {
    if (!cluster) return 1.5
    const selected = cluster.sites.filter(
      (s) => selectedSiteIds.includes(s.id) || s.siteIds.some((id) => selectedSiteIds.includes(id))
    )
    if (selected.length === 0) return 1.5
    return (
      Math.round(selected.reduce((sum, s) => sum + s.durationHours, 0) * 10) / 10
    )
  }, [cluster, selectedSiteIds])

  // Query options for technicians list
  const techniciansQuery = useQuery({
    ...maintenanceQueries.technicians(),
    enabled: open,
  })
  const technicians: TechnicianUser[] = techniciansQuery.data ?? []

  // Query smart recommended slot considering technician schedules and urgency
  const recommendedSlotQuery = useQuery({
    ...maintenanceQueries.recommendedSlot(
      cluster?.city || 'Kortrijk',
      totalSelectedHours,
      getPreferredTechIdForCity(cluster?.city),
      { enabled: open && Boolean(cluster) }
    ),
  })

  // Derive selected technician and week: prioritizes intentional user choice, then recommended slot, then sensible default
  const selectedTechId =
    userSelectedTechId ??
    recommendedSlotQuery.data?.techId ??
    getPreferredTechIdForCity(cluster?.city)

  const currentMonday =
    userSelectedMonday ??
    (recommendedSlotQuery.data?.weekMonday
      ? getMonday(new Date(`${recommendedSlotQuery.data.weekMonday}T00:00:00`))
      : getMonday(getEarliestSchedulableDate()))

  const setSelectedTechId = (techId: string) => setUserSelectedTechId(techId)
  const setCurrentMonday = (monday: Date) => {
    setUserSelectedMonday(monday)
    setPickerMonth(new Date(monday.getFullYear(), monday.getMonth(), 1))
  }


  const recommendedTech = useMemo(() => {
    return technicians.find((t) => t.id === selectedTechId) || technicians[0] || null
  }, [technicians, selectedTechId])

  const otherTechs = useMemo(() => {
    return technicians.filter((t) => t.id !== recommendedTech?.id)
  }, [technicians, recommendedTech?.id])

  const todayIso = useMemo(() => getTodayIso(), [])

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
      const dateStr = formatDateIso(d)
      return {
        name,
        dayKey: dayKeys[i],
        date: dateStr,
        dayLabel: `${d.getDate()} ${d.toLocaleString('nl-BE', { month: 'short' })}`,
        isPastOrToday: dateStr <= todayIso,
      }
    })
  }, [currentMonday, todayIso])

  const isPastWeek = useMemo(() => {
    return weekDays.every((day) => day.isPastOrToday)
  }, [weekDays])

  const weekStartDate = weekDays[0]?.date || formatDateIso(currentMonday)
  const weekEndDate = weekDays[4]?.date || formatDateIso(currentMonday)

  // Query technician schedule for current displayed week
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

  // Calculate placement of proposed slots within the displayed week
  const { proposedSlots, dayLoads, dayRegionConflicts, isOverCapacity } = useMemo(() => {
    if (!cluster) {
      return { proposedSlots: [], dayLoads: {}, dayRegionConflicts: {}, isOverCapacity: false }
    }

    const loads: Record<string, number> = {}
    const dayBookedMap: Record<string, Array<{ start: number; end: number }>> = {}
    const regionConflicts: Record<string, string> = {}

    weekDays.forEach((day) => {
      const scheduledDailyHours = activeTech.weeklySchedule[day.dayKey] ?? 8
      const dayExisting = existingSlots.filter((s) => s.date === day.date)
      const existingTotal = dayExisting.reduce((acc, s) => acc + s.durationHours, 0)
      loads[day.date] = existingTotal

      // Booked intervals on this day (ensuring valid forward intervals)
      const booked: DayInterval[] = dayExisting.map((ex) => {
        const sMin = timeStringToMinutes(ex.startTime)
        let eMin = timeStringToMinutes(ex.endTime)
        if (eMin <= sMin) {
          eMin = Math.min(17 * 60, sMin + 120)
        }
        return { start: sMin, end: eMin }
      })

      // Geographic co-location constraint:
      // If a day already has work scheduled in a different/conflicting region,
      // lock this day so technician is not dispatched across multiple regions on the same day.
      const conflictingSlot = dayExisting.find(
        (s) => !areCitiesInSameRegion(s.siteCity, cluster.city)
      )
      if (conflictingSlot) {
        regionConflicts[day.date] = conflictingSlot.siteCity
        // Block whole working day for cluster.city
        booked.push({ start: 8 * 60 + 30, end: 17 * 60 })
      }

      // If day is part-time (<= 4h scheduled), block afternoon
      if (scheduledDailyHours <= 4) {
        booked.push({ start: 12 * 60 + 30, end: 17 * 60 })
      }

      dayBookedMap[day.date] = booked
    })

    // If the entire week is in the past, no slots can or should be dispatched.
    // Allow users to freely inspect past schedules without triggering false capacity errors.
    if (isPastWeek) {
      return {
        proposedSlots: [],
        dayLoads: loads,
        dayRegionConflicts: regionConflicts,
        isOverCapacity: false,
      }
    }

    const proposed: ProposedSlot[] = []
    const selectedSites = cluster.sites.filter(
      (s) => selectedSiteIds.includes(s.id) || s.siteIds.some((id) => selectedSiteIds.includes(id))
    )
    let hasOverflow = false

    for (const site of selectedSites) {
      const durationMinutes = Math.round(site.durationHours * 60)
      let placed = false

      // Try placing on future available days
      for (const day of weekDays) {
        if (day.isPastOrToday) continue
        const scheduledDailyHours = activeTech.weeklySchedule[day.dayKey] ?? 8
        if (scheduledDailyHours === 0) continue

        const currentBooked = dayBookedMap[day.date] || []
        const slot = findAvailableSlotOnDay(currentBooked, durationMinutes)

        if (slot) {
          proposed.push({
            siteId: site.id,
            siteIds: site.siteIds,
            siteName: site.name,
            customerName: site.customerName,
            disciplines: site.disciplines,
            city: cluster.city,
            date: day.date,
            startTime: minutesToTimeString(slot.start),
            endTime: minutesToTimeString(slot.end),
            durationHours: site.durationHours,
          })

          loads[day.date] = (loads[day.date] || 0) + site.durationHours
          currentBooked.push({ start: slot.start, end: slot.end })
          dayBookedMap[day.date] = currentBooked
          placed = true
          break
        }
      }

      if (!placed) {
        hasOverflow = true
      }
    }

    const overCapacity = hasOverflow || Object.values(loads).some((load) => load > 8.0)

    return {
      proposedSlots: proposed,
      dayLoads: loads,
      dayRegionConflicts: regionConflicts,
      isOverCapacity: overCapacity,
    }
  }, [cluster, selectedSiteIds, existingSlots, weekDays, activeTech, isPastWeek])

  const handleToggleSite = (id: string) => {
    setSelectedSiteIds((prev) => {
      // Find canonical site ID if a sub-site ID was passed
      const canonicalSite = cluster?.sites.find((s) => s.id === id || s.siteIds.includes(id))
      const targetId = canonicalSite?.id || id
      return prev.includes(targetId) ? prev.filter((i) => i !== targetId) : [...prev, targetId]
    })
  }

  const handleSelectAll = () => {
    if (!cluster) return
    const allCanonicalIds = cluster.sites.map((s) => s.id)
    const isAllSelected = allCanonicalIds.every((id) => selectedSiteIds.includes(id))

    if (isAllSelected) {
      setSelectedSiteIds([])
    } else {
      setSelectedSiteIds(allCanonicalIds)
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
    dayRegionConflicts,
    isOverCapacity,
    isPastWeek,
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
