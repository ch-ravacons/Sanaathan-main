import React from 'react';

import { cn } from '../../utils/cn';

type CardVariant = 'default' | 'subtle' | 'accent';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const variantMap: Record<CardVariant, string> = {
  default: 'card',
  subtle: 'card card-muted',
  accent: 'card bg-gradient-to-br from-brand-50/90 to-white border-brand-100 shadow-panel'
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => (
  <div className={cn(variantMap[variant], paddingMap[padding], className)} {...props}>
    {children}
  </div>
);
