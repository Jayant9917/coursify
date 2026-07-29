import { useMemo, useState } from "react";
import { couponApi, getApiErrorMessage, orderApi } from "@/services/api";
import { normalizeId } from "@/utils/courseUtils";
import { toast } from "sonner";

function extractDiscountAmount(payload) {
  const candidate =
    payload?.discountAmount ??
    payload?.discount ??
    payload?.amount ??
    payload?.value ??
    payload?.data?.discountAmount ??
    payload?.data?.discount ??
    payload?.data?.amount ??
    payload?.data?.value ??
    0;

  const numeric = Number(candidate) || parseFloat(candidate);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

export function useCheckout(initialCourses = []) {
  const courses = useMemo(() => (Array.isArray(initialCourses) ? initialCourses.filter(Boolean) : []), [initialCourses]);
  const courseIds = useMemo(
    () => courses.map((course) => normalizeId(course?._id || course?.id || course?.courseId)).filter(Boolean),
    [courses]
  );

  const subtotal = useMemo(() => {
    return courses.reduce((sum, course) => {
      const price = Number(course?.discountPrice && course.discountPrice > 0 ? course.discountPrice : course?.price || 0);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [courses]);

  const [discountCode, setDiscountCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [orderError, setOrderError] = useState("");

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const validateCoupon = async (code) => {
    const nextCode = String(code || "").trim();
    if (!nextCode) {
      const message = "Please enter a coupon code.";
      setCouponError(message);
      toast.error(message);
      return null;
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const payload = await couponApi.validate(nextCode, subtotal);
      const amount = extractDiscountAmount(payload);
      setDiscountCode(nextCode);
      setDiscountAmount(amount);
      toast.success(amount > 0 ? "Coupon applied successfully" : "Coupon validated");
      return { code: nextCode, discountAmount: amount, payload };
    } catch (error) {
      const message = getApiErrorMessage(error);
      setCouponError(message);
      toast.error(message);
      return null;
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscountCode(null);
    setDiscountAmount(0);
    setCouponError("");
  };

  const placeOrder = async () => {
    if (courseIds.length === 0) {
      const message = "Add at least one course before checking out.";
      setOrderError(message);
      toast.error(message);
      return null;
    }

    setIsPlacingOrder(true);
    setOrderError("");

    try {
      const orderPayload = {
        courseIds,
        ...(discountCode ? { couponCode: discountCode } : {}),
      };

      const order = await orderApi.create(orderPayload);
      if (!order?.checkoutUrl) {
        const message = "Payment checkout could not be created.";
        setOrderError(message);
        toast.error(message);
        return null;
      }

      toast.success("Redirecting to secure checkout...");
      window.location.assign(order.checkoutUrl);
      return order;
    } catch (error) {
      const message = getApiErrorMessage(error);
      setOrderError(message);
      toast.error(message);
      return null;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return {
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
  };
}
