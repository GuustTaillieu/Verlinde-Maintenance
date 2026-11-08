/**
 * Centralized business constants for Verlinde Beveiliging.
 */
export const VERLINDE_COMPANY = {
  name: 'Verlinde Beveiliging BV',
  city: 'Zwevegem',
  managerName: 'Dirk Verlinde',
  dispatchPhone: '056 77 88 99',
  dispatchEmail: 'planning@verlinde-beveiliging.be',
  certificationStandard: 'NBN S 21-100',
} as const

export interface FirePartnerConfig {
  name: string
  contactPerson: string
  phone: string
  email: string
  dispatchEmail: string
  certificationStandard: string
}

export const DEFAULT_FIRE_PARTNER: FirePartnerConfig = {
  name: 'Brandtec BV',
  contactPerson: 'Dirk Vanderbeken (Dispatch & Planning)',
  phone: '056 22 44 88',
  email: 'planning@brandtec.be',
  dispatchEmail: 'dispatch@brandtec.be',
  certificationStandard: 'NBN S 21-100',
}

export const BRANDTEC_PARTNER = DEFAULT_FIRE_PARTNER



