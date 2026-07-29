import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminCourses } from "@/hooks/useCourses";
import { Button, Card, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { courseApi, getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatPrice";

export function CourseManagement() {
  const [page, setPage] = useState(1);
  const coursesQuery = useAdminCourses({ page, limit: 10 });

  if (coursesQuery.isLoading) return <LoadingSpinner />;
  if (coursesQuery.isError) return <ErrorState description="We could not load courses." onRetry={() => coursesQuery.refetch()} />;

  const courses = coursesQuery.data?.data || coursesQuery.data || [];

  const togglePublish = async (course) => {
    try {
      await courseApi.publish(course._id, !course.isPublished);
      toast.success(course.isPublished ? "Course unpublished" : "Course published");
      coursesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const remove = async (course) => {
    try {
      await courseApi.remove(course._id);
      toast.success("Course deleted");
      coursesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950">Course management</h1>
      </Card>

      {courses.length === 0 ? (
        <EmptyState title="No courses found" description="Course records will show up here." />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course._id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{course.title}</h3>
                  <p className="text-sm text-slate-500">{course.instructor?.name || course.instructorId || "Instructor"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/courses/${course.slug}`}>View</Link>
                  </Button>
                  <Badge variant="outline">{formatPrice(course.discountPrice || course.price)}</Badge>
                  <Badge variant="secondary">{course.enrollmentCount || 0} enrolled</Badge>
                  <Badge variant={course.isPublished ? "success" : "secondary"}>{course.isPublished ? "Published" : "Draft"}</Badge>
                  <Button variant="outline" onClick={() => togglePublish(course)}>
                    {course.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="destructive" onClick={() => remove(course)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <Pagination pagination={coursesQuery.data?.pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
