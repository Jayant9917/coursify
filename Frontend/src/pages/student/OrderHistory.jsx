import { useOrders } from "@/hooks/useOrders";
import { Card, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/utils/formatDate";

export function OrderHistory() {
  const ordersQuery = useOrders();

  if (ordersQuery.isLoading) return <LoadingSpinner />;
  if (ordersQuery.isError) return <ErrorState description="We could not load your orders." onRetry={() => ordersQuery.refetch()} />;

  const orders = ordersQuery.data || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Order History</h1>
      </Card>
      {orders.length === 0 ? (
        <EmptyState title="No orders found" description="Your course purchases will appear here." />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">Order #{order._id.slice(-6)}</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Placed {formatDate(order.createdAt)}</p>
                </div>
                <Badge variant={order.status === "paid" ? "success" : "secondary"}>{order.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-neutral-400">{order.currency}</p>
                <p className="text-xl font-bold text-slate-950 dark:text-white">₹{order.amount}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
