import { useQuery } from "@tanstack/react-query";
import { platformApi } from "@/services/api";

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => platformApi.stats(),
    staleTime: 60 * 1000,
  });
}
