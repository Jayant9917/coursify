import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, ShoppingBag } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useUsers";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useOrders } from "@/hooks/useOrders";
import { useCourses } from "@/hooks/useCourses";
import { Card, Progress, Badge, Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { findCourseById, normalizeId } from "@/utils/courseUtils";
import { formatDate } from "@/utils/formatDate";

export function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const paymentNoticeShownRef = useRef(false);
  const meQuery = useCurrentUser();
  const enrollmentsQuery = useEnrollments();
  const paymentParams = new URLSearchParams(location.search);
  const paymentOrderId = paymentParams.get("payment") === "success" ? paymentParams.get("orderId") || "" : "";
  const ordersQuery = useOrders({ pollOrderId: paymentOrderId });
  const catalogQuery = useCourses({ limit: 100 });

  const orders = ordersQuery.data || [];
  const paymentOrder = orders.find((order) => String(order?._id) === String(paymentOrderId));

  useEffect(() => {
    if (paymentNoticeShownRef.current || !paymentOrder) return;

    if (paymentOrder.status === "paid") {
      toast.success("Payment confirmed. Your course is ready to learn.");
      paymentNoticeShownRef.current = true;
    } else if (["failed", "refunded"].includes(paymentOrder.status)) {
      toast.error(`Payment status: ${paymentOrder.status}.`);
      paymentNoticeShownRef.current = true;
    }
  }, [paymentOrder]);

  if (meQuery.isLoading || enrollmentsQuery.isLoading || ordersQuery.isLoading || catalogQuery.isLoading) {
    return <LoadingSpinner />;
  }
  if (meQuery.isError || enrollmentsQuery.isError || ordersQuery.isError || catalogQuery.isError) {
    return <ErrorState description="We could not load your dashboard right now." onRetry={() => meQuery.refetch()} />;
  }

  const enrollments = enrollmentsQuery.data || [];
  const catalog = catalogQuery.data?.data || catalogQuery.data || [];
  const stats = {
    enrolled: enrollments.length,
    completed: enrollments.filter((item) => item.status === "completed").length,
    inProgress: enrollments.filter((item) => item.status !== "completed").length,
  };
  const activeCourses = enrollments
    .filter((item) => item.status !== "completed")
    .slice(0, 3)
    .map((enrollment) => ({ enrollment, course: findCourseById(catalog, enrollment.courseId) }))
    .filter((item) => item.course);

  return (
    <div className="space-y-6">
      {paymentOrderId && (!paymentOrder || paymentOrder.status === "pending") ? (
        <Card className="border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">Payment is being confirmed</p>
          <p className="mt-1 text-sm opacity-80">
            Your payment was received by the provider. We are waiting for the secure confirmation before enrolling you.
          </p>
        </Card>
      ) : null}
      {paymentOrder?.status === "paid" ? (
        <Card className="border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <p className="font-semibold">Payment confirmed</p>
          <p className="mt-1 text-sm opacity-80">Your course enrollment is now available.</p>
        </Card>
      ) : null}
      <Card className="border-slate-200 p-6 dark:border-neutral-800">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Student dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Welcome back, {meQuery.data?.name || user?.name || "Learner"}.</h1>
        <p className="mt-2 text-slate-600 dark:text-neutral-400">Pick up where you left off and keep your momentum going.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Enrolled" value={stats.enrolled} icon={BookOpen} />
        <Stat label="Completed" value={stats.completed} icon={CheckCircle2} />
        <Stat label="In progress" value={stats.inProgress} icon={Clock3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Continue learning</h2>
            <Button variant="outline" asChild>
              <Link to="/student/courses">View all</Link>
            </Button>
          </div>
          <div className="mt-5 space-y-4">
            {activeCourses.length === 0 ? (
              <EmptyState title="No active courses" description="Enroll in a course to start learning." />
            ) : (
              activeCourses.map(({ enrollment, course }) => (
                <div key={enrollment._id} className="rounded-2xl border border-slate-200 p-4 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-950 dark:text-white">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{course.shortDescription || course.description}</p>
                    </div>
                    <Badge variant="secondary">{enrollment.progressPercent || 0}%</Badge>
                  </div>
                  <div className="mt-4">
                    <Progress value={enrollment.progressPercent || 0} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-neutral-400">Last updated {formatDate(enrollment.updatedAt)}</p>
                    <Button asChild size="sm">
                      <Link to={`/student/courses/${normalizeId(enrollment.courseId)}/learn`}>
                        Resume
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold">Recent orders</h2>
          <div className="mt-5 space-y-4">
            {orders.length === 0 ? (
              <EmptyState title="No orders yet" description="Your paid or pending orders will appear here." />
            ) : (
              orders.slice(0, 3).map((order) => (
                <div key={order._id} className="rounded-2xl border border-slate-200 p-4 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-950 dark:text-white">Order #{order._id.slice(-6)}</p>
                    <Badge variant={order.status === "paid" ? "success" : "secondary"}>{order.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Placed on {formatDate(order.createdAt)}</p>
                  <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">₹{order.amount}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-neutral-950">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
