import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-label-bold uppercase tracking-tight';
  
  const variants = {
    primary: 'bg-primary-container text-white hover:brightness-110 shadow-sm',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80',
    outline: 'border border-outline text-primary hover:bg-surface-container-low',
    ghost: 'text-primary hover:bg-surface-container-low',
    error: 'bg-error text-white hover:bg-error/90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-4 text-lg rounded-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin" data-icon="progress_activity">
          progress_activity
        </span>
      ) : (
        <>
          {leftIcon && (
            <span className="material-symbols-outlined text-[18px]" data-icon={leftIcon}>
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="material-symbols-outlined text-[18px]" data-icon={rightIcon}>
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
