import { useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleAlert, Clock3, RotateCw, ShoppingBag } from "lucide-react";
import { useOrderStatus } from "@/hooks/useOrders";
import { Button, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { getApiErrorMessage } from "@/services/api";

export function PaymentResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const paymentState = searchParams.get("payment") || "success";
  const orderQuery = useOrderStatus(orderId);

  if (paymentState === "cancelled" || paymentState === "canceled") {
    return <PaymentState icon={ShoppingBag} title="Checkout canceled" description="No payment was confirmed. You can return to the course and try again whenever you are ready." actions={[{ label: "Browse courses", href: "/courses" }]} />;
  }

  if (!orderId) {
    return <PaymentState icon={CircleAlert} title="Payment result unavailable" description="We could not identify the order from this checkout return." actions={[{ label: "Go to dashboard", href: "/student/dashboard" }]} />;
  }

  if (orderQuery.isLoading) return <LoadingSpinner label="Checking your payment..." />;
  if (orderQuery.isError) return <ErrorState description={getApiErrorMessage(orderQuery.error)} onRetry={() => orderQuery.refetch()} />;

  const order = orderQuery.data;
  if (order?.status === "paid") {
    return <PaymentState icon={CheckCircle2} tone="success" title="Payment successful" description="Your payment is confirmed and your course enrollment is ready." orderId={orderId} actions={[{ label: "Start learning", href: "/student/courses", primary: true }, { label: "View dashboard", href: "/student/dashboard" }]} />;
  }

  if (order?.status === "refunded") {
    return <PaymentState icon={CircleAlert} tone="danger" title="Payment refunded" description="This order was refunded, so course access is no longer active." orderId={orderId} actions={[{ label: "Browse courses", href: "/courses" }]} />;
  }

  if (order?.status === "failed") {
    return <PaymentState icon={CircleAlert} tone="danger" title="Payment failed" description="The payment was not completed. No course enrollment was created for this order." orderId={orderId} actions={[{ label: "Try again", href: "/courses" }]} />;
  }

  return <PaymentState icon={Clock3} tone="pending" title="Payment is being confirmed" description="Lemon Squeezy has returned you to Skillnest. We are waiting for the verified webhook before granting course access." orderId={orderId} actions={[{ label: "Refresh status", onClick: () => orderQuery.refetch(), icon: RotateCw }, { label: "Go to dashboard", href: "/student/dashboard" }]} />;
}

function PaymentState({ icon: Icon, tone = "neutral", title, description, orderId, actions = [] }) {
  const toneClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    danger: "border-red-200 bg-red-50 text-red-950 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
    pending: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    neutral: "border-slate-200 bg-white text-slate-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white",
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className={`w-full max-w-xl p-8 text-center ${toneClasses[tone]}`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/80 dark:bg-neutral-950/50">
          <Icon className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] opacity-70">Payment status</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 opacity-80">{description}</p>
        {orderId ? <p className="mt-5 text-xs opacity-60">Order ID: {orderId}</p> : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {actions.map((action) => action.href ? (
            <Button key={action.label} asChild variant={action.primary ? "default" : "outline"}>
              <a href={action.href}>{action.label}<ArrowRight className="h-4 w-4" /></a>
            </Button>
          ) : (
            <Button key={action.label} variant="outline" onClick={action.onClick}>
              {action.icon ? <action.icon className="h-4 w-4" /> : null}{action.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
