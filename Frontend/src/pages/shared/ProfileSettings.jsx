import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, Input, Label, Textarea, Badge, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { uploadApi, getApiErrorMessage } from "@/services/api";
import { fileToDataUrl } from "@/utils/fileToDataUrl";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(8, "Password must be at least 8 characters").optional()
  ),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export function ProfileSettings({ title = "Profile settings", description = "Manage your account details and avatar." }) {
  const meQuery = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const { updateUser } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", avatar: "", bio: "" },
  });

  useEffect(() => {
    if (meQuery.data) {
      form.reset({
        name: meQuery.data.name || "",
        email: meQuery.data.email || "",
        password: "",
        avatar: meQuery.data.avatar || "",
        bio: meQuery.data.bio || "",
      });
    }
  }, [meQuery.data, form]);

  const avatarValue = form.watch("avatar") || meQuery.data?.avatar || "";

  if (meQuery.isLoading) return <LoadingSpinner />;
  if (meQuery.isError) return <ErrorState description="We could not load your profile." onRetry={() => meQuery.refetch()} />;

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await uploadApi.uploadImage({
        dataUrl,
        folder: "avatars",
        publicId: `avatar-${Date.now()}`,
      });
      form.setValue("avatar", uploaded.url, { shouldDirty: true, shouldValidate: true });

      const savedProfile = await updateProfile.mutateAsync({ avatar: uploaded.url });
      updateUser(savedProfile);

      toast.success("Avatar uploaded and saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = { ...values };
      if (!payload.password) {
        delete payload.password;
      }

      const data = await updateProfile.mutateAsync(payload);
      updateUser(data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarValue} alt={meQuery.data?.name || "User"} />
              <AvatarFallback>{(meQuery.data?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-black text-slate-950">{meQuery.data?.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
              <Badge variant="secondary" className="mt-2 w-fit">
                {meQuery.data?.role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" {...form.register("password")} placeholder="Leave blank to keep current password" />
          </Field>
          <Field label="Upload avatar">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Bio">
              <Textarea rows={5} {...form.register("bio")} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={updateProfile.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
