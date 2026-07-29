import { Button, Card } from "@/components/ui";

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon, className = "" }) {
  return (
    <Card className={className || "border-dashed"}>
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        {Icon ? <Icon aria-hidden="true" className="h-10 w-10 text-neutral-400 dark:text-neutral-500" /> : null}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        </div>
        {actionLabel ? (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
