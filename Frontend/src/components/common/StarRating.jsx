import { Star } from "lucide-react";

export function StarRating({ value = 0, className = "" }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div className={`flex items-center gap-0.5 ${className}`.trim()}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < rounded ? "fill-lime-400 text-lime-500" : "text-neutral-300 dark:text-neutral-600"}`} />
      ))}
    </div>
  );
}
