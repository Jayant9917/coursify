import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playlistApi } from "@/services/api";

export function useMyPlaylists(params = {}, enabled = true) {
  return useQuery({
    queryKey: ["playlists", "me", params],
    enabled,
    queryFn: () => playlistApi.listMine(params),
  });
}

export function usePlaylistDetail(id, enabled = true) {
  return useQuery({
    queryKey: ["playlists", "detail", id],
    enabled: Boolean(id) && enabled,
    queryFn: () => playlistApi.getById(id),
  });
}

export function usePlaylistWatch(id, enabled = true) {
  return useQuery({
    queryKey: ["playlists", "watch", id],
    enabled: Boolean(id) && enabled,
    queryFn: () => playlistApi.watch(id),
  });
}

export function useImportPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => playlistApi.import(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      if (data?._id) {
        queryClient.invalidateQueries({ queryKey: ["playlists", "detail", data._id] });
      }
    },
  });
}

export function useRefreshPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => playlistApi.refresh(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["playlists", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["playlists", "watch", id] });
      queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
    },
  });
}

export function useUpdatePlaylistProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => playlistApi.updateProgress(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlists", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["playlists", "watch", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
    },
  });
}
