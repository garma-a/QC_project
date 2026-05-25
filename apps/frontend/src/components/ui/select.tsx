import * as React from "react";
import { cn } from "@/lib/utils";

// Native <select> wrapper styled to match the design system.
// No Radix dependency needed.

interface SelectProps extends React.ComponentProps<"select"> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

interface SelectOptionProps extends React.ComponentProps<"option"> {}

function SelectOption({ ...props }: SelectOptionProps) {
  return <option {...props} />;
}

export { Select, SelectOption };
