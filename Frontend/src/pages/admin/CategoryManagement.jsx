import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Button, Card, Input, Label, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getApiErrorMessage } from "@/services/api";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
});

export function CategoryManagement() {
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (categoriesQuery.data?.[0] && !form.formState.isDirty) {
      // keep initial state stable
    }
  }, [categoriesQuery.data, form.formState.isDirty]);

  if (categoriesQuery.isLoading) return <LoadingSpinner />;
  if (categoriesQuery.isError) return <ErrorState description="We could not load categories." onRetry={() => categoriesQuery.refetch()} />;

  const submit = form.handleSubmit(async (values) => {
    try {
      await createCategory.mutateAsync(values);
      toast.success("Category created");
      form.reset({ name: "", slug: "" });
      categoriesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  const update = async (category) => {
    try {
      await updateCategory.mutateAsync({ id: category._id, payload: { name: category.name, slug: category.slug } });
      toast.success("Category updated");
      categoriesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Deactivate the ${category.name} category?`)) return;
    try {
      await deleteCategory.mutateAsync(category._id);
      toast.success("Category deactivated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950">Category management</h1>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold">Create category</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Name">
            <Input {...form.register("name")} />
          </Field>
          <Field label="Slug">
            <Input {...form.register("slug")} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Add category</Button>
          </div>
        </form>
      </Card>

      {categoriesQuery.data?.length === 0 ? (
        <EmptyState title="No categories found" description="Create a category to start organizing courses." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(categoriesQuery.data || []).map((category) => (
            <Card key={category._id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.slug}</p>
                </div>
                <Badge variant="secondary">{category.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => update(category)}>
                  Save current values
                </Button>
                <Button variant="outline" onClick={() => remove(category)}>
                  Deactivate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
