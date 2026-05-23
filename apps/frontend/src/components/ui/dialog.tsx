import * as React from "react";
import { cn } from "@/lib/utils";

// Context so DialogContent can read the open state
const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

// Dialog always renders its children (including the trigger)
// Only the overlay + panel are conditional (handled inside DialogContent)
function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  const handleClick = () => onOpenChange(true);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler;
    }>;

    return React.cloneElement(child, {
      onClick: (e) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) handleClick();
      },
    });
  }
  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

// DialogContent reads from context — only renders the modal when open === true
function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
};
