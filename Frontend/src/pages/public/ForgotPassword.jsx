import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi, getApiErrorMessage } from "@/services/api";
import { Button, Card, Input, Label } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function ForgotPassword() {
  const navigate = useNavigate();
  const [developmentResetToken, setDevelopmentResetToken] = useState("");
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.forgotPassword(values);
      if (data?.resetUrl) {
        setDevelopmentResetToken(data.resetToken || "");
        toast.success(data.resetToken ? "Development reset link generated" : "Reset link sent");
        navigate(`/reset-password?token=${data.resetToken}`);
        return;
      }

      toast.success(data?.message || "If the account exists, a reset link has been generated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="page-shell flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md border-slate-200 p-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Forgot password</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Reset your password</h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-red-600">{form.formState.errors.email.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </form>

        {developmentResetToken ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Development reset token</p>
            <p className="mt-1 break-all">{developmentResetToken}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
