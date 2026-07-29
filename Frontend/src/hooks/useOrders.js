import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/services/api";

export function useOrders({ pollOrderId = "", pollDurationMs = 120000 } = {}) {
  const pollStartedAtRef = useRef(Date.now());

  useEffect(() => {
    pollStartedAtRef.current = Date.now();
  }, [pollOrderId]);

  return useQuery({
    queryKey: ["orders"],
    queryFn: () => orderApi.myOrders(),
    refetchInterval: pollOrderId
      ? (query) => {
          if (Date.now() - pollStartedAtRef.current >= pollDurationMs) return false;

          const orders = Array.isArray(query.state.data) ? query.state.data : [];
          const order = orders.find((item) => String(item?._id) === String(pollOrderId));
          if (order && ["paid", "failed", "refunded"].includes(order.status)) return false;

          return 3000;
        }
      : false,
    refetchIntervalInBackground: Boolean(pollOrderId),
  });
}

export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => orderApi.list(params),
  });
}

export function useAdminOrderDetails(id, enabled = true) {
  return useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => orderApi.adminDetails(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useAdminRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderApi.adminRefund(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => orderApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
