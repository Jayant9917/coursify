import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { brand } from "@/utils/brand";
import { authApi, setStoredRefreshToken } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, Input, Label } from "@/components/ui";
import { getApiErrorMessage } from "@/services/api";
import { Link } from "react-router-dom";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, user, setAuth } = useAuth();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (accessToken && user?.role) {
      navigate(location.state?.from || rolePath(user.role), { replace: true });
    }
  }, [accessToken, user, navigate, location.state]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.login(values);
      setStoredRefreshToken(data.refreshToken);
      setAuth(data.user, data.accessToken);
      toast.success("Welcome back");
      navigate(location.state?.from || rolePath(data.user.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="page-shell flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md border-slate-200 p-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Welcome back</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Sign in to {brand.name}</h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-red-600">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-red-600">{form.formState.errors.password.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Sign in
          </Button>
          <div className="text-center text-sm text-slate-500">
            <Link to="/forgot-password" className="font-medium text-slate-900 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

function rolePath(role) {
  if (role === "instructor") return "/instructor/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}
