import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { courseApi, getApiErrorMessage } from "@/services/api";
import { useInstructorCourses } from "@/hooks/useCourses";
import { useCategories } from "@/hooks/useCategories";
import { Button, Card, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus, Trash2 } from "lucide-react";
import { uploadApi } from "@/services/api";
import { fileToDataUrl } from "@/utils/fileToDataUrl";

const lessonSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2),
  type: z.enum(["video", "text", "pdf", "quiz"]),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  duration: z.coerce.number().optional(),
  isPreview: z.boolean().optional(),
  order: z.coerce.number().optional(),
});

const sectionSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2),
  order: z.coerce.number().optional(),
  lessons: z.array(lessonSchema).default([]),
});

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  previewVideoUrl: z.string().optional(),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().optional(),
  categoryId: z.string().optional(),
  tagsText: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sections: z.array(sectionSchema).default([]),
});

export function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const coursesQuery = useInstructorCourses({ limit: 100 });
  const categoriesQuery = useCategories();
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const editorForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      thumbnailUrl: "",
      previewVideoUrl: "",
      price: 0,
      discountPrice: 0,
      level: "beginner",
      language: "en",
      categoryId: "",
      tagsText: "",
      isPublished: false,
      isFeatured: false,
      sections: [],
    },
  });

  const sectionsArray = useFieldArray({ control: editorForm.control, name: "sections" });
  const currentSections = useWatch({ control: editorForm.control, name: "sections" });

  const courseMatch = useMemo(
    () => (coursesQuery.data?.data || coursesQuery.data || []).find((course) => course._id === id),
    [coursesQuery.data, id]
  );

  useEffect(() => {
    if (!isEdit) {
      editorForm.reset({
        title: "",
        description: "",
        shortDescription: "",
        thumbnailUrl: "",
        previewVideoUrl: "",
        price: 0,
        discountPrice: 0,
        level: "beginner",
        language: "en",
        categoryId: "",
        tagsText: "",
        isPublished: false,
        isFeatured: false,
        sections: [],
      });
      return;
    }

    if (courseMatch) {
      loadCourse(courseMatch.slug, editorForm);
    }
  }, [isEdit, courseMatch, editorForm]);

  if (coursesQuery.isLoading || categoriesQuery.isLoading) return <LoadingSpinner />;
  if (coursesQuery.isError || categoriesQuery.isError) return <ErrorState description="We could not load instructor courses." onRetry={() => coursesQuery.refetch()} />;
  if (isEdit && !courseMatch) return <EmptyState title="Course not found" description="We could not locate this course for editing." />;

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await uploadApi.uploadImage({
        dataUrl,
        folder: "courseThumbnails",
        publicId: `course-thumbnail-${Date.now()}`,
      });
      editorForm.setValue("thumbnailUrl", uploaded.url, { shouldDirty: true, shouldValidate: true });
      toast.success("Thumbnail uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingThumbnail(false);
      event.target.value = "";
    }
  };

  const submit = editorForm.handleSubmit(async (values) => {
    try {
      const tags = (values.tagsText || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        title: values.title,
        description: values.description,
        shortDescription: values.shortDescription,
        thumbnailUrl: values.thumbnailUrl,
        previewVideoUrl: values.previewVideoUrl,
        price: Number(values.price),
        discountPrice: values.discountPrice ? Number(values.discountPrice) : 0,
        level: values.level,
        language: values.language || "en",
        categoryId: values.categoryId || null,
        tags,
        isPublished: Boolean(values.isPublished),
        isFeatured: Boolean(values.isFeatured),
      };

      const savedCourse = isEdit ? await courseApi.update(id, payload) : await courseApi.create(payload);
      const courseId = savedCourse._id;

      for (let sectionIndex = 0; sectionIndex < values.sections.length; sectionIndex += 1) {
        const section = values.sections[sectionIndex];
        let sectionId = section._id;
        if (sectionId) {
          await courseApi.updateSection(sectionId, { title: section.title, order: section.order || sectionIndex + 1 });
        } else {
          const createdSection = await courseApi.createSection(courseId, { title: section.title, order: section.order || sectionIndex + 1 });
          sectionId = createdSection._id;
        }

        for (let lessonIndex = 0; lessonIndex < (section.lessons || []).length; lessonIndex += 1) {
          const lesson = section.lessons[lessonIndex];
          const lessonPayload = {
            title: lesson.title,
            type: lesson.type,
            content: lesson.content || "",
            videoUrl: lesson.videoUrl || "",
            fileUrl: lesson.fileUrl || "",
            duration: Number(lesson.duration || 0),
            isPreview: Boolean(lesson.isPreview),
            order: lesson.order || lessonIndex + 1,
          };
          if (lesson._id) {
            await courseApi.updateLesson(lesson._id, lessonPayload);
          } else {
            await courseApi.createLesson(sectionId, lessonPayload);
          }
        }
      }

      toast.success(isEdit ? "Course updated" : "Course created");
      navigate("/instructor/courses");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950">{isEdit ? "Edit course" : "Create course"}</h1>
        <p className="mt-2 text-slate-600">Course details, curriculum, and publish state all live on one page.</p>
      </Card>

      <form className="space-y-6" onSubmit={submit}>
        <Card className="space-y-5 p-6">
          <h2 className="text-xl font-bold">Course details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input {...editorForm.register("title")} />
            </Field>
            <Field label="Price">
              <Input type="number" {...editorForm.register("price")} />
            </Field>
            <Field label="Discount price">
              <Input type="number" {...editorForm.register("discountPrice")} />
            </Field>
            <Field label="Level">
              <Select {...editorForm.register("level")}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select {...editorForm.register("categoryId")}>
                <option value="">Select category</option>
                {(categoriesQuery.data || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Language">
              <Input {...editorForm.register("language")} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Short description">
                <Input {...editorForm.register("shortDescription")} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea rows={6} {...editorForm.register("description")} />
              </Field>
            </div>
            <Field label="Thumbnail URL">
              <Input {...editorForm.register("thumbnailUrl")} />
            </Field>
            <Field label="Upload thumbnail">
              <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif" onChange={handleThumbnailUpload} disabled={isUploadingThumbnail} />
            </Field>
            <Field label="Preview video URL">
              <Input {...editorForm.register("previewVideoUrl")} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Tags">
                <Input {...editorForm.register("tagsText")} placeholder="react, frontend, web" />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...editorForm.register("isPublished")} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...editorForm.register("isFeatured")} />
              Featured
            </label>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Curriculum builder</h2>
            <Button type="button" variant="outline" onClick={() => sectionsArray.append({ title: "", order: currentSections.length + 1, lessons: [] })}>
              <Plus className="h-4 w-4" />
              Add section
            </Button>
          </div>

          <div className="space-y-4">
            {sectionsArray.fields.length === 0 ? (
              <EmptyState title="No sections yet" description="Add a section to begin building the curriculum." />
            ) : (
              sectionsArray.fields.map((sectionField, sectionIndex) => (
              <SectionEditor
                  key={sectionField.id}
                  sectionIndex={sectionIndex}
                  register={editorForm.register}
                  setValue={editorForm.setValue}
                  control={editorForm.control}
                  removeSection={() => sectionsArray.remove(sectionIndex)}
                />
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Publish</h2>
              <p className="mt-1 text-sm text-slate-500">Use the toggle above to control visibility, then save the course.</p>
            </div>
            <Badge variant={editorForm.watch("isPublished") ? "success" : "secondary"}>
              {editorForm.watch("isPublished") ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={editorForm.formState.isSubmitting}>
              Save course
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function SectionEditor({ sectionIndex, control, register, setValue, removeSection }) {
  const name = `sections.${sectionIndex}`;
  const lessonsArray = useFieldArray({ control, name: `${name}.lessons` });

  return (
    <Card className="space-y-4 border-slate-200 p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-950">Section {sectionIndex + 1}</h3>
        <Button type="button" variant="ghost" onClick={removeSection}>
          <Trash2 className="h-4 w-4" />
          Delete section
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Section title" name={`${name}.title`} register={register}>
          {(field) => <Input {...field} />}
        </Field>
        <Field label="Order" name={`${name}.order`} register={register}>
          {(field) => <Input type="number" {...field} />}
        </Field>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Lessons</h4>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              lessonsArray.append({
                title: "",
                type: "video",
                content: "",
                videoUrl: "",
                fileUrl: "",
                duration: 0,
                isPreview: false,
                order: lessonsArray.fields.length + 1,
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add lesson
          </Button>
        </div>
        {lessonsArray.fields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Add a lesson to this section.</p>
        ) : (
          lessonsArray.fields.map((lessonField, lessonIndex) => (
            <LessonEditor
              key={lessonField.id}
              sectionName={name}
              lessonIndex={lessonIndex}
              control={control}
              register={register}
              setValue={setValue}
              removeLesson={() => lessonsArray.remove(lessonIndex)}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function LessonEditor({ sectionName, lessonIndex, control, register, setValue, removeLesson }) {
  const name = `${sectionName}.lessons.${lessonIndex}`;
  const lessonType = useWatch({ control, name: `${name}.type` });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const uploadLessonFile = async (file, folder) => {
    const request = await uploadApi.requestLessonFileUpload({
      fileName: file.name,
      contentType: file.type,
      folder,
    });
    await uploadApi.uploadToPresignedUrl(request.uploadUrl, file, file.type);
    return request.fileUrl;
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
      event.target.value = "";
      return;
    }

    setIsUploadingVideo(true);
    try {
      const fileUrl = await uploadLessonFile(file, "lessonVideos");
      setValue(`${name}.videoUrl`, fileUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Video uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingVideo(false);
      event.target.value = "";
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please choose a PDF file.");
      event.target.value = "";
      return;
    }

    setIsUploadingFile(true);
    try {
      const fileUrl = await uploadLessonFile(file, "lessonPdfs");
      setValue(`${name}.fileUrl`, fileUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("PDF uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingFile(false);
      event.target.value = "";
    }
  };

  return (
    <Card className="space-y-4 border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-slate-950">Lesson {lessonIndex + 1}</h5>
        <Button type="button" variant="ghost" onClick={removeLesson}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name={`${name}.title`} register={register}>
          {(field) => <Input {...field} />}
        </Field>
        <Field label="Type" name={`${name}.type`} register={register}>
          {(field) => (
            <Select {...field}>
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="quiz">Quiz</option>
            </Select>
          )}
        </Field>
        {lessonType === "video" ? (
          <Field label="Video URL" name={`${name}.videoUrl`} register={register}>
            {(field) => <Input {...field} />}
          </Field>
        ) : null}
        {lessonType === "video" ? (
          <Field label="Upload video">
            <Input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploadingVideo} />
          </Field>
        ) : null}
        {lessonType === "pdf" ? (
          <Field label="PDF URL" name={`${name}.fileUrl`} register={register}>
            {(field) => <Input {...field} />}
          </Field>
        ) : null}
        {lessonType === "pdf" ? (
          <Field label="Upload PDF">
            <Input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={isUploadingFile} />
          </Field>
        ) : null}
        <Field label="Duration" name={`${name}.duration`} register={register}>
          {(field) => <Input type="number" {...field} />}
        </Field>
        <Field label="Order" name={`${name}.order`} register={register}>
          {(field) => <Input type="number" {...field} />}
        </Field>
      </div>
      {lessonType !== "pdf" ? (
        <Field label="Content" name={`${name}.content`} register={register}>
          {(field) => <Textarea rows={4} {...field} />}
        </Field>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register(`${name}.isPreview`)} />
        Preview lesson
      </label>
    </Card>
  );
}

function Field({ label, name, register, children }) {
  if (!name) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {children}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children(register(name))}
    </div>
  );
}

async function loadCourse(slug, form) {
  const course = await courseApi.getBySlug(slug);
  const tagsText = (course.course.tags || []).join(", ");
  const sections = (course.sections || []).map((section, index) => ({
    _id: section._id,
    title: section.title,
    order: section.order || index + 1,
      lessons: (course.lessons || [])
      .filter((lesson) => lesson.sectionId === section._id)
      .map((lesson, lessonIndex) => ({
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        fileUrl: lesson.fileUrl || "",
        duration: lesson.duration || 0,
        isPreview: Boolean(lesson.isPreview),
        order: lesson.order || lessonIndex + 1,
      })),
  }));

  form.reset({
    title: course.course.title || "",
    description: course.course.description || "",
    shortDescription: course.course.shortDescription || "",
    thumbnailUrl: course.course.thumbnailUrl || "",
    previewVideoUrl: course.course.previewVideoUrl || "",
    price: course.course.price || 0,
    discountPrice: course.course.discountPrice || 0,
    level: course.course.level || "beginner",
    language: course.course.language || "en",
    categoryId: course.course.categoryId || "",
    tagsText,
    isPublished: Boolean(course.course.isPublished),
    isFeatured: Boolean(course.course.isFeatured),
    sections,
  });
}
