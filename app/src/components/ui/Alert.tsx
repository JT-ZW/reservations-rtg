/**
 * Alert Component
 * Alert messages for feedback
 */

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  return (
    <div
      className={clsx(
        'rounded-lg p-4 border',
        {
          'bg-blue-50 border-blue-200 text-blue-900': variant === 'info',
          'bg-green-50 border-green-200 text-green-900': variant === 'success',
          'bg-yellow-50 border-yellow-200 text-yellow-900': variant === 'warning',
          'bg-red-50 border-red-200 text-red-900': variant === 'error',
        },
        className
      )}
      role="alert"
      {...props}
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
