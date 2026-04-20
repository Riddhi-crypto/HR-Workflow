import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'sm',
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'px-2.5 py-1.5 text-[13px]' : 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-ink-950 text-white hover:bg-ink-900',
        variant === 'accent' && 'bg-accent text-white hover:bg-accent-hover',
        variant === 'ghost' &&
          'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50',
        variant === 'danger' &&
          'border border-red-200 bg-white text-red-700 hover:bg-red-50',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
