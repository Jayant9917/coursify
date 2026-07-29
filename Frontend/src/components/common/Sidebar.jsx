import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";

export function Sidebar({ title, items }) {
  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-72">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-slate-900 text-white dark:bg-white dark:text-neutral-950" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              )
            }
            end={item.end}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
