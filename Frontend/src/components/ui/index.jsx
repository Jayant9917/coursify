import React from "react";
import { cn } from "@/utils/cn";

export function Button({ className, variant = "default", size = "default", asChild = false, children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-[#171717] text-white hover:bg-lime-400 hover:text-black dark:bg-white dark:text-black dark:hover:bg-lime-300",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-lime-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
    ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800",
    outline: "border border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-6",
    icon: "h-10 w-10",
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(base, variants[variant], sizes[size], className, children.props.className),
      ...props,
    });
  }

  const Comp = "button";
  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Comp>
  );
}

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:ring-offset-neutral-900",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[96px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:ring-offset-neutral-900",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-medium text-neutral-700 dark:text-neutral-300", className)} {...props} />;
}

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-200",
    outline: "border border-slate-200 bg-white text-slate-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    info: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}

export function Card({ className, ...props }) {
  return <div className={cn("rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export function Avatar({ className, ...props }) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800", className)} {...props} />;
}

export function AvatarImage({ className, ...props }) {
  return <img className={cn("h-full w-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950", className)}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-neutral-800", className)} {...props} />;
}

export function Progress({ value = 0, className, ...props }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800", className)} {...props}>
      <div className="h-full rounded-full bg-slate-900 transition-all dark:bg-lime-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Separator({ className, ...props }) {
  return <div className={cn("h-px w-full bg-slate-200 dark:bg-neutral-800", className)} {...props} />;
}

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export function Table({ className, ...props }) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b transition-colors hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-900", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-neutral-400", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn("w-full", className)} data-tabs={value}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange }) : child
      )}
    </div>
  );
}

export function TabsList({ className, children }) {
  return <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400", className)}>{children}</div>;
}

export function TabsTrigger({ value, currentValue, onValueChange, className, children }) {
  const active = value === currentValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        active ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-950 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, currentValue, className, children }) {
  if (value !== currentValue) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
