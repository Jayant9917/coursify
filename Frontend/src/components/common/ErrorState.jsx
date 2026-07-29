import { Button, Card } from "@/components/ui";
import { TriangleAlert } from "lucide-react";

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50/60 dark:border-red-950 dark:bg-red-950/30">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <TriangleAlert aria-hidden="true" className="h-10 w-10 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description || "Please try again in a moment."}</p>
        </div>
        {onRetry ? (
          <Button variant="destructive" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
