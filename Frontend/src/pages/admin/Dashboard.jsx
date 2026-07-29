import { Card, Badge } from "@/components/ui";
import { useAdminStats, useInstructorDashboardCourses } from "@/hooks/useDashboard";
import { useAdminUsers } from "@/hooks/useUsers";
import { useAdminOrders } from "@/hooks/useOrders";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";

export function Dashboard() {
  const statsQuery = useAdminStats();
  const usersQuery = useAdminUsers({ limit: 5 });
  const ordersQuery = useAdminOrders({ limit: 5 });

  if (statsQuery.isLoading || usersQuery.isLoading || ordersQuery.isLoading) return <LoadingSpinner />;
  if (statsQuery.isError || usersQuery.isError || ordersQuery.isError) return <ErrorState description="We could not load platform stats." onRetry={() => statsQuery.refetch()} />;

  const stats = statsQuery.data || {};
  const users = usersQuery.data?.data || usersQuery.data || [];
  const orders = ordersQuery.data?.data || ordersQuery.data || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Admin dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-neutral-400">A quick look across users, courses, revenue, and orders.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Users" value={stats.users || 0} />
        <Stat label="Courses" value={stats.courses || 0} />
        <Stat label="Revenue" value={formatPrice(stats.revenue || 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent users">
          {users.length === 0 ? (
            <EmptyState title="No users" description="User data will appear here once available." />
          ) : (
            users.map((user) => <Row key={user._id} left={user.name} right={<Badge variant={user.status === "blocked" ? "danger" : "success"}>{user.status}</Badge>} sub={user.email} />)
          )}
        </Panel>
        <Panel title="Recent orders">
          {orders.length === 0 ? (
            <EmptyState title="No orders" description="Order data will appear here once available." />
          ) : (
            orders.map((order) => <Row key={order._id} left={`Order #${order._id.slice(-6)}`} right={<Badge variant={order.status === "paid" ? "success" : "secondary"}>{order.status}</Badge>} sub={formatDate(order.createdAt)} />)
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
    </Card>
  );
}

function Panel({ title, children }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </Card>
  );
}

function Row({ left, right, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">{left}</p>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{sub}</p>
        </div>
        {right}
      </div>
    </div>
  );
}
