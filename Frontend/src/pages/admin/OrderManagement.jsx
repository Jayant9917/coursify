import { useAdminOrders, useAdminOrderDetails, useAdminRefundOrder } from "@/hooks/useOrders";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Badge, Button } from "@/components/ui";
import { Pagination } from "@/components/common/Pagination";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";

export function OrderManagement() {
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ordersQuery = useAdminOrders({ limit: 10, page });
  const detailsQuery = useAdminOrderDetails(selectedOrderId);
  const refundOrder = useAdminRefundOrder();

  if (ordersQuery.isLoading) return <LoadingSpinner />;
  if (ordersQuery.isError) return <ErrorState description="We could not load orders." onRetry={() => ordersQuery.refetch()} />;

  const orders = ordersQuery.data?.data || ordersQuery.data || [];

  const recordRefund = async (order) => {
    if (!window.confirm("Record this paid order as refunded and revoke course access?")) return;
    try {
      await refundOrder.mutateAsync(order._id);
      toast.success("Refund recorded and course access revoked");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950">Order management</h1>
      </Card>

      {detailsQuery.data ? (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Order details</h2>
              <p className="text-sm text-slate-500">#{detailsQuery.data.order?._id}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedOrderId(null)}>Close</Button>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
            <p>Customer: {detailsQuery.data.user?.email || "Unknown"}</p>
            <p>Status: {detailsQuery.data.order?.status}</p>
            <p>Total: ₹{detailsQuery.data.order?.amount}</p>
          </div>
          <div className="mt-4 space-y-2">
            {(detailsQuery.data.items || []).map((item) => <p key={item._id} className="text-sm text-slate-600">{item.course?.title || "Course"} · ₹{item.priceAtPurchase}</p>)}
          </div>
        </Card>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState title="No orders found" description="Order records will appear here." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">Order #{order._id.slice(-6)}</h3>
                  <p className="text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "paid" ? "success" : "secondary"}>{order.status}</Badge>
                  <Button variant="outline" onClick={() => setSelectedOrderId(order._id)}>Details</Button>
                  {order.status === "paid" ? <Button variant="outline" onClick={() => recordRefund(order)}>Record refund</Button> : null}
                  <Badge variant="outline">₹{order.amount}</Badge>
                </div>
              </div>
            </Card>
          ))}
          <Pagination pagination={ordersQuery.data?.pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
