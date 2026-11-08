import type { FileRouteTypes } from '#/routeTree.gen'

export interface RouteBreadcrumbConfig {
  title: string
  parent?: FileRouteTypes['to']
}

/**
 * Type-safe route metadata configuration mapped directly against
 * the generated TanStack Router FileRouteTypes['to'].
 */
export const ROUTE_CONFIG: Record<FileRouteTypes['to'], RouteBreadcrumbConfig> = {
  '/dashboard': {
    title: 'Dashboard',
  },
  '/clients': {
    title: 'Klanten & Installaties',
  },
  '/clients/$clientId': {
    title: 'Klantendossier',
    parent: '/clients',
  },
  '/planning': {
    title: 'Planning & Agenda',
  },
  '/week-schedule': {
    title: 'Weekplanning',
  },
  '/': {
    title: 'Aanmelden',
  },
  '/forgot-password': {
    title: 'Wachtwoord vergeten',
    parent: '/',
  },
  '/api/auth/$': {
    title: 'Authenticatie',
  },
}
