import { cn } from '#/features/shared/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  rightComponent?: React.ReactNode
}

export function Header({
  title,
  subtitle,
  rightComponent,
  className,
  ...props
}: HeaderProps & React.ComponentProps<'div'>) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-12 mb-2", className)} {...props}>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {rightComponent}
    </div>
  )
}

