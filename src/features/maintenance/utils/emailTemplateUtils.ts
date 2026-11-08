import * as React from 'react'
import { formatDateDutch } from './dateUtils'
import { VERLINDE_COMPANY, BRANDTEC_PARTNER } from './constants'


export type EmailTemplateType = 'concise' | 'standard' | 'urgent' | 'blank'

export interface EmailSiteItem {
  siteName: string
  siteAddress: string
  plannedDate: string
  startTime: string
  endTime: string
}

/**
 * Formats site and address cleanly without ugly "(Adres onbekend)" or redundant street names.
 */
export function formatSiteAddressDisplay(siteName: string, siteAddress?: string | null): string {
  if (!siteAddress) return siteName

  const trimmedAddress = siteAddress.trim()
  const lowerAddress = trimmedAddress.toLowerCase()

  // If address says "onbekend" or is empty
  if (lowerAddress.includes('onbekend') || lowerAddress === '') {
    return siteName
  }

  // If site name already contains the address (e.g. "pand Otegemstraat 42")
  if (siteName.toLowerCase().includes(lowerAddress)) {
    return siteName
  }

  return `${siteName} (${trimmedAddress})`
}

/**
 * Handles automatic bullet point continuation when pressing Enter in a textarea.
 */
export function handleAutoBulletOnEnter(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  currentValue: string,
  onUpdate: (nextValue: string) => void
): boolean {
  if (e.key !== 'Enter' || e.shiftKey) return false

  const textarea = e.currentTarget
  const { selectionStart } = textarea

  // Find start of current line
  const lastNewLine = currentValue.lastIndexOf('\n', selectionStart - 1)
  const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1
  const currentLine = currentValue.substring(lineStart, selectionStart)

  // Check if current line starts with a bullet point
  const bulletMatch = currentLine.match(/^(\s*)([•\-\*])\s+/)
  if (!bulletMatch) return false

  e.preventDefault()
  const indent = bulletMatch[1]
  const bulletChar = bulletMatch[2]
  const bulletPrefix = `${indent}${bulletChar} `

  // If user pressed enter on an empty bullet line (just "• "):
  if (currentLine.trim() === bulletChar) {
    const beforeLine = currentValue.substring(0, lineStart)
    const afterCursor = currentValue.substring(selectionStart)
    const nextVal = `${beforeLine}\n${afterCursor}`
    onUpdate(nextVal)
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = lineStart + 1
    })
    return true
  }

  // Insert a newline followed by the same bullet
  const beforeCursor = currentValue.substring(0, selectionStart)
  const afterCursor = currentValue.substring(selectionStart)
  const insertion = `\n${bulletPrefix}`
  const nextVal = beforeCursor + insertion + afterCursor
  onUpdate(nextVal)

  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = selectionStart + insertion.length
  })
  return true
}

/**
 * Generates customer email draft as visual HTML (no asterisks).
 */
export function generateCustomerBatchEmailHtml(
  customerName: string,
  city: string,
  techName: string,
  sites: EmailSiteItem[],
  template: EmailTemplateType = 'concise'
): string {
  if (template === 'blank') {
    return '<p><br></p>'
  }

  const formattedSitesHtml = sites
    .map((s) => {
      const siteDisplay = formatSiteAddressDisplay(s.siteName, s.siteAddress)
      const dateDutch = formatDateDutch(s.plannedDate)
      return `<li><strong>${siteDisplay}</strong>: ${dateDutch} van <strong>${s.startTime}</strong> tot <strong>${s.endTime}</strong></li>`
    })
    .join('')

  if (template === 'urgent') {
    return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>Het periodiek onderhoud aan uw installaties in <strong>${city}</strong> is dringend aan de beurt. We hebben reeds een prioritair tijdslot voor u gereserveerd in de planning:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  ${formattedSitesHtml}
</ul>
<p>Gelieve deze afspraak zo snel mogelijk te bevestigen zodat we de agenda van technicus <strong>${techName}</strong> definitief kunnen vastleggen.</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong><br>${VERLINDE_COMPANY.name}</p>`
  }

  if (template === 'standard') {
    return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>In het kader van het periodieke onderhoud aan uw installaties in <strong>${city}</strong> stelt Verlinde Beveiliging voor om de volgende werven in te plannen:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  ${formattedSitesHtml}
</ul>
<p>Onze technicus <strong>${techName}</strong> zal ter plaatse de nodige controles en het nazicht uitvoeren conform onze kwaliteitsnormen.</p>
<p><br></p>
<p>Past dit voorgestelde tijdstip voor u? Gelieve deze e-mail te beantwoorden ter bevestiging van de afspraak.</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong><br>${VERLINDE_COMPANY.name} • ${VERLINDE_COMPANY.city}</p>`
  }

  // Concise (default)
  return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>In het kader van het periodiek onderhoud in <strong>${city}</strong> stellen we voor om langs te komen op:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  ${formattedSitesHtml}
</ul>
<p>Onze technicus <strong>${techName}</strong> zal ter plaatse het nodige nazicht en onderhoud uitvoeren. Past dit tijdstip voor u?</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong> — ${VERLINDE_COMPANY.name}</p>`
}

/**
 * Generates customer email draft for technician batch maintenance in plain text.
 */
export function generateCustomerBatchEmail(
  customerName: string,
  city: string,
  techName: string,
  sites: EmailSiteItem[],
  template: EmailTemplateType = 'concise'
): string {
  if (template === 'blank') {
    return ''
  }

  const formattedSites = sites
    .map((s) => {
      const siteDisplay = formatSiteAddressDisplay(s.siteName, s.siteAddress)
      const dateDutch = formatDateDutch(s.plannedDate)
      return `• ${siteDisplay}: ${dateDutch} van ${s.startTime} tot ${s.endTime}`
    })
    .join('\n')

  if (template === 'urgent') {
    return `Beste ${customerName},

Het periodiek onderhoud aan uw installaties in ${city} is dringend aan de beurt. We hebben reeds een prioritair tijdslot voor u gereserveerd in de planning:

${formattedSites}

Gelieve deze afspraak zo snel mogelijk te bevestigen zodat we de agenda van technicus ${techName} definitief kunnen vastleggen.

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName}
${VERLINDE_COMPANY.name}`
  }

  if (template === 'standard') {
    return `Beste ${customerName},

In het kader van het periodieke onderhoud aan uw installaties in ${city} stelt Verlinde Beveiliging voor om de volgende werven in te plannen:

${formattedSites}

Onze technicus ${techName} zal ter plaatse de nodige controles en het nazicht uitvoeren conform onze kwaliteitsnormen.

Past dit voorgestelde tijdstip voor u? Gelieve deze e-mail te beantwoorden ter bevestiging van de afspraak.

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName}
${VERLINDE_COMPANY.name} • ${VERLINDE_COMPANY.city}`
  }

  // Concise (default)
  return `Beste ${customerName},

In het kader van het periodiek onderhoud in ${city} stellen we voor om langs te komen op:

${formattedSites}

Onze technicus ${techName} zal ter plaatse het nodige nazicht en onderhoud uitvoeren. Past dit tijdstip voor u?

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName} — ${VERLINDE_COMPANY.name}`
}

/**
 * Generates Fire compliance inspection email draft as visual HTML (no asterisks).
 */
export function generateFireInspectionEmailHtml(
  customerName: string,
  siteName: string,
  siteAddress: string,
  sheetNumber: string,
  proposedDate: string,
  startTime: string,
  endTime: string,
  template: EmailTemplateType = 'concise'
): string {
  if (template === 'blank') {
    return '<p><br></p>'
  }

  const dateDutch = formatDateDutch(proposedDate)
  const siteDisplay = formatSiteAddressDisplay(siteName, siteAddress)

  if (template === 'urgent') {
    return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>De wettelijke vervaldatum voor het branddetectienazicht van <strong>${siteDisplay}</strong> (fiche #${sheetNumber}) is overschreden.</p>
<p><br></p>
<p>We stellen prioritair voor om de keuring in te plannen op:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  <li>Datum: <strong>${dateDutch}</strong> van <strong>${startTime}</strong> tot <strong>${endTime}</strong></li>
  <li>Locatie: <strong>${siteDisplay}</strong></li>
</ul>
<p>Onderaannemer <strong>${BRANDTEC_PARTNER.name}</strong> voert de keuring uit conform <strong>${BRANDTEC_PARTNER.certificationStandard}</strong>. Gelieve dit tijdstip met spoed te bevestigen.</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong><br>${VERLINDE_COMPANY.name}</p>`
  }

  if (template === 'standard') {
    return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>In het kader van het wettelijk verplichte jaarlijkse onderhoud van de branddetectie-installatie stelt Verlinde Beveiliging voor om de keuring voor <strong>${siteDisplay}</strong> in te plannen op:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  <li>Datum: <strong>${dateDutch}</strong></li>
  <li>Tijdvenster: <strong>${startTime} – ${endTime}</strong></li>
  <li>Locatie: <strong>${siteDisplay}</strong> (fiche #${sheetNumber})</li>
</ul>
<p>Onderaannemer <strong>${BRANDTEC_PARTNER.name}</strong> zal deze keuring ter plaatse uitvoeren conform de geldende <strong>${BRANDTEC_PARTNER.certificationStandard}</strong>-normen. Na afronding wordt het officiële keuringsattest direct opgeladen in het beheerportaal.</p>
<p><br></p>
<p>Gelieve op dit bericht te antwoorden ter bevestiging van het voorgestelde tijdstip.</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong><br>${VERLINDE_COMPANY.name} • ${VERLINDE_COMPANY.city}</p>`
  }

  // Concise (default)
  return `<p>Beste <strong>${customerName}</strong>,</p>
<p><br></p>
<p>Voor het wettelijk jaarlijks nazicht branddetectie #${sheetNumber} stellen we voor:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  <li>Werf: <strong>${siteDisplay}</strong></li>
  <li>Datum: <strong>${dateDutch}</strong></li>
  <li>Tijdvenster: <strong>${startTime} – ${endTime}</strong></li>
</ul>
<p>Onderaannemer <strong>${BRANDTEC_PARTNER.name}</strong> voert deze keuring uit conform <strong>${BRANDTEC_PARTNER.certificationStandard}</strong>. Gelieve dit tijdstip te bevestigen.</p>
<p><br></p>
<p>Met vriendelijke groeten,<br><strong>${VERLINDE_COMPANY.managerName}</strong> — ${VERLINDE_COMPANY.name}</p>`
}

/**
 * Generates Fire compliance inspection email draft in plain text.
 */
export function generateFireInspectionEmail(
  customerName: string,
  siteName: string,
  siteAddress: string,
  sheetNumber: string,
  proposedDate: string,
  startTime: string,
  endTime: string,
  template: EmailTemplateType = 'concise'
): string {
  if (template === 'blank') {
    return ''
  }

  const dateDutch = formatDateDutch(proposedDate)
  const siteDisplay = formatSiteAddressDisplay(siteName, siteAddress)

  if (template === 'concise') {
    return `Beste ${customerName},

Voor het wettelijk jaarlijks nazicht branddetectie #${sheetNumber} stellen we voor:

• ${siteDisplay}
• Datum: ${dateDutch}
• Tijdvenster: ${startTime} – ${endTime}

Onderaannemer ${BRANDTEC_PARTNER.name} voert deze keuring uit conform ${BRANDTEC_PARTNER.certificationStandard}. Gelieve dit tijdstip te bevestigen.

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName} — ${VERLINDE_COMPANY.name}`
  }

  if (template === 'urgent') {
    return `Beste ${customerName},

De wettelijke vervaldatum voor het branddetectienazicht van ${siteDisplay} (fiche #${sheetNumber}) is overschreden.

We stellen prioritair voor om de keuring in te plannen op:
• ${dateDutch} van ${startTime} tot ${endTime}

Onderaannemer ${BRANDTEC_PARTNER.name} voert de keuring uit conform ${BRANDTEC_PARTNER.certificationStandard}. Gelieve dit tijdstip met spoed te bevestigen.

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName}
${VERLINDE_COMPANY.name}`
  }

  return `Beste ${customerName},

In het kader van het wettelijk verplichte jaarlijkse onderhoud van de branddetectie-installatie stelt Verlinde Beveiliging voor om de keuring voor ${siteDisplay} in te plannen op:

• Datum: ${dateDutch}
• Tijdvenster: ${startTime} – ${endTime}

Onderaannemer ${BRANDTEC_PARTNER.name} zal deze keuring ter plaatse uitvoeren conform de geldende ${BRANDTEC_PARTNER.certificationStandard}-normen. Na afronding wordt het officiële keuringsattest direct opgeladen in het beheerportaal.

Gelieve op dit bericht te antwoorden ter bevestiging van het voorgestelde tijdstip.

Met vriendelijke groeten,
${VERLINDE_COMPANY.managerName}
${VERLINDE_COMPANY.name} • ${VERLINDE_COMPANY.city}`
}

