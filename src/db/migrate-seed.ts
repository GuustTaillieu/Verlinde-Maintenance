import fs from 'fs'
import path from 'path'
import { hashPassword } from 'better-auth/crypto'
import { db } from './index'
import {
  user,
  account,
  customers,
  sites,
  equipment,
  workOrders,
  workOrderItems,
  articles,
} from './schema'
import { eq } from 'drizzle-orm'

export interface LegacySeed {
  today: string
  relations: Array<{
    code: string
    naam: string
    type: string
    straat?: string
    nr?: string
    postcode?: string
    gemeente?: string
    tel?: string
    gsm?: string
    email?: string
    btw?: string
    taal?: string
    betaalterm?: string
    prijscat?: string
    vertegenw?: string
    aangemaakt?: string
    notities?: string
    actief?: string
  }>
  articles: Array<{
    code: string
    omschrijving: string
    prijs: number
    eenheid: string
    leverancier?: string
    groep?: string
  }>
  sheets: Array<{
    nr: string
    lijst?: string
    groep?: string
    type?: string
    omschrijving: string
    klant: string
    installatiedatum?: string
    verantw?: string
    pnr?: string
    uwref?: string
    frequentie?: string
    laatste?: string
    volgende?: string
    autoplan?: boolean
    actief?: string
    pand?: string
    componenten?: Array<{
      artikel: string
      omschrijving: string
      aantal: number
      serienr?: string
      locatie?: string
    }>
    notities?: string
  }>
  workorders: Array<{
    nr: string
    datum: string
    status: string
    klant: string
    werfadres?: string
    omschrijving: string
    fiche?: string
    soort: string
    uwref?: string
    klantAfwezig?: boolean
    getekend?: boolean
    verzonden?: boolean
    toestellen?: Array<{
      fiche?: string
      omschrijving?: string
      soort?: string
    }>
    notaTech?: string
    notaKantoor?: string
    notaKlant?: string
    planning?: Array<{
      datum: string
      tech: string
      van?: string
      tot?: string
      taak?: string
    }>
    uitvoering?: Array<{
      datum: string
      tech: string
      van?: string
      tot?: string
      taak?: string
    }>
    artPlanning?: Array<{
      artikel: string
      omschrijving: string
      aantal: number
      prijs?: number
    }>
    artUitvoering?: Array<{
      artikel: string
      omschrijving: string
      aantal: number
      prijs?: number
    }>
    aangemaakt?: string
    aangemaaktDoor?: string
    historiek?: any[]
  }>
  techs: Array<{
    code: string
    naam: string
    rol: string
  }>
}

/**
 * Normalizes Dutch DD/MM/YYYY dates to ISO YYYY-MM-DD
 */
export function parseDdMmYyyyToIso(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '2025-01-01'
  const trimmed = dateStr.trim()
  const parts = trimmed.split(/[/.-]/)
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    return `${year}-${month}-${day}`
  }
  return trimmed
}

export function parseDateObj(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  const iso = parseDdMmYyyyToIso(dateStr)
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

export function addMonthsToIso(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setMonth(date.getMonth() + months)
  const newY = date.getFullYear()
  const newM = String(date.getMonth() + 1).padStart(2, '0')
  const newD = String(date.getDate()).padStart(2, '0')
  return `${newY}-${newM}-${newD}`
}

export function normalizeDiscipline(groupStr?: string): 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS' | 'OTHER' {
  const g = (groupStr || '').toUpperCase()
  if (g.includes('BRAND') || g.includes('FIRE')) return 'FIRE'
  if (g.includes('INBR') || g.includes('ALARM')) return 'INTRUSION'
  if (g.includes('CAM') || g.includes('CCTV')) return 'CCTV'
  if (g.includes('TOEG') || g.includes('ACCESS') || g.includes('BADGE')) return 'ACCESS'
  return 'OTHER'
}

export function extractCityFromAddress(addr?: string): string {
  if (!addr) return 'Zwevegem'
  const match = addr.match(/\b\d{4}\s+([A-Za-z\-]+)/)
  if (match) return match[1].trim()
  return 'Zwevegem'
}

export function extractZipFromAddress(addr?: string): string | null {
  if (!addr) return null
  const match = addr.match(/\b(\d{4})\b/)
  return match ? match[1] : null
}

export async function runMigrationAndSeed(dataPath = 'data/seed_full.json') {
  console.log('🚀 Starting Database Migration & Seed...')

  const fullPath = path.resolve(process.cwd(), dataPath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Data file not found at: ${fullPath}`)
  }

  const raw = fs.readFileSync(fullPath, 'utf8')
  const seed: LegacySeed = JSON.parse(raw)
  const refDate = parseDdMmYyyyToIso(seed.today || '02/11/2026')
  console.log(`📅 Snapshot Reference Date: ${refDate} (Today)`)

  // 1. Clean existing records in foreign key order
  console.log('🧹 Cleaning existing tables...')
  await db.delete(workOrderItems)
  await db.delete(workOrders)
  await db.delete(equipment)
  await db.delete(sites)
  await db.delete(customers)
  await db.delete(articles)
  await db.delete(account)
  await db.delete(user)

  // 2. Seed Users & Better Auth Accounts
  console.log('👥 Seeding Users and Authentication Accounts...')
  const defaultPassword = 'password123'
  const passwordHash = await hashPassword(defaultPassword)
  const now = new Date()

  const seedUsers = [
    {
      id: 'usr_dirk',
      name: 'Dirk Verlinde',
      email: 'dirk@verlinde-beveiliging.be',
      emailVerified: true,
      role: 'MANAGER' as const,
      isContractor: false,
      techCode: 'DV',
      initials: 'DV',
      title: 'Managing Director & Operations',
      specialties: ['FIRE', 'INTRUSION', 'CCTV', 'ACCESS'],
      weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_tom',
      name: 'Tom De Coninck',
      email: 'tom@verlinde-beveiliging.be',
      emailVerified: true,
      role: 'TECHNICIAN' as const,
      isContractor: false,
      techCode: 'TDC',
      initials: 'TC',
      title: 'Senior Field Technician',
      specialties: ['FIRE', 'INTRUSION', 'CCTV'],
      weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_wout',
      name: 'Wout Vanhoutte',
      email: 'wout@verlinde-beveiliging.be',
      emailVerified: true,
      role: 'TECHNICIAN' as const,
      isContractor: false,
      techCode: 'WVH',
      initials: 'WV',
      title: 'Field Technician',
      specialties: ['INTRUSION', 'CCTV', 'ACCESS'],
      weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_jens',
      name: 'Jens Maes',
      email: 'jens@verlinde-beveiliging.be',
      emailVerified: true,
      role: 'TECHNICIAN' as const,
      isContractor: false,
      techCode: 'JMS',
      initials: 'JM',
      title: 'Field Technician (Part-time)',
      specialties: ['INTRUSION', 'CCTV'],
      weeklySchedule: { mon: 8, tue: 8, wed: 4, thu: 8, fri: 4 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_brandtec',
      name: 'Brandtec BV',
      email: 'dispatch@brandtec.be',
      emailVerified: true,
      role: 'TECHNICIAN' as const,
      isContractor: true,
      techCode: 'BRT',
      initials: 'BT',
      title: 'Certified Fire Safety Partner',
      specialties: ['FIRE'],
      weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const u of seedUsers) {
    await db.insert(user).values(u)
    await db.insert(account).values({
      id: `acc_${u.id}`,
      accountId: u.id,
      providerId: 'credential',
      userId: u.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })
  }
  console.log(`  ✓ ${seedUsers.length} users and auth accounts provisioned (default password: '${defaultPassword}')`)

  // Map technician legacy code to user id
  const techUserMap = new Map<string, string>([
    ['DV', 'usr_dirk'],
    ['TDC', 'usr_tom'],
    ['WVH', 'usr_wout'],
    ['JMS', 'usr_jens'],
    ['BRT', 'usr_brandtec'],
  ])

  // 3. Seed Articles Catalog
  console.log('📦 Seeding Articles Catalog...')
  const articleRows = seed.articles.map((art) => ({
    code: art.code,
    description: art.omschrijving,
    price: Number(art.prijs) || 0,
    unit: art.eenheid || 'st',
    category: art.groep || null,
    supplierCode: art.leverancier || null,
  }))

  for (const art of articleRows) {
    await db.insert(articles).values(art)
  }
  console.log(`  ✓ ${articleRows.length} catalog articles inserted`)

  // 4. Seed Customers
  console.log('🏢 Seeding Customers (Debtors)...')
  const customerMap = new Map<string, string>() // code -> id

  const customerRows = seed.relations.map((rel) => {
    const id = `cust_${rel.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    customerMap.set(rel.code, id)

    const street = rel.straat?.trim() || ''
    const nr = rel.nr?.trim() || ''
    const invoiceAddress = [street, nr].filter(Boolean).join(' ') || null

    return {
      id,
      code: rel.code,
      name: rel.naam,
      type: rel.type === 'Bedrijf' ? ('B2B' as const) : ('RESIDENTIAL' as const),
      vatNumber: rel.btw?.trim() || null,
      email: rel.email?.trim() || null,
      phone: rel.tel?.trim() || null,
      mobile: rel.gsm?.trim() || null,
      invoiceAddress,
      invoiceCity: rel.gemeente?.trim() || 'Zwevegem',
      invoiceZip: rel.postcode?.trim() || null,
      notes: rel.notities?.trim() || null,
      isActive: rel.actief !== 'N',
    }
  })

  // Batch insert customers
  for (let i = 0; i < customerRows.length; i += 50) {
    await db.insert(customers).values(customerRows.slice(i, i + 50))
  }
  console.log(`  ✓ ${customerRows.length} customers inserted`)

  // 5. Seed Sites (Management Sheets)
  console.log('📍 Seeding Sites & Installations...')
  const siteMap = new Map<string, string>() // sheetNr -> siteId
  const customerDefaultSiteMap = new Map<string, string>() // customerId -> primary siteId

  const siteRows = seed.sheets.map((sheet) => {
    const id = `site_${sheet.nr.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    siteMap.set(sheet.nr, id)

    let customerId = customerMap.get(sheet.klant)
    if (!customerId) {
      customerId = customerRows[0]?.id || 'cust_default'
    }

    if (!customerDefaultSiteMap.has(customerId)) {
      customerDefaultSiteMap.set(customerId, id)
    }

    const fullAddress = sheet.pand?.trim() || 'Adres onbekend'
    const city = extractCityFromAddress(fullAddress)
    const zip = extractZipFromAddress(fullAddress)
    const discipline = normalizeDiscipline(sheet.groep || sheet.type)
    const installDate = parseDdMmYyyyToIso(sheet.installatiedatum)

    return {
      id,
      customerId,
      sheetNumber: sheet.nr,
      name: sheet.omschrijving || `Installation ${sheet.nr}`,
      siteAddress: fullAddress,
      siteCity: city,
      siteZip: zip,
      primaryDiscipline: discipline,
      accessNotesConfidential: sheet.notities?.trim() || null,
      isActive: sheet.actief !== 'N',
      installDate,
      frequency: sheet.frequentie || '1J',
      lastServiceDate: null as string | null,
      nextDueDate: null as string | null,
    }
  })

  // Ensure any customer that has work orders but no sheet gets a dedicated site
  const unlinkedCustomerCodes = ['K00126', 'K00166', 'K00432']
  for (const cCode of unlinkedCustomerCodes) {
    const cId = customerMap.get(cCode)
    if (cId && !customerDefaultSiteMap.has(cId)) {
      const rel = seed.relations.find((r) => r.code === cCode)
      const siteId = `site_${cCode.toLowerCase()}_main`
      siteMap.set(`DEFAULT_${cCode}`, siteId)
      customerDefaultSiteMap.set(cId, siteId)
      const address = `${rel?.straat || ''} ${rel?.nr || ''}, ${rel?.postcode || ''} ${rel?.gemeente || ''}`.trim()
      siteRows.push({
        id: siteId,
        customerId: cId,
        sheetNumber: `SITE-${cCode}`,
        name: `${rel?.naam || 'Klant'} - Hoofdzetel`,
        siteAddress: address || 'Adres onbekend',
        siteCity: rel?.gemeente || 'Zwevegem',
        siteZip: rel?.postcode || null,
        primaryDiscipline: 'INTRUSION',
        accessNotesConfidential: rel?.notities || null,
        isActive: true,
        installDate: '2020-01-01',
        frequency: '1J',
        lastServiceDate: null,
        nextDueDate: null,
      })
    }
  }

  // Batch insert sites
  for (let i = 0; i < siteRows.length; i += 50) {
    await db.insert(sites).values(siteRows.slice(i, i + 50))
  }
  console.log(`  ✓ ${siteRows.length} sites inserted`)

  // 6. Seed Equipment & Components
  console.log('🔧 Seeding Equipment & Installed Components...')
  const equipmentRows: Array<typeof equipment.$inferInsert> = []
  let eqCounter = 1

  for (const sheet of seed.sheets) {
    const siteId = siteMap.get(sheet.nr)
    if (!siteId) continue
    const installDate = parseDdMmYyyyToIso(sheet.installatiedatum)
    const sheetDiscipline = normalizeDiscipline(sheet.groep || sheet.type)
    const intervalMonths = sheetDiscipline === 'CCTV' ? 24 : 12

    if (sheet.componenten && Array.isArray(sheet.componenten)) {
      for (const comp of sheet.componenten) {
        equipmentRows.push({
          id: `eq_${eqCounter++}`,
          siteId,
          articleCode: comp.artikel || 'COMP-GEN',
          description: comp.omschrijving || 'Component',
          location: comp.locatie?.trim() || null,
          serialNumber: comp.serienr?.trim() || null,
          quantity: comp.aantal || 1,
          installDate,
          maintenanceIntervalMonths: intervalMonths,
          lastServiceDate: null,
          nextDueDate: null,
          status: 'ACTIVE',
        })
      }
    }
  }

  // Batch insert equipment
  for (let i = 0; i < equipmentRows.length; i += 100) {
    await db.insert(equipment).values(equipmentRows.slice(i, i + 100))
  }
  console.log(`  ✓ ${equipmentRows.length} components inserted into equipment ledger`)

  // 7. Seed Work Orders
  console.log('📋 Seeding Work Orders & Historical Tickets...')
  const workOrderRows: Array<typeof workOrders.$inferInsert> = []
  const workOrderItemRows: Array<typeof workOrderItems.$inferInsert> = []
  let itemCounter = 1

  for (const wo of seed.workorders) {
    const id = `wo_${wo.nr.toLowerCase().replace(/[^a-z0-9]/g, '_')}`

    // Resolve Customer
    const customerId = customerMap.get(wo.klant) || customerRows[0]?.id

    // Resolve Site
    let siteId: string | null = null
    const fiche = wo.fiche?.trim() || wo.toestellen?.[0]?.fiche?.trim()
    if (fiche && siteMap.has(fiche)) {
      siteId = siteMap.get(fiche)!
    } else if (customerId && customerDefaultSiteMap.has(customerId)) {
      siteId = customerDefaultSiteMap.get(customerId)!
    }

    // Resolve Status
    let status: 'UNASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'UNASSIGNED'
    if (wo.status === 'Planned') {
      status = 'SCHEDULED'
    } else if (['Completed', 'Implemented', 'Invoiced', 'Verified'].includes(wo.status)) {
      status = 'COMPLETED'
    }

    // Resolve Kind
    let kind: 'MAINTENANCE' | 'INTERVENTION_REPAIR' | 'NEW_INSTALLATION' = 'MAINTENANCE'
    if (wo.soort === 'Herstelling') {
      kind = 'INTERVENTION_REPAIR'
    } else if (wo.soort === 'Installatie') {
      kind = 'NEW_INSTALLATION'
    }

    // Resolve Technician
    const techCode =
      wo.uitvoering?.[0]?.tech?.trim() ||
      wo.planning?.[0]?.tech?.trim() ||
      wo.aangemaaktDoor?.trim()
    const assignedTechnicianId = (techCode && techUserMap.get(techCode)) || null

    // Planned date and times
    const plannedDate =
      (wo.planning?.[0]?.datum && parseDdMmYyyyToIso(wo.planning[0].datum)) ||
      (wo.datum && parseDdMmYyyyToIso(wo.datum)) ||
      refDate
    const plannedStartTime = wo.planning?.[0]?.van || wo.uitvoering?.[0]?.van || null
    const plannedEndTime = wo.planning?.[0]?.tot || wo.uitvoering?.[0]?.tot || null

    const completedAt = status === 'COMPLETED' ? `${parseDdMmYyyyToIso(wo.datum)} 16:00:00` : null

    workOrderRows.push({
      id,
      woNumber: wo.nr,
      customerId,
      siteId,
      assignedTechnicianId,
      status,
      kind,
      plannedDate,
      plannedStartTime,
      plannedEndTime,
      description: wo.omschrijving || 'Work Order',
      siteAddress: wo.werfadres?.trim() || null,
      officeNotes: wo.notaKantoor?.trim() || null,
      techNotes: wo.notaTech?.trim() || null,
      isSigned: Boolean(wo.getekend),
      signedByName: wo.getekend ? 'Klant op locatie' : null,
      signedAt: completedAt,
      completedAt,
    })

    // Work order items from artPlanning / artUitvoering
    if (wo.artPlanning && wo.artPlanning.length > 0) {
      for (const item of wo.artPlanning) {
        workOrderItemRows.push({
          id: `woi_${itemCounter++}`,
          workOrderId: id,
          articleCode: item.artikel || null,
          description: item.omschrijving || 'Inspection Task',
          quantity: item.aantal || 1,
          isChecked: status === 'COMPLETED',
          techRemarks: null,
        })
      }
    } else if (wo.toestellen && wo.toestellen.length > 0) {
      for (const t of wo.toestellen) {
        workOrderItemRows.push({
          id: `woi_${itemCounter++}`,
          workOrderId: id,
          articleCode: null,
          description: `${t.soort || 'Onderhoud'}: ${t.omschrijving || 'Installatie inspectie'}`,
          quantity: 1,
          isChecked: status === 'COMPLETED',
          techRemarks: null,
        })
      }
    } else {
      workOrderItemRows.push({
        id: `woi_${itemCounter++}`,
        workOrderId: id,
        articleCode: null,
        description: wo.omschrijving || 'Algemeen onderhoud en controle',
        quantity: 1,
        isChecked: status === 'COMPLETED',
        techRemarks: null,
      })
    }
  }

  // Batch insert work orders
  for (let i = 0; i < workOrderRows.length; i += 100) {
    await db.insert(workOrders).values(workOrderRows.slice(i, i + 100))
  }
  console.log(`  ✓ ${workOrderRows.length} work orders inserted`)

  // Batch insert work order items
  for (let i = 0; i < workOrderItemRows.length; i += 100) {
    await db.insert(workOrderItems).values(workOrderItemRows.slice(i, i + 100))
  }
  console.log(`  ✓ ${workOrderItemRows.length} work order checklist items inserted`)

  // 8. Dynamic Maintenance Calculation Engine
  console.log('⚡ Running Dynamic Maintenance Calculation Engine...')
  // Group completed maintenance work orders by siteId
  const siteMaintenanceMap = new Map<string, string[]>()
  for (const wo of workOrderRows) {
    if (wo.siteId && wo.status === 'COMPLETED' && wo.kind === 'MAINTENANCE' && wo.plannedDate) {
      const dates = siteMaintenanceMap.get(wo.siteId) || []
      dates.push(wo.plannedDate)
      siteMaintenanceMap.set(wo.siteId, dates)
    }
  }

  let legallyExpiredFireCount = 0
  let overdueCount = 0
  let forgottenClientsCount = 0
  let compliantCount = 0

  // Check scheduled upcoming work orders
  const upcomingSites = new Set(
    workOrderRows
      .filter((wo) => wo.siteId && wo.status === 'SCHEDULED' && wo.plannedDate && wo.plannedDate >= refDate)
      .map((wo) => wo.siteId!),
  )

  for (const site of siteRows) {
    const completedDates = siteMaintenanceMap.get(site.id) || []
    completedDates.sort().reverse() // Most recent first

    const lastService = completedDates[0] || site.installDate || '2023-01-01'
    const intervalMonths = site.primaryDiscipline === 'CCTV' ? 24 : 12
    const nextDue = addMonthsToIso(lastService, intervalMonths)

    // Update site in DB
    await db
      .update(sites)
      .set({
        lastServiceDate: lastService,
        nextDueDate: nextDue,
      })
      .where(eq(sites.id, site.id))

    // Update equipment for this site
    await db
      .update(equipment)
      .set({
        lastServiceDate: lastService,
        nextDueDate: nextDue,
      })
      .where(eq(equipment.siteId, site.id))

    const isOverdue = nextDue < refDate
    if (isOverdue) {
      overdueCount++
      if (site.primaryDiscipline === 'FIRE') {
        legallyExpiredFireCount++
      }
      if (!upcomingSites.has(site.id)) {
        forgottenClientsCount++
      }
    } else {
      compliantCount++
    }
  }

  console.log('========================================================')
  console.log('🎉 MIGRATION & SEED SUCCESSFUL!')
  console.log('========================================================')
  console.log(`📊 Total Customers:              ${customerRows.length}`)
  console.log(`📊 Total Sites / Installations:   ${siteRows.length}`)
  console.log(`📊 Total Equipment Components:    ${equipmentRows.length}`)
  console.log(`📊 Total Work Orders:             ${workOrderRows.length}`)
  console.log(`📊 Total Inspection Items:        ${workOrderItemRows.length}`)
  console.log('--------------------------------------------------------')
  console.log(`🚨 Legally Expired Fire Alarms:   ${legallyExpiredFireCount} (CRITICAL PRIORITY)`)
  console.log(`⚠️  Total Overdue Installations:   ${overdueCount} (${Math.round((overdueCount / siteRows.length) * 100)}%)`)
  console.log(`❓ Forgotten Clients (No WO):      ${forgottenClientsCount}`)
  console.log(`✅ Compliant Sites:                ${compliantCount}`)
  console.log('========================================================')
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationAndSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err)
      process.exit(1)
    })
}
