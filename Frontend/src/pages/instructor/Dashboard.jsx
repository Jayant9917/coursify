import { Link } from "react-router-dom";
import { BookOpen, DollarSign, GraduationCap, Star } from "lucide-react";
import { useInstructorStats, useInstructorDashboardCourses } from "@/hooks/useDashboard";
import { Card, Button, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";

export function Dashboard() {
  const statsQuery = useInstructorStats();
  const coursesQuery = useInstructorDashboardCourses({ limit: 5 });

  if (statsQuery.isLoading || coursesQuery.isLoading) return <LoadingSpinner />;
  if (statsQuery.isError || coursesQuery.isError) return <ErrorState description="We could not load instructor stats." onRetry={() => statsQuery.refetch()} />;

  const stats = statsQuery.data || {};
  const courses = coursesQuery.data?.data || coursesQuery.data || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Instructor dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Teach with clarity.</h1>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Courses" value={stats.totalCourses || 0} icon={BookOpen} />
        <Stat label="Students" value={stats.totalStudents || 0} icon={GraduationCap} />
        <Stat label="Revenue" value={formatPrice(stats.revenue || 0)} icon={DollarSign} />
        <Stat label="Rating" value={(stats.ratingAvg || 0).toFixed(1)} icon={Star} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent courses</h2>
          <Button asChild variant="outline">
            <Link to="/instructor/courses">View all</Link>
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {courses.length === 0 ? (
            <EmptyState title="No courses yet" description="Create your first course to get started." />
          ) : (
            courses.map((course) => (
              <div key={course._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-neutral-800 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">{course.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Updated {formatDate(course.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={course.isPublished ? "success" : "secondary"}>{course.isPublished ? "Published" : "Draft"}</Badge>
                  <span className="text-sm text-slate-500 dark:text-neutral-400">{formatPrice(course.discountPrice || course.price)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
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
