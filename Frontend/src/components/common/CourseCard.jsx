import { Link } from "react-router-dom";
import { Badge, Button, Card } from "@/components/ui";
import { StarRating } from "@/components/common/StarRating";
import { formatPrice } from "@/utils/formatPrice";
import { truncate } from "@/utils/truncate";
import { BookOpen, Users } from "lucide-react";
import { getCourseArtwork } from "@/utils/courseArtwork";
import { brand } from "@/utils/brand";

export function CourseCard({ course, href, actionLabel = "View Course", onAction }) {
  const price = course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price;
  const hasDiscount = course.discountPrice && course.discountPrice > 0 && course.discountPrice < course.price;
  const lessonCount = course.lessonCount || course.lessonsCount || course.sections?.reduce((count, section) => count + (section.lessons?.length || 0), 0) || 0;

  return (
    <Card className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-400 hover:shadow-lg focus-within:ring-2 focus-within:ring-lime-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-lime-500">
      <div className="relative isolate aspect-[16/10] overflow-hidden bg-neutral-900">
        <img
          src={course.thumbnailUrl || getCourseArtwork(course)}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {course.level ? (
            <Badge variant="secondary" className="rounded-full border-0 bg-white/95 text-neutral-800 shadow-sm backdrop-blur dark:bg-neutral-950/95 dark:text-white">
              {course.level}
            </Badge>
          ) : null}
          {course.isPublished ? (
            <Badge variant="success" className="rounded-full border-0 bg-emerald-100 text-emerald-700 shadow-sm backdrop-blur">
              Published
            </Badge>
          ) : (
              <Badge variant="outline" className="rounded-full bg-white/90 shadow-sm backdrop-blur dark:bg-neutral-950/90 dark:text-white">
              Draft
            </Badge>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug text-neutral-950 dark:text-white">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {truncate(course.shortDescription || course.description, 96)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span className="truncate">{course.instructor?.name || course.instructorName || brand.instructorLabel}</span>
          <span className="flex shrink-0 items-center gap-1">
            <StarRating value={course.ratingAvg || course.rating || 0} />
            <span>{Number(course.ratingAvg || course.rating || 0).toFixed(1)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>{lessonCount} lessons</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0" />
            {course.enrollmentCount || 0}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">{formatPrice(price)}</span>
              {hasDiscount ? (
                <span className="text-sm text-slate-400 line-through">{formatPrice(course.price)}</span>
              ) : null}
            </div>
          </div>
          {href ? (
              <Button asChild className="rounded-full px-4 transition-transform group-hover:scale-[1.02]">
              <Link to={href}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction} className="rounded-full px-4 transition-transform group-hover:scale-[1.02]">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
