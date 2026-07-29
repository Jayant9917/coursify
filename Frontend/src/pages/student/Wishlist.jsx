import { useCourses, useToggleWishlist, useWishlist } from "@/hooks/useCourses";
import { Card, Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { findCourseById, normalizeId } from "@/utils/courseUtils";
import { getCourseArtwork } from "@/utils/courseArtwork";
import { getApiErrorMessage } from "@/services/api";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export function Wishlist() {
  const wishlistQuery = useWishlist();
  const catalogQuery = useCourses({ limit: 100 });
  const toggleWishlist = useToggleWishlist();

  if (wishlistQuery.isLoading || catalogQuery.isLoading) return <LoadingSpinner />;
  if (wishlistQuery.isError || catalogQuery.isError) return <ErrorState description="We could not load your wishlist." onRetry={() => wishlistQuery.refetch()} />;

  const wishlist = wishlistQuery.data || [];
  const catalog = catalogQuery.data?.data || catalogQuery.data || [];
  const items = wishlist
    .map((item) => ({ item, course: findCourseById(catalog, item.courseId) }))
    .filter((entry) => entry.course);

  const remove = async (courseId) => {
    try {
      await toggleWishlist.mutateAsync({ courseId, liked: true });
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Wishlist</h1>
      </Card>
      {items.length === 0 ? (
        <EmptyState title="Wishlist is empty" description="Save courses to come back to them later." icon={Heart} />
      ) : (
        <div className="grid gap-4">
          {items.map(({ item, course }) => (
            <Card key={item._id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <img src={course.thumbnailUrl || getCourseArtwork(course)} alt={course.title} className="h-20 w-32 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{course.shortDescription || course.description}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => remove(normalizeId(course._id))}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
