import { Rocket, X } from "lucide-react";
import { useState } from "react";

export function Announcement() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <aside className="w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950" aria-label="Announcement">
      <div className="relative mx-auto flex min-h-11 w-full items-center justify-center px-12 py-2 sm:px-16">
        <div className="flex min-w-0 max-w-full items-center justify-center gap-2 text-sm">
          <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white dark:bg-[#BEF264] dark:text-neutral-950">
            NEW
          </span>
          <p className="min-w-0 flex-1 overflow-hidden text-center text-neutral-600 dark:text-neutral-300">
            <span className="announcement-marquee inline-block whitespace-nowrap">
              New dashboard experience is live with faster load times and smoother navigation.
            </span>
          </p>
          <button
            type="button"
            className="group hidden shrink-0 items-center gap-1 font-medium text-[#84CC16] transition-colors hover:text-[#65A30D] dark:text-[#BEF264] dark:hover:text-[#BEF264] sm:flex"
          >
            <span className="relative before:absolute before:-bottom-1 before:left-0 before:h-px before:w-full before:origin-right before:scale-x-0 before:bg-current before:transition-transform before:duration-300 group-hover:before:scale-x-100">
              Explore now
            </span>
            <Rocket className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-neutral-900 dark:hover:text-white sm:right-6"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
