import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courseApi, courseApi as courseService, wishlistApi } from "@/services/api";

export function useCourses(params, options = {}) {
  return useQuery({
    queryKey: ["courses", params],
    enabled: options.enabled !== false,
    queryFn: () => courseService.list(params),
  });
}

export function useFeaturedCourses() {
  return useCourses({ limit: 8, isFeatured: true });
}

export function useCourseDetail(slug) {
  return useQuery({
    queryKey: ["course", slug],
    enabled: Boolean(slug),
    queryFn: () => courseApi.getBySlug(slug),
  });
}

export function useCourseReviews(courseId, params = {}) {
  return useQuery({
    queryKey: ["course-reviews", courseId, params],
    enabled: Boolean(courseId),
    queryFn: () => courseApi.getReviews(courseId, params),
  });
}

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: ["wishlist"],
    enabled,
    queryFn: () => wishlistApi.list(),
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, liked }) => (liked ? wishlistApi.remove(courseId) : wishlistApi.add(courseId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export function useInstructorCourses(params = {}) {
  return useQuery({
    queryKey: ["instructor-courses", params],
    queryFn: () => courseApi.instructorList(params),
  });
}

export function useAdminCourses(params = {}) {
  return useQuery({
    queryKey: ["admin-courses", params],
    queryFn: () => courseApi.adminList(params),
  });
}

export function usePublicCourseList(params = {}) {
  return useCourses(params);
}

export function useTrendingCourses() {
  return useCourses({ limit: 8 });
}

export function useFreeCourses() {
  return useCourses({ limit: 8, maxPrice: 0 });
}
