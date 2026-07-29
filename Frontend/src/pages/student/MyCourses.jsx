import { Link } from "react-router-dom";
import { BookOpen, PlayCircle } from "lucide-react";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useCourses } from "@/hooks/useCourses";
import { Card, Badge, Button, Progress } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { findCourseById, normalizeId } from "@/utils/courseUtils";
import { getCourseArtwork } from "@/utils/courseArtwork";

export function MyCourses() {
  const enrollmentsQuery = useEnrollments();
  const catalogQuery = useCourses({ limit: 100 });

  if (enrollmentsQuery.isLoading || catalogQuery.isLoading) return <LoadingSpinner />;
  if (enrollmentsQuery.isError || catalogQuery.isError) return <ErrorState description="We could not load your courses." onRetry={() => enrollmentsQuery.refetch()} />;

  const enrollments = enrollmentsQuery.data || [];
  const catalog = catalogQuery.data?.data || catalogQuery.data || [];
  const items = enrollments
    .map((enrollment) => ({ enrollment, course: findCourseById(catalog, enrollment.courseId) }))
    .filter((item) => item.course);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">My Courses</h1>
        <p className="mt-2 text-slate-600 dark:text-neutral-400">Resume your active learning paths.</p>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No enrolled courses" description="Browse the catalog and enroll in a course to begin." icon={BookOpen} actionLabel="Browse courses" onAction={() => (window.location.href = "/courses")} />
      ) : (
        <div className="grid gap-4">
          {items.map(({ enrollment, course }) => (
            <Card key={enrollment._id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <img src={course.thumbnailUrl || getCourseArtwork(course)} alt={course.title} className="h-20 w-32 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{course.shortDescription || course.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{course.level}</Badge>
                      <Badge variant={enrollment.status === "completed" ? "success" : "outline"}>{enrollment.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-xs space-y-3">
                  <Progress value={enrollment.progressPercent || 0} />
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-neutral-400">
                    <span>{enrollment.progressPercent || 0}% complete</span>
                    <Button asChild size="sm">
                      <Link to={`/student/courses/${normalizeId(enrollment.courseId)}/learn`}>
                        <PlayCircle className="h-4 w-4" />
                        Continue
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
