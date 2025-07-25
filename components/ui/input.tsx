import * as React from 'react';

import { cn } from '@/lib/shared/utils/ui';

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        [
          'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs',
          'transition-[color,box-shadow] outline-none',
          'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
          'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30 md:text-sm',
        ],
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
