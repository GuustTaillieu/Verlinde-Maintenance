import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchAddressFn, type AddressSuggestion } from '#/features/shared/server/searchAddress'
import { useDebounce } from '#/features/shared/hooks/useDebounce'
import { Input } from '#/features/shared/components/ui/input'
import { cn } from '#/features/shared/lib/utils'
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react'

interface AddressFieldContextValue {
  street: string
  onStreetChange: (val: string) => void
  postalCode: string
  onPostalCodeChange: (val: string) => void
  city: string
  onCityChange: (val: string) => void
  suggestions: AddressSuggestion[]
  isLoading: boolean
  isVerified: boolean
  selectSuggestion: (suggestion: AddressSuggestion) => void
  showSuggestions: boolean
  setShowSuggestions: (show: boolean) => void
}

const AddressFieldContext = createContext<AddressFieldContextValue | null>(null)

function useAddressField() {
  const ctx = useContext(AddressFieldContext)
  if (!ctx) {
    throw new Error('AddressField subcomponents must be rendered within an AddressField.Root')
  }
  return ctx
}

interface AddressFieldRootProps {
  street: string
  onStreetChange: (val: string) => void
  postalCode: string
  onPostalCodeChange: (val: string) => void
  city: string
  onCityChange: (val: string) => void
  children: React.ReactNode
  className?: string
}

function AddressFieldRoot({
  street,
  onStreetChange,
  postalCode,
  onPostalCodeChange,
  city,
  onCityChange,
  children,
  className,
}: AddressFieldRootProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Debounce street input for API query
  const debouncedQuery = useDebounce(street.trim(), 350)

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['addressSearch', debouncedQuery],
    queryFn: () => searchAddressFn({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.length >= 3 && showSuggestions,
    staleTime: 1000 * 60 * 10,
  })

  const selectSuggestion = (s: AddressSuggestion) => {
    onStreetChange(s.street)
    if (s.postalCode) onPostalCodeChange(s.postalCode)
    if (s.city) onCityChange(s.city)
    setIsVerified(true)
    setShowSuggestions(false)
  }

  const handleStreetChange = (val: string) => {
    onStreetChange(val)
    setIsVerified(false)
    setShowSuggestions(true)
  }

  return (
    <AddressFieldContext.Provider
      value={{
        street,
        onStreetChange: handleStreetChange,
        postalCode,
        onPostalCodeChange,
        city,
        onCityChange,
        suggestions,
        isLoading,
        isVerified,
        selectSuggestion,
        showSuggestions,
        setShowSuggestions,
      }}
    >
      <div className={cn('space-y-2 relative', className)}>{children}</div>
    </AddressFieldContext.Provider>
  )
}

interface AddressFieldStreetProps extends React.ComponentProps<typeof Input> {
  label?: string
  placeholder?: string
}

function AddressFieldStreet({
  label = 'Straat en nummer',
  placeholder = 'bv. Kerkstraat 12 (begin met typen voor suggesties)',
  className,
  ...props
}: AddressFieldStreetProps) {
  const {
    street,
    onStreetChange,
    suggestions,
    isLoading,
    isVerified,
    selectSuggestion,
    showSuggestions,
    setShowSuggestions,
  } = useAddressField()

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowSuggestions])

  return (
    <div ref={containerRef} className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground font-medium block">
          {label}
        </label>
        {isVerified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Adres geverifieerd
          </span>
        )}
      </div>

      <div className="relative">
        <Input
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          onFocus={() => {
            if (street.length >= 3) setShowSuggestions(true)
          }}
          placeholder={placeholder}
          className={cn('text-xs h-9.5 pr-8', className)}
          {...props}
        />
        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions Popover */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur-md animate-in fade-in-50 zoom-in-95">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
            Suggesties in België
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {suggestions.map((s, idx) => (
              <li key={`${s.formatted}-${idx}`}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left flex items-start gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-xs transition-colors"
                >
                  <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground block truncate">
                      {s.street}
                    </span>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {s.postalCode ? `${s.postalCode} ` : ''}{s.city}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface AddressFieldPostalCodeProps extends React.ComponentProps<typeof Input> {
  label?: string
}

function AddressFieldPostalCode({
  label = 'Postcode',
  placeholder = 'bv. 8550',
  className,
  ...props
}: AddressFieldPostalCodeProps) {
  const { postalCode, onPostalCodeChange } = useAddressField()

  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground font-medium block">
        {label}
      </label>
      <Input
        value={postalCode}
        onChange={(e) => onPostalCodeChange(e.target.value)}
        placeholder={placeholder}
        className={cn('text-xs h-9.5', className)}
        {...props}
      />
    </div>
  )
}

interface AddressFieldCityProps extends React.ComponentProps<typeof Input> {
  label?: string
}

function AddressFieldCity({
  label = 'Gemeente',
  placeholder = 'bv. Zwevegem',
  className,
  ...props
}: AddressFieldCityProps) {
  const { city, onCityChange } = useAddressField()

  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground font-medium block">
        {label}
      </label>
      <Input
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
        placeholder={placeholder}
        className={cn('text-xs h-9.5', className)}
        {...props}
      />
    </div>
  )
}

export const AddressField = {
  Root: AddressFieldRoot,
  Street: AddressFieldStreet,
  PostalCode: AddressFieldPostalCode,
  City: AddressFieldCity,
}
