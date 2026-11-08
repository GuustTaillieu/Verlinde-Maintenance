import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { ClientListItem } from '#/features/clients/types'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/features/shared/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/features/shared/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/features/shared/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/shared/components/ui/select'
import {
  Building2,
  User,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface ClientTableProps {
  clients: ClientListItem[]
  selectedClientId: string | null
  onSelectClient: (id: string) => void
}

// Clean human-readable discipline names without database codes or standards
const DISCIPLINE_NAMES: Record<string, string> = {
  FIRE: 'Branddetectie',
  INTRUSION: 'Inbraakbeveiliging',
  CCTV: 'Camerabewaking',
  ACCESS: 'Toegangscontrole',
}

export function ClientTable({ clients, selectedClientId, onSelectClient }: ClientTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    address: true,
  })

  // Horizontal scroll tracking & controls
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = tableContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = tableContainerRef.current
    if (!el) return
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll, clients, columnVisibility])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!tableContainerRef.current) return
    const delta = direction === 'left' ? -280 : 280
    tableContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const columns = useMemo<ColumnDef<ClientListItem>[]>(
    () => [
      {
        accessorKey: 'code',
        id: 'code',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>Klantcode</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
              ) : (
                <ArrowUpDown className="ml-1.5 size-3 text-muted-foreground/50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>Klantnaam & Type</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
              ) : (
                <ArrowUpDown className="ml-1.5 size-3 text-muted-foreground/50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                {client.type === 'B2B' ? (
                  <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span>{client.name}</span>
              </span>
              {client.vatNumber && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {client.vatNumber}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'invoiceCity',
        id: 'city',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>Gemeente</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
              ) : (
                <ArrowUpDown className="ml-1.5 size-3 text-muted-foreground/50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-xs text-foreground font-medium">
            {row.original.invoiceCity || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'invoiceAddress',
        id: 'address',
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">Adres</span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[220px] block">
            {row.original.invoiceAddress || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'disciplines',
        id: 'disciplines',
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">Installaties</span>
        ),
        cell: ({ row }) => {
          const discs = row.original.disciplines
          const count = discs.length

          if (count === 0) {
            return <span className="text-xs text-muted-foreground/60">—</span>
          }

          return (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  title="Klik om geïnstalleerde systemen te bekijken"
                >
                  <Layers className="size-3 text-muted-foreground" />
                  <span>{count} {count === 1 ? 'systeem' : 'systemen'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2.5 space-y-2 text-xs shadow-md"
                align="start"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
                  Actieve installaties
                </div>
                <div className="space-y-1">
                  {discs.map((disc) => (
                    <div
                      key={disc}
                      className="flex items-center gap-2 rounded bg-muted/40 px-2 py-1.5 text-xs text-foreground font-medium"
                    >
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      <span>{DISCIPLINE_NAMES[disc] || disc}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        },
      },
      {
        accessorKey: 'totalSites',
        id: 'totalSites',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground text-center"
            >
              <span>Sites</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
              ) : (
                <ArrowUpDown className="ml-1.5 size-3 text-muted-foreground/50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-center">
            <span className="inline-block px-2.5 py-0.5 rounded bg-muted/60 text-xs font-medium text-foreground">
              {row.original.totalSites}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'healthStatus',
        id: 'healthStatus',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>Status</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
              ) : (
                <ArrowUpDown className="ml-1.5 size-3 text-muted-foreground/50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const health = row.original.healthStatus
          if (health === 'COMPLIANT') {
            return (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium text-xs px-2.5 py-0.5"
              >
                In orde
              </Badge>
            )
          }
          if (health === 'DUE_SOON') {
            return (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium text-xs px-2.5 py-0.5"
              >
                Naderend
              </Badge>
            )
          }
          return (
            <Badge
              variant="destructive"
              className="font-medium text-xs px-2.5 py-0.5"
            >
              Vervallen
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground text-right block pr-2">
            Acties
          </span>
        ),
        cell: ({ row }) => {
          const client = row.original
          return (
            <div
              className="flex items-center justify-end gap-1.5 pr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectClient(client.id)}
                className="h-7 px-2.5 text-xs gap-1.5 font-medium ml-1"
              >
                <Eye className="size-3.5" />
                <span>Bekijk</span>
              </Button>
            </div>
          )
        },
      },
    ],
    [onSelectClient]
  )

  const table = useReactTable({
    data: clients,
    columns,
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground bg-card">
        <Building2 className="size-10 stroke-[1.5] text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">Geen klanten gevonden</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Er zijn geen klanten die voldoen aan de huidige zoekterm of filters.
        </p>
      </div>
    )
  }

  const columnLabels: Record<string, string> = {
    code: 'Klantcode',
    name: 'Klantnaam',
    city: 'Gemeente',
    address: 'Adres',
    disciplines: 'Installaties',
    totalSites: 'Sites',
    healthStatus: 'Status',
    actions: 'Acties',
  }

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="space-y-3">
      {/* Table controls bar: Column visibility, scroll controls & result count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {totalRows} {totalRows === 1 ? 'klant' : 'klanten'}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>
            Getoond: {startRow}–{endRow}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Horizontal scroll helpers for any screen where table overflows */}
          {(canScrollLeft || canScrollRight) && (
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5 text-muted-foreground">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="size-7"
                title="Scroll tabel naar links"
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <span className="text-[11px] px-1 font-medium select-none">Scroll</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="size-7"
                title="Scroll tabel naar rechts"
              >
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Column visibility dropdown - stays open fluently when toggling items */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <SlidersHorizontal className="size-3.5" />
                <span>Kolommen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Kolommen aanpassen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs cursor-pointer"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Data Table with generous horizontal breathing space & visible scroll indicator */}
      <div className="relative rounded-xl border border-border bg-card shadow-xs">
        {/* Right fade gradient when scrollable content exists */}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card via-card/60 to-transparent z-10 transition-opacity"
            aria-hidden="true"
          />
        )}
        {/* Left fade gradient when scrolled to right */}
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card via-card/60 to-transparent z-10 transition-opacity"
            aria-hidden="true"
          />
        )}

        <div
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto w-full scroll-smooth"
        >
          <Table className="min-w-[900px] w-full">
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-10 px-4 text-xs font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const isSelected = selectedClientId === row.original.id
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => onSelectClient(row.original.id)}
                    className={`cursor-pointer transition-colors text-xs hover:bg-muted/40 ${isSelected ? 'bg-primary/5 font-medium' : ''
                      }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-2">
          <span>Rijen per pagina:</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="h-8 w-18 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 15, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-medium text-foreground">
            Pagina {table.getState().pagination.pageIndex + 1} van{' '}
            {Math.max(1, table.getPageCount())}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="size-8"
              title="Eerste pagina"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="size-8"
              title="Vorige pagina"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="size-8"
              title="Volgende pagina"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="size-8"
              title="Laatste pagina"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
