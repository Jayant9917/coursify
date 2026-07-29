import { Loader2 } from "lucide-react";

export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-neutral-500 dark:text-neutral-400">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
