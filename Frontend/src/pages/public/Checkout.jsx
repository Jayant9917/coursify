import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, ShieldCheck, ShoppingBag, Ticket, Trash2, User } from "lucide-react";
import { Badge, Button, Card, Input, Separator } from "@/components/ui";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useCheckout } from "@/hooks/useCheckout";
import { getPreviousRoute } from "@/utils/routeHistory";
import { formatPrice } from "@/utils/formatPrice";
import { brand } from "@/utils/brand";

function getCoursePrice(course) {
  const discounted = Number(course?.discountPrice || 0);
  const regular = Number(course?.price || 0);
  if (Number.isFinite(discounted) && discounted > 0 && discounted < regular) {
    return discounted;
  }
  return Number.isFinite(regular) ? regular : 0;
}

export function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const coursesFromState = useMemo(() => {
    const value = location.state?.courses;
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }, [location.state]);

  const {
    courses,
    subtotal,
    discountCode,
    discountAmount,
    total,
    isValidatingCoupon,
    isPlacingOrder,
    couponError,
    validateCoupon,
    removeCoupon,
    placeOrder,
    orderError,
  } = useCheckout(coursesFromState);

  const [couponInput, setCouponInput] = useState("");
  const [couponTouched, setCouponTouched] = useState(false);

  const goBack = () => {
    const previousRoute = getPreviousRoute();
    navigate(previousRoute || "/courses");
  };

  useEffect(() => {
    setCouponInput(discountCode || "");
  }, [discountCode]);

  const handleValidateCoupon = async () => {
    setCouponTouched(true);
    const result = await validateCoupon(couponInput);
    if (result?.code) {
      setCouponInput(result.code);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput("");
    setCouponTouched(false);
  };

  const showCourseList = courses.length > 0;
  if (!location.state) {
    return (
      <div className="page-shell py-8">
        <button type="button" onClick={goBack} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <EmptyState
          title="No courses selected"
          description="Start from a course page or browse the catalog to add a course to checkout."
          icon={ShoppingBag}
          actionLabel="Browse courses"
          onAction={() => navigate("/courses")}
        />
      </div>
    );
  }

  if (!showCourseList) {
    return (
      <div className="page-shell py-8">
        <button type="button" onClick={goBack} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <LoadingSpinner label="Preparing checkout..." />
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <div className="mb-6 flex flex-col gap-3">
        <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Checkout</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Review your order and complete purchase.</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <Card className="border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Order summary</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Courses in this order</h2>
              </div>
              <Badge variant="secondary">{courses.length} course{courses.length === 1 ? "" : "s"}</Badge>
            </div>

            <div className="mt-5 space-y-4">
              {courses.map((course) => {
                const salePrice = getCoursePrice(course);
                const hasSale = Number(course?.discountPrice || 0) > 0 && Number(course.discountPrice) < Number(course?.price || 0);
                return (
                  <div key={course._id || course.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row">
                    <img
                      src={
                        course.thumbnailUrl ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='22' fill='%2394a3b8'%3ESkillnest%3C/text%3E%3C/svg%3E"
                      }
                      alt={course.title}
                      className="h-40 w-full rounded-xl object-cover sm:w-40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h3>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                            <User className="h-4 w-4" />
                            {course.instructor?.name || course.instructorName || brand.instructorLabel}
                          </p>
                        </div>
                        <Badge variant="outline">Included</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                        {hasSale ? (
                          <>
                            <span className="font-semibold text-slate-950 dark:text-white">{formatPrice(salePrice)}</span>
                            <span className="text-slate-400 line-through">{formatPrice(course.price)}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-950 dark:text-white">{formatPrice(salePrice)}</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                        <BookOpen className="h-4 w-4" />
                        {course.level || "All levels"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border-slate-200 p-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Pricing</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row
                label="Discount"
                value={discountAmount > 0 ? `- ${formatPrice(discountAmount)}` : "-"}
                valueClassName={discountAmount > 0 ? "text-emerald-700" : "text-slate-400"}
              />
              <Separator className="my-4" />
              <Row label="Total" value={formatPrice(total)} valueClassName="text-lg font-bold text-slate-950 dark:text-white" />
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="border-slate-200 p-6">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Coupon code</h2>
            </div>

            <div className="mt-5 space-y-3">
              <Input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={Boolean(discountCode)}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={isValidatingCoupon || isPlacingOrder || Boolean(discountCode) || !couponInput.trim()}
                >
                  {isValidatingCoupon ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Validate Coupon
                    </>
                  )}
                </Button>
                {discountCode ? (
                  <Button type="button" variant="outline" onClick={handleRemoveCoupon} disabled={isPlacingOrder}>
                    <Trash2 className="h-4 w-4" />
                    Remove Coupon
                  </Button>
                ) : null}
              </div>

              {discountCode ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Coupon applied
                  </div>
                  <p className="mt-1">
                    {discountCode} saved {formatPrice(discountAmount)} on this order.
                  </p>
                </div>
              ) : null}

              {(couponError && couponTouched) || (couponError && !discountCode) ? (
                <p className="text-sm text-red-600">{couponError}</p>
              ) : null}
            </div>
          </Card>

          <Card className="border-slate-200 p-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Proceed to payment</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>You will be redirected to Lemon Squeezy to complete payment securely.</p>
              {orderError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{orderError}</p> : null}
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                onClick={placeOrder}
                disabled={isValidatingCoupon || isPlacingOrder || courses.length === 0}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Continue to payment
                  </>
                )}
              </Button>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Once payment is confirmed, the order will be marked as paid and your courses will appear in your student dashboard.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, valueClassName = "text-slate-950 dark:text-white" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
