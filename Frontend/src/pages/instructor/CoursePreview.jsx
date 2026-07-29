import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleAlert, FileText, Lock, Play, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { courseApi } from "@/services/api";
import { Button, Card, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { stripHtml } from "@/utils/sanitizeHtml";

export function CoursePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentLessonId, setCurrentLessonId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaState, setMediaState] = useState("idle");
  const query = useQuery({ queryKey: ["instructor-course-preview", id], queryFn: () => courseApi.instructorDetails(id), enabled: Boolean(id) });
  const course = query.data?.course;
  const sections = query.data?.sections || [];
  const lessonData = query.data?.lessons;
  const lessons = useMemo(() => lessonData || [], [lessonData]);
  const currentLesson = useMemo(() => lessons.find((lesson) => String(lesson._id) === String(currentLessonId)) || lessons[0], [lessons, currentLessonId]);

  useEffect(() => {
    if (!currentLessonId && currentLesson?._id) setCurrentLessonId(String(currentLesson._id));
  }, [currentLessonId, currentLesson]);

  useEffect(() => {
    let active = true;
    setMediaUrl("");
    setMediaState("idle");
    if (!currentLesson || !["video", "pdf"].includes(currentLesson.type)) return undefined;
    courseApi.getLessonAccessUrl(id, currentLesson._id)
      .then((result) => {
        if (!active) return;
        setMediaUrl(result.url || currentLesson.videoUrl || currentLesson.content || "");
      })
      .catch((error) => {
        if (active) {
          setMediaState("error");
          toast.error(getApiErrorMessage(error));
        }
      });
    return () => { active = false; };
  }, [id, currentLesson]);

  if (query.isLoading) return <LoadingSpinner />;
  if (query.isError) return <ErrorState description="We could not load the course preview." onRetry={() => query.refetch()} />;
  if (!course) return <EmptyState title="Course not found" description="This course is no longer available for preview." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/instructor/courses")}><ArrowLeft className="h-4 w-4" />Back to courses</Button>
        <div className="flex items-center gap-2">
          <Badge variant={course.isPublished ? "success" : "secondary"}>{course.isPublished ? "Published" : "Draft preview"}</Badge>
          <Badge variant="outline">{course.discountPrice || course.price ? `₹${course.discountPrice || course.price}` : "Free"}</Badge>
          <Button asChild variant="outline"><Link to={`/instructor/courses/${course._id}/edit`}>Edit course</Link></Button>
        </div>
      </div>

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Instructor preview</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{course.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">This preview bypasses checkout so you can verify the course, lessons, and video playback before students see it.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
          <span>{sections.length} sections</span><span>·</span><span>{lessons.length} lessons</span><span>·</span><span>{lessons.filter((lesson) => lesson.type === "video" && (lesson.videoUrl || lesson.fileUrl)).length} media files ready</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit p-4 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-slate-950">Course curriculum</p>
          <div className="mt-4 space-y-4">
            {sections.map((section) => (
              <div key={section._id}>
                <p className="mb-2 text-sm font-semibold text-slate-700">{section.title}</p>
                <div className="space-y-1">
                  {lessons.filter((lesson) => String(lesson.sectionId) === String(section._id)).map((lesson) => {
                    const active = String(lesson._id) === String(currentLesson?._id);
                    return <button type="button" key={lesson._id} onClick={() => setCurrentLessonId(String(lesson._id))} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${active ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}><span>{lesson.type === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><span className="min-w-0 flex-1 truncate">{lesson.title}</span>{lesson.type === "video" && (lesson.videoUrl || lesson.fileUrl) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 opacity-50" />}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          {!currentLesson ? <div className="grid min-h-[420px] place-items-center"><p className="text-slate-500">Add a lesson to preview this course.</p></div> : <>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lesson preview</p><h2 className="mt-2 text-2xl font-black text-slate-950">{currentLesson.title}</h2></div><Badge variant="outline">{currentLesson.type}</Badge></div>
            <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950">
              {currentLesson.type === "video" ? mediaUrl ? <video controls preload="metadata" className="aspect-video w-full" src={mediaUrl} onLoadStart={() => setMediaState("loading")} onCanPlay={() => setMediaState("ready")} onError={() => setMediaState("error")} /> : <div className="grid aspect-video place-items-center text-white"><p>{mediaState === "error" ? "Video could not be loaded." : "Loading video…"}</p></div> : currentLesson.type === "pdf" ? mediaUrl ? <iframe title={currentLesson.title} src={mediaUrl} className="h-[520px] w-full bg-white" /> : <div className="grid min-h-[420px] place-items-center bg-white text-slate-600"><p>{mediaState === "error" ? "PDF could not be loaded." : "Loading PDF…"}</p></div> : <div className="prose prose-invert max-w-none p-6 whitespace-pre-line"><div>{stripHtml(currentLesson.content) || "No lesson content available."}</div></div>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">{currentLesson.type === "video" && mediaState === "ready" ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-emerald-700">Video playback check passed.</span></> : currentLesson.type === "video" && mediaState === "error" ? <><CircleAlert className="h-4 w-4 text-red-500" /><span className="text-red-700">Video playback check failed.</span></> : <span className="text-slate-500">Play the lesson to verify it before publishing.</span>}</div>
            <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => setMediaState("loading")}><Play className="h-4 w-4" />Test lesson</Button><Button variant="outline" asChild><Link to={`/instructor/courses/${course._id}/edit`}>Replace media</Link></Button></div>
          </>}
        </Card>
      </div>
    </div>
  );
}
