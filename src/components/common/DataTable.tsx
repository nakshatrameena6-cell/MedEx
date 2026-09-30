import React from 'react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | number;
  getRowId?: (row: T, index: number) => string | number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  onRowClick,
  selectedRowId,
  getRowId,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={`medex-panel ${className}`}>
        <TableSkeleton rows={6} columns={columns.length} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`medex-panel ${className}`}>
        <ErrorState
          title="Failed to Load Table Data"
          message={errorMessage || 'An error occurred while fetching table data.'}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`medex-panel ${className}`}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`medex-panel overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-medex-topbar border-b border-medex-border text-medex-secondary text-2xs uppercase tracking-wider font-mono">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-3.5 py-2.5 font-semibold ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-medex-border-subtle">
            {data.map((row, idx) => {
              const rowId = getRowId ? getRowId(row, idx) : idx;
              const isSelected = selectedRowId !== undefined && selectedRowId === rowId;

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-medex-cyan/10 border-l-2 border-l-medex-cyan'
                      : 'hover:bg-medex-hover'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2.5 text-medex-primary align-middle ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : ((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3.5 py-2 bg-medex-surface/60 border-t border-medex-border flex items-center justify-between text-2xs font-mono text-medex-muted">
        <span>Showing {data.length} records</span>
        <span>MEDEx Data Engine</span>
      </div>
    </div>
  );
}
