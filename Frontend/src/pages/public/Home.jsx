import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Clock3, FileText, Layers3, LayoutGrid, List, Play, Search, Sparkles, Video } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCourseDetail, useCourses, useFeaturedCourses, useFreeCourses, useTrendingCourses } from "@/hooks/useCourses";
import { useEnrollments } from "@/hooks/useEnrollments";
import { Button, Card, Progress } from "@/components/ui";
import { CourseCard } from "@/components/common/CourseCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Hero1 } from "@/components/common/Hero1";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { findCourseById, normalizeId } from "@/utils/courseUtils";
import { getCourseArtwork } from "@/utils/courseArtwork";
import { brand } from "@/utils/brand";

export function Home() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const isStudent = user?.role === "student" && Boolean(accessToken);
  const categoriesQuery = useCategories();
  const coursesQuery = useFeaturedCourses();
  const trendingQuery = useTrendingCourses();
  const freeQuery = useFreeCourses();
  const enrollmentsQuery = useEnrollments(isStudent);
  const catalogQuery = useCourses({ limit: 100 }, { enabled: isStudent });
  const activeEnrollment = (enrollmentsQuery.data || []).find((item) => item.status === "active");
  const enrolledCourse = findCourseById(getItems(catalogQuery.data), activeEnrollment?.courseId);
  const continueDetailQuery = useCourseDetail(enrolledCourse?.slug);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="overflow-hidden bg-[#fbfbfa] dark:bg-[#111111]">
      <Hero1 onBrowse={() => navigate("/courses")} onSearch={(value) => navigate(value.trim() ? `/courses?search=${encodeURIComponent(value.trim())}` : "/courses")} />

      <section className="page-shell border-y border-neutral-200/70 py-24 dark:border-neutral-800/70 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div><p className="eyebrow">About {brand.name}</p><p className="mt-6 max-w-sm text-base leading-7 text-neutral-600 dark:text-neutral-300">{brand.description} Instructor guidance included.</p></div>
          <div><h2 className="max-w-4xl text-4xl font-bold leading-tight text-neutral-950 sm:text-5xl dark:text-white">Learning that turns curiosity into <span className="text-lime-500">practical capability.</span></h2><p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-500 dark:text-neutral-400">Learn through video and PDF lessons, continue from where you stopped, and follow clear paths from beginner skills to real-world application.</p></div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] bg-neutral-900 p-7 text-white shadow-sm dark:bg-neutral-950 sm:p-10 lg:min-h-[500px]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[36px] border-lime-300/80" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
                <p className="eyebrow text-neutral-400">Learning capabilities</p>
                <h2 className="mt-5 max-w-md text-4xl font-bold leading-[1.05] sm:text-[2.7rem]">A workspace built around how learning actually happens.</h2>
              </div>
              <div className="mt-auto rounded-2xl border border-white/15 bg-white/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-300 text-black"><BookOpen className="h-5 w-5" /></div>
                  <div className="min-w-0"><p className="text-sm font-semibold">Your learning workspace</p><p className="truncate text-xs text-neutral-400">Progress, lessons, and next steps in one place.</p></div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/5 rounded-full bg-lime-300" /></div>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <CapabilityBlock icon={Video} tone="lime" eyebrow="Video + PDF" title="Flexible lesson formats" description="Watch focused video lessons and use attached PDF resources." />
            <CapabilityBlock icon={Layers3} tone="dark" eyebrow="Progress saved" title="Continue from where you stopped" description="Lesson completion and course progress stay connected to your account." />
            <CapabilityBlock icon={FileText} tone="neutral" eyebrow="Guided paths" title="Move from beginner to capable" description="Follow structured courses and learning paths instead of guessing what comes next." />
          </div>
        </div>
      </section>

      <section className="page-shell pb-20 sm:pb-28">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Explore by discipline</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Choose a direction.</h2><p className="mt-2 text-neutral-500 dark:text-neutral-400">Find courses built around what you want to make next.</p></div></div>
        {categoriesQuery.isLoading ? <CategorySkeletons /> : categoriesQuery.isError ? <ErrorState description="We could not load categories right now." onRetry={() => categoriesQuery.refetch()} /> : (categoriesQuery.data || []).length === 0 ? <EmptyState title="No categories found" description="There are no active categories yet." icon={Search} actionLabel="Browse courses" onAction={() => navigate("/courses")} /> : <div className="mt-8 grid overflow-hidden border-y border-neutral-200 dark:border-neutral-800 sm:grid-cols-2 sm:divide-x sm:divide-neutral-200 sm:dark:divide-neutral-800">{(categoriesQuery.data || []).map((category, index) => <button key={category._id} type="button" className="group flex min-w-0 items-center gap-4 border-b border-neutral-200 py-5 text-left transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:border-neutral-800 dark:hover:bg-neutral-900 sm:px-5" onClick={() => navigate(`/courses?categoryId=${category._id}`)}><span className="w-8 shrink-0 font-mono text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-lg font-semibold text-neutral-950 dark:text-white">{category.name}</span><span className="hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">{category.slug}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime-500" /></button>)}</div>}
      </section>

      <section className="page-shell pb-28">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Featured</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Featured courses for this week.</h2></div><Button variant="outline" onClick={() => navigate("/courses")}>View all</Button></div>
        {coursesQuery.isLoading ? <LoadingSpinner /> : coursesQuery.isError ? <ErrorState description="We could not load featured courses right now." onRetry={() => coursesQuery.refetch()} /> : (coursesQuery.data?.data || coursesQuery.data || []).length === 0 ? (
          <EmptyState title="No featured courses" description="Featured courses will appear here once the backend has some published entries." icon={BookOpen} actionLabel="Create a course" onAction={() => toast.info("Open the instructor dashboard to create a course.")} />
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{(coursesQuery.data?.data || coursesQuery.data || []).map((course) => <CourseCard key={course._id} course={course} href={`/courses/${course.slug}`} actionLabel="Explore" />)}</div>
        )}
      </section>

      {isStudent && activeEnrollment && enrolledCourse ? (
        <ContinueLearning enrollment={activeEnrollment} course={enrolledCourse} detail={continueDetailQuery.data} onContinue={() => navigate(`/student/courses/${normalizeId(activeEnrollment.courseId)}/learn`)} />
      ) : null}

      <TrendingCoursesToggle query={trendingQuery} navigate={navigate} />

      <section className="page-shell py-20 sm:py-28">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Learning paths</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Go from curious to capable.</h2></div><Sparkles className="hidden h-6 w-6 text-lime-500 sm:block" /></div>
        <div className="grid gap-4 md:grid-cols-3">
          {learningPaths.map((path) => <button key={path.title} type="button" onClick={() => navigate(`/courses?search=${encodeURIComponent(path.query)}`)} className="group rounded-2xl border border-neutral-200 bg-white p-6 text-left transition hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#BEF264]"><span className="text-3xl">{path.icon}</span><h3 className="mt-5 text-xl font-bold text-neutral-950 transition-colors duration-200 dark:text-white dark:group-hover:text-[#BEF264]">{path.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{path.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors duration-200 dark:text-white dark:group-hover:text-[#BEF264]">Explore path <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}
        </div>
      </section>

      <CourseRail eyebrow="Free to start" title="Build momentum without a paywall." query={freeQuery} navigate={navigate} hideWhenEmpty emptyTitle="No free courses yet" emptyDescription="Free courses will appear here as instructors publish them." />

      <section className="page-shell py-20 sm:py-28">
        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[500px] overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900 sm:p-10">
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Questions, answered simply.</h2>
            <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {faqs.map((faq, index) => (
                <div key={faq.question}>
                  <button type="button" className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-white" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    {faq.question}
                    <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === index ? <p className="-mt-2 pb-5 pr-8 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{faq.answer}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-[500px] flex-col justify-between rounded-3xl bg-[#171717] p-7 text-white dark:bg-neutral-950 sm:p-10">
            <div>
              <p className="eyebrow text-lime-300">For instructors</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Your knowledge can move someone forward.</h2>
              <p className="mt-4 leading-7 text-neutral-300">Create practical courses, reach motivated learners, and manage your teaching journey from one calm workspace.</p>
            </div>
            <Button className="mt-10 w-full bg-lime-300 text-black hover:bg-lime-200 dark:bg-lime-300 dark:text-black dark:hover:bg-lime-200 sm:w-fit" size="lg" onClick={() => navigate("/register")}>Become an instructor <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      <section className="page-shell pb-28"><Card className="overflow-hidden border-neutral-200 bg-lime-300 dark:border-neutral-800 dark:bg-lime-300"><div className="flex flex-col gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"><div><p className="eyebrow text-neutral-700">Start today</p><h2 className="mt-2 max-w-2xl text-4xl font-bold text-neutral-950">Make the next lesson count.</h2></div><Button size="lg" className="bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800" onClick={() => navigate("/courses")}>Browse all courses <ArrowRight className="h-4 w-4" /></Button></div></Card></section>
    </div>
  );
}

function getItems(payload) {
  return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
}

function ContinueLearning({ enrollment, course, detail, onContinue }) {
  const lessons = detail?.lessons || [];
  const completed = enrollment.completedLessonIds?.length || Math.round((enrollment.progressPercent || 0) * lessons.length / 100);
  const nextLesson = lessons.find((lesson) => !enrollment.completedLessonIds?.some((id) => normalizeId(id) === normalizeId(lesson._id))) || lessons[completed];
  return <section className="page-shell py-20 sm:py-28"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Continue learning</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Pick up where you left off.</h2></div><Button variant="outline" onClick={onContinue}>My courses</Button></div><Card className="overflow-hidden border-neutral-200 dark:border-neutral-800"><div className="grid gap-0 md:grid-cols-[240px_1fr_auto]"><img src={course.thumbnailUrl || getCourseArtwork(course, "wide")} alt="" className="h-full min-h-48 w-full object-cover" /><div className="p-6"><p className="text-sm text-neutral-500 dark:text-neutral-400">{course.instructor?.name || course.instructorName || "Coursify Instructor"}</p><h3 className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">{course.title}</h3><div className="mt-5 flex items-center gap-3"><Progress value={enrollment.progressPercent || 0} className="max-w-xs" /><span className="text-sm font-semibold text-neutral-950 dark:text-white">{enrollment.progressPercent || 0}%</span></div><p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{completed} of {lessons.length || "--"} lessons completed</p><p className="mt-5 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"><Clock3 className="h-4 w-4" /> Up next: <span className="font-semibold text-neutral-950 dark:text-white">{nextLesson?.title || "Continue your next lesson"}</span></p></div><div className="flex items-end p-6 md:items-center"><Button onClick={onContinue}><Play className="h-4 w-4" /> Continue course</Button></div></div></Card></section>;
}

function CapabilityBlock({ icon: Icon, tone, eyebrow, title, description }) {
  const tones = { lime: "bg-lime-300 text-neutral-950", dark: "bg-neutral-900 text-white dark:bg-neutral-800", neutral: "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white" };
  return <div className={`rounded-3xl p-6 sm:p-7 ${tones[tone]}`}><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20"><Icon className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">{eyebrow}</p><h3 className="mt-2 text-2xl font-bold">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 opacity-75">{description}</p></div></div></div>;
}

function CategorySkeletons() {
  return <div className="mt-8 grid gap-x-6 sm:grid-cols-2">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[69px] animate-pulse border-b border-neutral-200 bg-neutral-100/60 dark:border-neutral-800 dark:bg-neutral-900/60" />)}</div>;
}

function TrendingCourses({ query, navigate }) {
  const items = getItems(query.data).slice(0, 6);
  return <section className="page-shell py-20 sm:py-28"><div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Trending courses</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">What learners are starting this week.</h2></div>{items.length > 0 ? <Button variant="outline" onClick={() => navigate("/courses")}>View all</Button> : null}</div>{query.isLoading ? <LoadingSpinner /> : query.isError ? <ErrorState description="We could not load trending courses right now." onRetry={() => query.refetch()} /> : items.length === 0 ? <EmptyState title="No trending courses yet" description="Published courses will appear here as learners discover them." icon={BookOpen} actionLabel="Browse courses" onAction={() => navigate("/courses")} /> : <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">{items.map((course, index) => <button type="button" key={course._id} onClick={() => navigate(`/courses/${course.slug}`)} className="group grid w-full grid-cols-[32px_64px_minmax(0,1fr)_20px] items-center gap-3 py-5 text-left transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400 dark:hover:bg-neutral-900 sm:grid-cols-[48px_64px_1fr_auto_auto_20px] sm:gap-4"><span className="font-mono text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span><img src={course.thumbnailUrl || getCourseArtwork(course, "wide")} alt="" loading="lazy" className="h-14 w-16 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate font-semibold text-neutral-950 dark:text-white">{course.title}</span><span className="mt-1 block truncate text-sm text-neutral-500 dark:text-neutral-400">{course.instructor?.name || course.instructorName || "Skillnest Instructor"}</span></span><span className="hidden text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 md:block">{course.level || "Course"}</span><span className="hidden items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 sm:flex"><span>{course.enrollmentCount || 0} learners</span><span>{Number(course.ratingAvg || 0).toFixed(1)} rating</span></span><ArrowUpRight aria-hidden="true" className="h-4 w-4 text-neutral-400 transition group-hover:text-lime-500" /></button>)}</div>}</section>;
}

function TrendingCoursesToggle({ query, navigate }) {
  const items = getItems(query.data).slice(0, 6);
  const [cardView, setCardView] = useState(false);

  if (query.isLoading) return <section className="page-shell py-20 sm:py-28"><LoadingSpinner /></section>;
  if (query.isError) return <section className="page-shell py-20 sm:py-28"><ErrorState description="We could not load trending courses right now." onRetry={() => query.refetch()} /></section>;
  if (items.length === 0) return <section className="page-shell py-20 sm:py-28"><EmptyState title="No trending courses yet" description="Published courses will appear here as learners discover them." icon={BookOpen} actionLabel="Browse courses" onAction={() => navigate("/courses")} /></section>;

  return (
    <section className="page-shell py-20 sm:py-28">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end sm:gap-4">
        <div><p className="eyebrow">Trending courses</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">What learners are starting this week.</h2></div>
        <Button variant="outline" className="shrink-0 gap-2" onClick={() => setCardView((current) => !current)}>
          {cardView ? <List aria-hidden="true" className="h-4 w-4" /> : <LayoutGrid aria-hidden="true" className="h-4 w-4" />}
          {cardView ? "View as list" : "View as cards"}
        </Button>
      </div>
      {cardView ? <div className="mt-8 grid items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">{items.map((course) => <CourseCard key={course._id} course={course} href={`/courses/${course.slug}`} actionLabel="View course" />)}</div> : <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">{items.map((course, index) => <button type="button" key={course._id} onClick={() => navigate(`/courses/${course.slug}`)} className="group grid w-full grid-cols-[28px_56px_minmax(0,1fr)_16px] items-center gap-2 py-5 text-left transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400 dark:hover:bg-neutral-900 sm:grid-cols-[48px_64px_1fr_auto_auto_20px] sm:gap-4"><span className="font-mono text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span><img src={course.thumbnailUrl || getCourseArtwork(course, "wide")} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover sm:h-14 sm:w-16" /><span className="min-w-0"><span className="block truncate font-semibold text-neutral-950 dark:text-white">{course.title}</span><span className="mt-1 block truncate text-sm text-neutral-500 dark:text-neutral-400">{course.instructor?.name || course.instructorName || "Skillnest Instructor"}</span></span><span className="hidden text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 md:block">{course.level || "Course"}</span><span className="hidden items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 sm:flex"><span>{course.enrollmentCount || 0} learners</span><span>{Number(course.ratingAvg || 0).toFixed(1)} rating</span></span><ArrowUpRight aria-hidden="true" className="h-4 w-4 text-neutral-400 transition group-hover:text-lime-500" /></button>)}</div>}
    </section>
  );
}

function CourseRail({ eyebrow, title, query, navigate, hideWhenEmpty = false, emptyTitle = "No courses found", emptyDescription = "Published courses will appear here soon." }) {
  const items = getItems(query.data);
  if (hideWhenEmpty && !query.isLoading && !query.isError && items.length === 0) return null;
  return <section className="page-shell py-20 sm:py-28"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">{title}</h2></div>{items.length > 0 ? <Button variant="outline" onClick={() => navigate("/courses")}>View all</Button> : null}</div>{query.isLoading ? <LoadingSpinner /> : query.isError ? <ErrorState description="We could not load these courses right now." onRetry={() => query.refetch()} /> : items.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} icon={BookOpen} actionLabel="Browse courses" onAction={() => navigate("/courses")} /> : <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{items.slice(0, 4).map((course) => <CourseCard key={course._id} course={course} href={`/courses/${course.slug}`} actionLabel="Explore" />)}</div>}</section>;
}

const learningPaths = [
  { icon: "01", title: "Build for the web", query: "web development", description: "A practical path from HTML and CSS foundations to full-stack projects." },
  { icon: "02", title: "Think like a designer", query: "design", description: "Learn the systems, workflows, and habits behind thoughtful digital products." },
  { icon: "03", title: "Grow your business", query: "business", description: "Sharpen the skills that help you communicate, lead, and create momentum." },
];

const faqs = [
  { question: "Can I learn at my own pace?", answer: "Yes. Enrollments stay in your account so you can return to lessons whenever you are ready." },
  { question: "Are there free courses?", answer: `Yes. ${brand.name} highlights published courses with a zero price in the Free to start section.` },
  { question: `Can I teach on ${brand.name}?`, answer: `Yes. Register as an instructor to create courses, organize lessons, and share your expertise.` },
  { question: "How do I track my progress?", answer: "The lesson player records completed lessons and shows your percentage on your dashboard and Continue Learning section." },
];

