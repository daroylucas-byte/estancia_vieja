import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-unit w-full">
        {label && (
          <label className="font-label-bold text-label-bold text-on-surface-variant flex items-center">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span 
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" 
              data-icon={icon}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full py-3 bg-white border border-outline-variant rounded-lg 
              font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent 
              outline-none transition-all placeholder:text-outline/50
              ${icon ? 'pl-10' : 'pl-4'}
              ${rightElement ? 'pr-10' : 'pr-4'}
              ${error ? 'border-error ring-error ring-1' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-error text-xs font-medium mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
