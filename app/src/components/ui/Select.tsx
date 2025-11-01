/**
 * Select Component
 * Dropdown select with label and error state
 */

import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full rounded-lg border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300',
            className
          )}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
