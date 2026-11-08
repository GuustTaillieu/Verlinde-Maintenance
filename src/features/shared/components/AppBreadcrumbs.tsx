import { Link, useLocation } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/features/shared/components/ui/breadcrumb'
import { resolveBreadcrumbs } from '#/features/shared/utils/breadcrumbs'

export function AppBreadcrumbs() {
  const location = useLocation()
  const items = resolveBreadcrumbs(location.pathname)

  return (
    <Breadcrumb aria-label="Navigatiekruimelpad">
      <BreadcrumbList className="text-xs gap-1.5 sm:gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <div key={`${item.label}-${idx}`} className="flex items-center gap-1.5 sm:gap-2">
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href} className="text-muted-foreground hover:text-foreground">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
