import React from 'react';

import { cn } from '../../utils/cn';

type BadgeTone = 'brand' | 'neutral' | 'success';

type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  leadingIcon?: React.ReactNode;
}

const toneMap: Record<BadgeTone, string> = {
  brand: 'badge-pill',
  neutral: 'badge-muted',
  success: 'badge-success'
};

const sizeMap: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2.5 py-0.5',
  md: 'text-xs px-3 py-1'
};

export const Badge: React.FC<BadgeProps> = ({
  tone = 'brand',
  size = 'md',
  leadingIcon,
  className,
  children,
  ...props
}) => (
  <span className={cn(toneMap[tone], sizeMap[size], className)} {...props}>
    {leadingIcon ? <span className="flex items-center justify-center text-[0.7rem]">{leadingIcon}</span> : null}
    {children}
  </span>
);
