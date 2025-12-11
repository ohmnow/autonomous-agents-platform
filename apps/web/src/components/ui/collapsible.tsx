'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined);

function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used within a Collapsible');
  }
  return context;
}

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ children, defaultOpen = false, open: controlledOpen, onOpenChange, className, ...props }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    
    const setOpen = React.useCallback((value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(newValue);
      }
      onOpenChange?.(newValue);
    }, [isControlled, open, onOpenChange]);

    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = 'Collapsible';

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ asChild, children, className, onClick, ...props }, ref) => {
  const { open, setOpen } = useCollapsible();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: typeof handleClick; 'data-state'?: string }>, {
      onClick: handleClick,
      'data-state': open ? 'open' : 'closed',
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      data-state={open ? 'open' : 'closed'}
      className={cn('flex w-full items-center justify-between', className)}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-200',
          open && 'rotate-180'
        )}
      />
    </button>
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

interface CollapsibleContentProps {
  children: React.ReactNode;
  forceMount?: boolean;
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps & React.HTMLAttributes<HTMLDivElement>
>(({ children, forceMount, className, ...props }, ref) => {
  const { open } = useCollapsible();

  if (!open && !forceMount) {
    return null;
  }

  return (
    <div
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden transition-all',
        open ? 'animate-in fade-in-0 slide-in-from-top-1' : 'animate-out fade-out-0 slide-out-to-top-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
