'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSetOpen = React.useCallback((newOpen: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newOpen) {
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
      }, delayDuration);
    } else {
      setOpen(false);
    }
  }, [delayDuration]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen: handleSetOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({ children, asChild = false }: TooltipTriggerProps) {
  const { setOpen } = useTooltipContext();

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => setOpen(false);
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    });
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </span>
  );
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export function TooltipContent({
  children,
  className,
  side = 'top',
  sideOffset = 4,
}: TooltipContentProps) {
  const { open } = useTooltipContext();

  if (!open) return null;

  const positionClasses = {
    top: `bottom-full left-1/2 -translate-x-1/2 mb-${sideOffset}`,
    bottom: `top-full left-1/2 -translate-x-1/2 mt-${sideOffset}`,
    left: `right-full top-1/2 -translate-y-1/2 mr-${sideOffset}`,
    right: `left-full top-1/2 -translate-y-1/2 ml-${sideOffset}`,
  };

  return (
    <div
      className={cn(
        'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        className
      )}
    >
      {children}
    </div>
  );
}

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  // TooltipProvider is a passthrough for compatibility with shadcn/ui
  // Individual Tooltip components handle their own state
  return <>{children}</>;
}

