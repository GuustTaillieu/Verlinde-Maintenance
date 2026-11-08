import { useState, useEffect } from 'react'
import { Input } from '#/features/shared/components/ui/input'
import { Button } from '#/features/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/shared/components/ui/select'
import { Search, X, Filter, Building2, User } from 'lucide-react'
import type { GetClientsFilter } from '#/features/clients/types'
import { useDebounce } from '#/features/shared/hooks/useDebounce'

interface ClientFiltersProps {
  filters: GetClientsFilter
  onFilterChange: (newFilters: Partial<GetClientsFilter>) => void
  onReset: () => void
  availableCities?: string[]
}

export function ClientFilters({
  filters,
  onFilterChange,
  onReset,
  availableCities = ['Zwevegem', 'Kortrijk', 'Harelbeke', 'Waregem', 'Menen'],
}: ClientFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(localSearch, 250)

  // Sync from outside (e.g. reset button or URL popstate)
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  // Propagate debounced query to parent and URL
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onFilterChange])

  const isFiltered =
    localSearch !== '' ||
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.city !== 'ALL'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Debounced search query input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Zoek op klantcode, bedrijfsnaam, straat of gemeente..."
            className="pl-9 h-9 text-xs"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('')
                onFilterChange({ search: '' })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Customer Type Toggle */}
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'ALL' })}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filters.type === 'ALL'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Alle Types
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'B2B' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              filters.type === 'B2B'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="size-3" />
            <span>B2B</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'RESIDENTIAL' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              filters.type === 'RESIDENTIAL'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="size-3" />
            <span>Particulier</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span>Filters:</span>
        </div>

        {/* Maintenance Health Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(val) => onFilterChange({ status: val as GetClientsFilter['status'] })}
        >
          <SelectTrigger className="h-8 text-xs w-[170px]">
            <SelectValue placeholder="Onderhoudsstatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle statussen</SelectItem>
            <SelectItem value="COMPLIANT">In orde</SelectItem>
            <SelectItem value="DUE_SOON">Naderend (30-60d)</SelectItem>
            <SelectItem value="OVERDUE">Vervallen</SelectItem>
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Select
          value={filters.city}
          onValueChange={(val) => onFilterChange({ city: val })}
        >
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Gemeente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle gemeenten</SelectItem>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-3.5" />
            Filters wissen
          </Button>
        )}
      </div>
    </div>
  )
}
