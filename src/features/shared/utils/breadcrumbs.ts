import { ROUTE_CONFIG } from '#/features/shared/constants/routes'
import type { FileRouteTypes } from '#/routeTree.gen'

export interface BreadcrumbItemData {
  label: string
  href?: string
  isCurrent: boolean
}

/**
 * Resolves breadcrumb items type-safely based on TanStack Router generated routes.
 */
export function resolveBreadcrumbs(pathname: string): BreadcrumbItemData[] {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'

  // 1. Direct exact match in ROUTE_CONFIG
  if (cleanPath in ROUTE_CONFIG) {
    const routeKey = cleanPath as FileRouteTypes['to']
    const config = ROUTE_CONFIG[routeKey]
    const trail: BreadcrumbItemData[] = []

    if (config.parent && config.parent in ROUTE_CONFIG) {
      trail.push({
        label: ROUTE_CONFIG[config.parent].title,
        href: config.parent,
        isCurrent: false,
      })
    }

    trail.push({
      label: config.title,
      isCurrent: true,
    })

    return trail
  }

  // 2. Pattern match for parameterized routes (e.g. /clients/:id -> /clients/$clientId)
  const clientDetailMatch = cleanPath.match(/^\/clients\/([^/]+)$/)
  if (clientDetailMatch) {
    const config = ROUTE_CONFIG['/clients/$clientId']
    return [
      {
        label: ROUTE_CONFIG['/clients'].title,
        href: '/clients',
        isCurrent: false,
      },
      {
        label: config.title,
        isCurrent: true,
      },
    ]
  }

  // 3. Fallback: humanized segments
  const segments = cleanPath.split('/').filter(Boolean)
  if (segments.length === 0) {
    return [{ label: ROUTE_CONFIG['/dashboard'].title, isCurrent: true }]
  }

  return segments.map((seg, i) => {
    const isLast = i === segments.length - 1
    const label = seg
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    return {
      label,
      href: isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`,
      isCurrent: isLast,
    }
  })
}
