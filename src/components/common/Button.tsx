import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'action-button inline-flex items-center justify-center font-medium font-sans transition-all focus-visible:outline-2 focus-visible:outline-theme-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const variantClasses = {
    primary:
      'bg-theme-primary text-theme-on-primary hover:bg-theme-primary-hover shadow-sm',
    secondary:
      'border border-theme-border text-theme-text hover:border-theme-border-control hover:bg-theme-primary-tint bg-theme-surface',
    ghost:
      'text-theme-text hover:bg-theme-border/50 bg-transparent',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-[12px] gap-1.5',
    md: 'h-10 px-4 text-[14px] gap-2',
    lg: 'h-12 px-5 text-[14px] gap-2',
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
      )}
    </button>
  );
};
