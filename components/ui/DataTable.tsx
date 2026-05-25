import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-[#13141C] border border-[#1e293b] rounded-xl py-2 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#48C6EF] transition-colors text-sm"
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1e293b] overflow-hidden bg-[#0b1221]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0f172a] border-b border-[#1e293b] text-slate-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 font-black uppercase tracking-wider text-[10px]"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center gap-2 hover:text-white transition-colors"
                                : ""
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ChevronUp className="w-3 h-3" />,
                              desc: <ChevronDown className="w-3 h-3" />,
                            }[header.column.getIsSorted() as string] ?? (
                              header.column.getCanSort() ? <ChevronsUpDown className="w-3 h-3 opacity-30" /> : null
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1e293b] hover:bg-[#13141C] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-500"
                  >
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500">
          Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} resultados
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-[#1e293b] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e293b] text-white transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-[#1e293b] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e293b] text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-sm text-slate-400 px-2">
            Página <strong className="text-white">{table.getState().pagination.pageIndex + 1}</strong> de{' '}
            <strong className="text-white">{table.getPageCount()}</strong>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-[#1e293b] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e293b] text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-[#1e293b] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e293b] text-white transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
