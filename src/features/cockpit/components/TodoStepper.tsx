import * as React from 'react'
import { CircleCheck, CircleDashed } from 'lucide-react'
import { cn } from 'cn'

export type StepStatus = 'completed' | 'active' | 'upcoming'

interface StepperItemContextValue {
  status: StepStatus
  isLast: boolean
}

const StepperItemContext = React.createContext<StepperItemContextValue | null>(null)

function useStepperItem() {
  const context = React.useContext(StepperItemContext)
  if (!context) {
    throw new Error('Stepper compound subcomponents must be used within a StepperItem')
  }
  return context
}

export function Stepper({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('space-y-4 pt-1', className)} {...props}>
      {children}
    </div>
  )
}

interface StepperItemProps extends React.ComponentProps<'div'> {
  status: StepStatus
  isLast?: boolean
}

export function StepperItem({
  status,
  isLast = false,
  children,
  className,
  ...props
}: StepperItemProps) {
  return (
    <StepperItemContext.Provider value={{ status, isLast }}>
      <div className={cn('relative flex items-start gap-3', className)} {...props}>
        {!isLast && (
          <div
            className={cn(
              'absolute left-2.75 top-6 -bottom-4 w-px',
              status === 'completed'
                ? 'bg-foreground/20'
                : 'border-l border-dashed border-border'
            )}
          />
        )}
        {children}
      </div>
    </StepperItemContext.Provider>
  )
}

export function StepperIndicator({ className, ...props }: React.ComponentProps<'div'>) {
  const { status } = useStepperItem()
  return (
    <div
      className={cn(
        'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
        className
      )}
      {...props}
    >
      {status === 'completed' && (
        <CircleCheck className="size-5 fill-muted-foreground text-background" />
      )}
      {status === 'active' && (
        <CircleDashed className="size-5 text-foreground" />
      )}
      {status === 'upcoming' && (
        <CircleDashed className="size-4 text-muted-foreground" />
      )}
    </div>
  )
}

export function StepperContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 min-w-0 pt-0.5', className)} {...props} />
}

export function StepperHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

export function StepperTitle({ className, ...props }: React.ComponentProps<'span'>) {
  const { status } = useStepperItem()
  return (
    <span
      className={cn(
        'text-xs tracking-tight mt-0.5',
        status === 'active' && 'font-semibold text-foreground',
        status === 'completed' && 'font-medium text-muted-foreground',
        status === 'upcoming' && 'text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function StepperDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-[11px] text-muted-foreground font-mono', className)}
      {...props}
    />
  )
}

export function StepperAction({ className, ...props }: React.ComponentProps<'div'>) {
  const { status } = useStepperItem()
  if (status !== 'active') return null
  return <div className={cn('my-2.5', className)} {...props} />
}

// Adapter wrapper for convenient data-driven usage
export interface StepItem {
  id: string
  title: string
  status: StepStatus
  completedInfo?: React.ReactNode
  action?: React.ReactNode
}

interface TodoStepperProps {
  steps: StepItem[]
  className?: string
}

export function TodoStepper({ steps, className }: TodoStepperProps) {
  return (
    <Stepper className={className}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        return (
          <StepperItem key={step.id} status={step.status} isLast={isLast}>
            <StepperIndicator />
            <StepperContent>
              <StepperHeader>
                <StepperTitle>{step.title}</StepperTitle>
                {step.completedInfo && (
                  <StepperDescription>{step.completedInfo}</StepperDescription>
                )}
              </StepperHeader>
              {step.action && <StepperAction>{step.action}</StepperAction>}
            </StepperContent>
          </StepperItem>
        )
      })}
    </Stepper>
  )
}
