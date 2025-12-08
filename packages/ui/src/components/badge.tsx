import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        primary:
          'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
        secondary:
          'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
        success:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        warning:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        outline:
          'border border-gray-300 bg-transparent text-gray-700 dark:border-gray-600 dark:text-gray-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            {
              default: 'bg-gray-500',
              primary: 'bg-primary-500',
              secondary: 'bg-secondary-500',
              success: 'bg-green-500',
              warning: 'bg-yellow-500',
              error: 'bg-red-500',
              info: 'bg-blue-500',
              outline: 'bg-gray-500',
            }[variant || 'default']
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
