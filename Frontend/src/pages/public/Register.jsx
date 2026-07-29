import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { brand } from "@/utils/brand";
import { authApi, setStoredRefreshToken, getApiErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "instructor"]),
  bio: z.string().optional(),
});

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken, user, setAuth } = useAuth();
  const requestedRole = searchParams.get("role") === "instructor" ? "instructor" : "student";
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: requestedRole,
      bio: "",
    },
  });

  useEffect(() => {
    if (accessToken && user?.role) {
      navigate(rolePath(user.role), { replace: true });
    }
  }, [accessToken, user, navigate]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.register(values);
      setStoredRefreshToken(data.refreshToken);
      setAuth(data.user, data.accessToken);
      toast.success("Account created");
      navigate(rolePath(data.user.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="page-shell flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md border-slate-200 p-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Create account</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Join {brand.name}</h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input placeholder="Aman Sharma" {...form.register("name")} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
          </Field>
          <Field label="Role">
            <Select {...form.register("role")}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </Select>
          </Field>
          <Field label="Bio">
            <Textarea rows={3} placeholder="Tell us about yourself" {...form.register("bio")} />
          </Field>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Create account
          </Button>
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

function rolePath(role) {
  if (role === "instructor") return "/instructor/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}
