import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Lock, Play, Video, CircleDashed } from "lucide-react";
import { useCourses, useCourseDetail } from "@/hooks/useCourses";
import { useCourseProgress, useEnrollments, useUpdateProgress } from "@/hooks/useEnrollments";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, Progress, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { findCourseById, getEnrollmentForCourse, groupLessonsBySection, normalizeId } from "@/utils/courseUtils";
import { getPreviousRoute } from "@/utils/routeHistory";
import { stripHtml } from "@/utils/sanitizeHtml";
import { courseApi, getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

export function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const courseCatalogQuery = useCourses({ limit: 100 });
  const enrollmentsQuery = useEnrollments();
  const progressQuery = useCourseProgress(id);
  const updateProgress = useUpdateProgress();
  const [currentLessonId, setCurrentLessonId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaError, setMediaError] = useState("");

  const catalog = courseCatalogQuery.data?.data || courseCatalogQuery.data || [];
  const courseSummary = findCourseById(catalog, id);
  const courseSlug = courseSummary?.slug;
  const detailQuery = useCourseDetail(courseSlug);
  const enrollment = getEnrollmentForCourse(enrollmentsQuery.data || [], id);
  const course = detailQuery.data?.course;
  const sections = detailQuery.data?.sections || [];
  const lessons = detailQuery.data?.lessons || [];
  const lessonsBySection = useMemo(() => groupLessonsBySection(lessons), [lessons]);
  const completedIds = new Set((progressQuery.data || []).filter((record) => record.isCompleted).map((record) => normalizeId(record.lessonId)));
  const completionPercent = enrollment?.progressPercent || 0;
  const goBack = () => {
    const previousRoute = getPreviousRoute();
    navigate(previousRoute || `/courses/${course?.slug || courseSummary?.slug || id}`);
  };

  useEffect(() => {
    if (!currentLessonId && lessons.length > 0) {
      const lastViewed = enrollment?.lastViewedLessonId;
      const firstVisible = lessons.find((lesson) => lesson.isPreview) || lessons[0];
      setCurrentLessonId(normalizeId(lastViewed || firstVisible?._id));
    }
  }, [currentLessonId, enrollment, lessons]);

  const currentLesson = lessons.find((lesson) => normalizeId(lesson._id) === normalizeId(currentLessonId));

  useEffect(() => {
    let active = true;
    setMediaUrl("");
    setMediaError("");
    if (!currentLesson || !["video", "pdf"].includes(currentLesson.type)) return undefined;

    courseApi.getLessonAccessUrl(id, currentLesson._id)
      .then((result) => {
        if (active) setMediaUrl(result.url || "");
      })
      .catch((error) => {
        if (active) setMediaError(getApiErrorMessage(error));
      });

    return () => { active = false; };
  }, [id, currentLesson]);

  if (courseCatalogQuery.isLoading || enrollmentsQuery.isLoading || progressQuery.isLoading) return <LoadingSpinner />;
  if (courseCatalogQuery.isError) return <ErrorState description="We could not load your course list." onRetry={() => courseCatalogQuery.refetch()} />;
  if (detailQuery.isLoading) return <LoadingSpinner />;
  if (detailQuery.isError) return <ErrorState description="We could not load this course." onRetry={() => detailQuery.refetch()} />;
  if (!course) return <EmptyState title="Course unavailable" description="This course could not be found in the catalog." />;

  const completeLesson = async (lesson) => {
    try {
      await updateProgress.mutateAsync({
        courseId: id,
        lessonId: lesson._id,
        watchedSeconds: lesson.duration || 0,
        isCompleted: true,
      });
      toast.success("Lesson marked as complete");
      progressQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit border-slate-200 p-4 dark:border-neutral-800 lg:sticky lg:top-24">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{course.level}</p>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white">{course.title}</h1>
          <Progress value={completionPercent} />
          <p className="text-xs text-slate-500 dark:text-neutral-400">{completionPercent}% complete</p>
        </div>
        <div className="mt-5 space-y-4">
          {sections.map((section) => (
            <details key={section._id} open className="rounded-2xl border border-slate-200 p-3 dark:border-neutral-800">
              <summary className="cursor-pointer list-none font-medium text-slate-900 dark:text-white">{section.title}</summary>
              <div className="mt-3 space-y-2">
                {(lessonsBySection[section._id] || []).map((lesson) => {
                  const completed = completedIds.has(normalizeId(lesson._id));
                  const locked = !lesson.isPreview && !enrollment;
                  return (
                    <button
                      key={lesson._id}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                        normalizeId(currentLessonId) === normalizeId(lesson._id) ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                      }`}
                      onClick={() => !locked && setCurrentLessonId(normalizeId(lesson._id))}
                    >
                      {locked ? <Lock className="h-4 w-4" /> : completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : lesson.type === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="flex-1">{lesson.title}</span>
                      <span className="text-xs opacity-70">{lesson.duration || 0}m</span>
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Lesson player</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{currentLesson?.title || "Select a lesson"}</h2>
            </div>
            <Badge variant="secondary">{completionPercent}%</Badge>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            {!currentLesson ? (
              <div className="grid min-h-[420px] place-items-center text-white">
                <p>Select a lesson to begin.</p>
              </div>
            ) : currentLesson.type === "video" ? (
              mediaUrl ? <video controls className="w-full" src={mediaUrl} /> : <div className="grid min-h-[420px] place-items-center text-white"><p>{mediaError || "Loading lesson video..."}</p></div>
            ) : currentLesson.type === "pdf" ? (
              <div className="space-y-3 bg-white p-4">
                {mediaUrl ? <iframe title={currentLesson.title} src={mediaUrl} className="h-[520px] w-full bg-white" /> : <p className="p-4 text-slate-600">{mediaError || "Loading PDF..."}</p>}
                {mediaUrl ? (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Open PDF in new tab
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="prose prose-invert max-w-none p-6 whitespace-pre-line">
                <div>{stripHtml(currentLesson.content) || "No content available."}</div>
              </div>
            )}
          </div>
          {currentLesson ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => completeLesson(currentLesson)} disabled={!enrollment}>
                <CircleDashed className="h-4 w-4" />
                Mark complete
              </Button>
              <Button variant="outline" onClick={() => navigate(`/courses/${course.slug}`)}>
                Back to course
              </Button>
              <Button variant="ghost" onClick={goBack}>
                Back
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
