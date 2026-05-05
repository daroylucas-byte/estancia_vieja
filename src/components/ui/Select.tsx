import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-unit w-full">
        {label && (
          <label className="font-label-bold text-label-bold text-on-surface-variant">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2 bg-white border border-outline rounded-lg 
            focus:ring-2 focus:ring-primary focus:border-primary 
            font-body-md transition-all appearance-none cursor-pointer
            ${error ? 'border-error' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>Elegir...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-error text-xs font-medium mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
