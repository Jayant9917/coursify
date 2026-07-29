import { Link } from "react-router-dom";
import { useInstructorCourses } from "@/hooks/useCourses";
import { Button, Card, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";

export function MyCourses() {
  const coursesQuery = useInstructorCourses({ limit: 50 });

  if (coursesQuery.isLoading) return <LoadingSpinner />;
  if (coursesQuery.isError) return <ErrorState description="We could not load your courses." onRetry={() => coursesQuery.refetch()} />;

  const courses = coursesQuery.data?.data || coursesQuery.data || [];

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">My Courses</h1>
          <p className="mt-2 text-slate-600">Create, edit, and publish courses.</p>
        </div>
        <Button asChild>
          <Link to="/instructor/courses/new">New course</Link>
        </Button>
      </Card>

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course from the editor." />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course._id} className="p-5 transition-shadow hover:shadow-md">
              <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">{course.shortDescription || course.description}</p>
                  <p className="mt-2 text-sm text-slate-500">Updated {formatDate(course.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                  <Badge variant={course.isPublished ? "success" : "secondary"}>{course.isPublished ? "Published" : "Draft"}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  <span className="whitespace-nowrap px-1 text-sm font-medium text-slate-600">{formatPrice(course.discountPrice || course.price)}</span>
                  <Button asChild variant="outline" className="shrink-0 whitespace-nowrap">
                    <Link to={`/instructor/courses/${course._id}/preview`}>Preview</Link>
                  </Button>
                  <Button asChild variant="outline" className="shrink-0 whitespace-nowrap">
                    <Link to={`/instructor/courses/${course._id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
