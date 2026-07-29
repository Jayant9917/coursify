import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { couponApi } from "@/services/api";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";

const schema = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(0),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});

export function CouponManagement() {
  const couponsQuery = useQuery({ queryKey: ["coupons"], queryFn: () => couponApi.list() });
  const [editingId, setEditingId] = useState(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", type: "percent", value: 0, maxRedemptions: 1, expiresAt: "" },
  });

  if (couponsQuery.isLoading) return <LoadingSpinner />;
  if (couponsQuery.isError) return <ErrorState description="We could not load coupons." onRetry={() => couponsQuery.refetch()} />;

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = { ...values, expiresAt: values.expiresAt || null };
      if (editingId) {
        await couponApi.update(editingId, payload);
        toast.success("Coupon updated");
      } else {
        await couponApi.create(payload);
        toast.success("Coupon created");
      }
      setEditingId(null);
      form.reset({ code: "", type: "percent", value: 0, maxRedemptions: 1, expiresAt: "" });
      couponsQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  const coupons = couponsQuery.data || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black text-slate-950">Coupon management</h1>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold">{editingId ? "Edit coupon" : "Create coupon"}</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={submit}>
          <Field label="Code">
            <Input {...form.register("code")} />
          </Field>
          <Field label="Type">
            <Select {...form.register("type")}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </Select>
          </Field>
          <Field label="Value">
            <Input type="number" {...form.register("value")} />
          </Field>
          <Field label="Maximum redemptions">
            <Input type="number" {...form.register("maxRedemptions")} />
          </Field>
          <Field label="Expiry date">
            <Input type="date" {...form.register("expiresAt")} />
          </Field>
          <div className="flex items-end gap-2 md:col-span-3">
            <Button type="submit">{editingId ? "Save coupon" : "Add coupon"}</Button>
            {editingId ? <Button type="button" variant="outline" onClick={() => { setEditingId(null); form.reset({ code: "", type: "percent", value: 0, maxRedemptions: 1, expiresAt: "" }); }}>Cancel</Button> : null}
          </div>
        </form>
      </Card>

      {coupons.length === 0 ? (
        <EmptyState title="No coupons" description="Create coupons for your students." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{coupon.code}</h3>
                  <p className="text-sm text-slate-500">
                    {coupon.type} - {coupon.value}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}</p>
                  <p className="text-xs text-slate-400">{coupon.redeemedCount || 0} redeemed / {coupon.maxRedemptions}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => { setEditingId(coupon._id); form.reset({ code: coupon.code, type: coupon.type, value: coupon.value, maxRedemptions: coupon.maxRedemptions, expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "" }); }}>Edit</Button>
                {coupon.isActive ? <Button variant="outline" onClick={async () => {
                  if (!window.confirm(`Deactivate coupon ${coupon.code}?`)) return;
                  try { await couponApi.remove(coupon._id); toast.success("Coupon deactivated"); couponsQuery.refetch(); } catch (error) { toast.error(getApiErrorMessage(error)); }
                }}>Deactivate</Button> : null}
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
