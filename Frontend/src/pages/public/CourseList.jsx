import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Filter, RefreshCcw } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCourses } from "@/hooks/useCourses";
import { getPreviousRoute } from "@/utils/routeHistory";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { CourseCard } from "@/components/common/CourseCard";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";

export function CourseList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriesQuery = useCategories();

  const params = useMemo(
    () => ({
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 12),
      search: searchParams.get("search") || "",
      categoryId: searchParams.get("categoryId") || "",
      level: searchParams.get("level") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    }),
    [searchParams]
  );

  const coursesQuery = useCourses({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    categoryId: params.categoryId || undefined,
    level: params.level || undefined,
    minPrice: params.minPrice || undefined,
    maxPrice: params.maxPrice || undefined,
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});
  const goBack = () => {
    const previousRoute = getPreviousRoute();
    navigate(previousRoute || "/");
  };

  return (
    <div className="page-shell py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button type="button" onClick={goBack} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Courses</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Find the right course faster.</h1>
        </div>
        <div className="w-full max-w-xl">
          <SearchBar
            value={params.search}
            onChange={(value) => updateParam("search", value)}
            placeholder="Search by title, topic, or description..."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit border-slate-200 dark:border-neutral-800">
          <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 dark:text-neutral-400" />
              <h2 className="font-semibold">Filters</h2>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={params.categoryId} onChange={(event) => updateParam("categoryId", event.target.value)}>
                <option value="">All categories</option>
                {(categoriesQuery.data || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={params.level} onChange={(event) => updateParam("level", event.target.value)}>
                <option value="">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min price</Label>
                <Input type="number" value={params.minPrice} onChange={(e) => updateParam("minPrice", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max price</Label>
                <Input type="number" value={params.maxPrice} onChange={(e) => updateParam("maxPrice", e.target.value)} />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              <RefreshCcw className="h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          {coursesQuery.isLoading ? (
            <LoadingSpinner />
          ) : coursesQuery.isError ? (
            <ErrorState description="We could not load courses right now." onRetry={() => coursesQuery.refetch()} />
          ) : (coursesQuery.data?.data || coursesQuery.data || []).length === 0 ? (
            <EmptyState title="No courses found" description="Try clearing filters or using a different search term." />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {(coursesQuery.data?.data || coursesQuery.data || []).map((course) => (
                  <CourseCard key={course._id} course={course} href={`/courses/${course.slug}`} />
                ))}
              </div>
              <Pagination pagination={coursesQuery.data?.pagination} onPageChange={(page) => updateParam("page", String(page))} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
