export function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value._id || value.id || value.courseId || "";
  }
  return String(value);
}

export function findCourseById(courses, id) {
  const target = normalizeId(id);
  return (courses || []).find((course) => normalizeId(course._id || course.id) === target);
}

export function groupLessonsBySection(lessons = []) {
  return lessons.reduce((acc, lesson) => {
    const sectionKey = normalizeId(lesson.sectionId);
    if (!acc[sectionKey]) {
      acc[sectionKey] = [];
    }
    acc[sectionKey].push(lesson);
    return acc;
  }, {});
}

export function isCourseInWishlist(wishlist = [], courseId) {
  const target = normalizeId(courseId);
  return wishlist.some((item) => normalizeId(item.courseId) === target);
}

export function isEnrollmentForCourse(enrollments = [], courseId) {
  const target = normalizeId(courseId);
  return enrollments.some(
    (item) => normalizeId(item.courseId) === target && ["active", "completed"].includes(item.status || "active")
  );
}

export function getEnrollmentForCourse(enrollments = [], courseId) {
  const target = normalizeId(courseId);
  return enrollments.find((item) => normalizeId(item.courseId) === target);
}
