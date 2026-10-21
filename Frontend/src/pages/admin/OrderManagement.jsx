import { useAdminOrders, useAdminOrderDetails, useAdminRefundOrder, useReplayWebhook, useWebhookMonitoring, useReconciliationCases, useRetryReconciliation, useResolveDispute } from "@/hooks/useOrders";
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
  const webhookQuery = useWebhookMonitoring(20);
  const replayWebhook = useReplayWebhook();
  const reconciliationQuery = useReconciliationCases(20);
  const retryReconciliation = useRetryReconciliation();
  const resolveDispute = useResolveDispute();

  if (ordersQuery.isLoading) return <LoadingSpinner />;
  if (ordersQuery.isError) return <ErrorState description="We could not load orders." onRetry={() => ordersQuery.refetch()} />;

  const orders = ordersQuery.data?.data || ordersQuery.data || [];

  const recordRefund = async (order) => {
    if (!window.confirm("Issue a provider refund for this paid order and revoke course access?")) return;
    try {
      await refundOrder.mutateAsync(order._id);
      toast.success("Refund issued and course access revoked");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const replay = async (delivery) => {
    if (!window.confirm("Replay this webhook through the normal payment reconciliation flow?")) return;
    try {
      await replayWebhook.mutateAsync(delivery._id);
      toast.success("Webhook replayed");
      await Promise.all([ordersQuery.refetch(), webhookQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const retryCase = async (item) => {
    try {
      await retryReconciliation.mutateAsync(item._id);
      toast.success("Payment reconciliation completed");
      await Promise.all([reconciliationQuery.refetch(), ordersQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const restoreDisputeAccess = async (item) => {
    if (!window.confirm("Confirm the provider resolved this dispute and restore course access?")) return;
    try {
      await resolveDispute.mutateAsync(item._id);
      toast.success("Dispute resolved and access restored");
      await Promise.all([reconciliationQuery.refetch(), ordersQuery.refetch()]);
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

      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Webhook monitoring</h2>
            <p className="text-sm text-slate-500">Review failed Lemon Squeezy deliveries and replay stored payloads.</p>
          </div>
          <Button variant="outline" onClick={() => webhookQuery.refetch()}>Refresh</Button>
        </div>
        {webhookQuery.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading webhook deliveries...</p> : webhookQuery.isError ? <p className="mt-4 text-sm text-red-600">Could not load webhook deliveries.</p> : (
          <div className="mt-4 space-y-3">
            {(webhookQuery.data || []).length === 0 ? <p className="text-sm text-slate-500">No webhook deliveries recorded yet.</p> : (webhookQuery.data || []).slice(0, 5).map((delivery) => (
              <div key={delivery._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{delivery.eventName || "Unknown event"} <span className="text-slate-400">· {delivery.localOrderId ? `Order ${delivery.localOrderId.slice(-6)}` : "No local order"}</span></p>
                  <p className="mt-1 text-xs text-slate-500">Attempts: {delivery.attempts || 0} · {delivery.lastError || delivery.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={delivery.status === "processed" ? "success" : delivery.status === "failed" ? "danger" : "secondary"}>{delivery.status}</Badge>
                  {delivery.status === "failed" ? <Button size="sm" variant="outline" onClick={() => replay(delivery)} disabled={replayWebhook.isPending}>Replay</Button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Payment reconciliation</h2>
            <p className="text-sm text-slate-500">Cases where payment, enrollment, or refund processing needs a safe retry.</p>
          </div>
          <Button variant="outline" onClick={() => reconciliationQuery.refetch()}>Refresh</Button>
        </div>
        {reconciliationQuery.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading reconciliation cases...</p> : (reconciliationQuery.data || []).length === 0 ? <p className="mt-4 text-sm text-slate-500">No open reconciliation cases.</p> : (
          <div className="mt-4 space-y-3">
            {(reconciliationQuery.data || []).map((item) => (
              <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium text-slate-950">{item.issue.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">Order {String(item.orderId).slice(-6)} · Attempts {item.attempts || 0} · {item.lastError || "Needs review"}</p></div>
                {item.issue === "dispute_review" ? <Button size="sm" variant="outline" onClick={() => restoreDisputeAccess(item)} disabled={resolveDispute.isPending}>Restore access</Button> : <Button size="sm" variant="outline" onClick={() => retryCase(item)} disabled={retryReconciliation.isPending}>Retry</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

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
                  {order.status === "paid" ? <Button variant="outline" onClick={() => recordRefund(order)}>Issue refund</Button> : null}
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
