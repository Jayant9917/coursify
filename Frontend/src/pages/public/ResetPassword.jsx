import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi, getApiErrorMessage } from "@/services/api";
import { Button, Card, Input, Label } from "@/components/ui";

const schema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (token) {
      form.setValue("token", token, { shouldValidate: true });
    }
  }, [token, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await authApi.resetPassword({ token: values.token, password: values.password });
      toast.success("Password updated");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="page-shell flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md border-slate-200 p-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Reset password</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Choose a new password</h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Reset token</Label>
            <Input placeholder="Paste token here" {...form.register("token")} />
            {form.formState.errors.token ? <p className="text-sm text-red-600">{form.formState.errors.token.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-red-600">{form.formState.errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input type="password" placeholder="Re-enter password" {...form.register("confirmPassword")} />
            {form.formState.errors.confirmPassword ? (
              <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
