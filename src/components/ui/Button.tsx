import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-soft focus-visible:ring-brand-300',
    secondary:
      'bg-moss-600 hover:bg-moss-700 active:bg-moss-800 text-white shadow-soft focus-visible:ring-moss-300',
    outline:
      'border border-brand-300 text-brand-700 hover:bg-brand-50/80 focus-visible:ring-brand-200',
    ghost: 'text-sand-600 hover:text-sand-900 hover:bg-sand-100/60 focus-visible:ring-sand-200'
  } satisfies Record<NonNullable<ButtonProps['variant']>, string>;

  const sizes = {
    sm: 'px-3.5 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm md:text-base gap-2',
    lg: 'px-6 py-3 text-base md:text-lg gap-2.5'
  } satisfies Record<NonNullable<ButtonProps['size']>, string>;

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
