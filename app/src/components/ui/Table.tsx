/**
 * Table Component
 * Data table with sorting and actions
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={clsx('hover:bg-gray-50', className)}>{children}</tr>;
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ 
  children, 
  className,
  colSpan 
}: { 
  children: ReactNode; 
  className?: string;
  colSpan?: number;
}) {
  return (
    <td 
      colSpan={colSpan}
      className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}
    >
      {children}
    </td>
  );
}

export function TableEmpty({ colSpan, message = 'No data available' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}
