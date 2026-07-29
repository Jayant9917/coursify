import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, PlayCircle, RefreshCcw, Video } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { usePlaylistDetail, useRefreshPlaylist } from "@/hooks/usePlaylists";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

export function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detailQuery = usePlaylistDetail(id);
  const refreshPlaylist = useRefreshPlaylist();

  if (detailQuery.isLoading) return <LoadingSpinner />;
  if (detailQuery.isError) {
    return <ErrorState description="We could not load this playlist." onRetry={() => detailQuery.refetch()} />;
  }

  const playlist = detailQuery.data || {};
  const videos = playlist.videos || [];

  if (!playlist._id) {
    return <EmptyState title="Playlist not found" description="The playlist you requested does not exist or is unavailable." />;
  }

  const startWatching = () => navigate(`/playlists/${playlist._id}/watch`);

  const refresh = async () => {
    try {
      await refreshPlaylist.mutateAsync(playlist._id);
      toast.success("Playlist refreshed");
      detailQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const progressLabel = playlist.status === "completed" ? "Completed" : `${playlist.progressPercent || 0}% complete`;

  return (
    <div className="page-shell py-8">
      <button
        type="button"
        onClick={() => navigate("/playlists")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to playlists
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            className="h-72 w-full object-cover"
          />
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={playlist.status === "completed" ? "success" : "secondary"}>{progressLabel}</Badge>
              <Badge variant="outline">{videos.length} videos</Badge>
              <Badge variant="outline">{formatDuration(playlist.totalDuration)}</Badge>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Imported playlist</p>
              <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{playlist.title}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600 dark:text-neutral-300">{playlist.description || "No description available."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={startWatching}>
                <PlayCircle className="h-4 w-4" />
                Start watching
              </Button>
              <Button variant="outline" onClick={refresh} disabled={refreshPlaylist.isPending}>
                <RefreshCcw className="h-4 w-4" />
                Refresh from YouTube
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Playlist summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-neutral-300">
              <Row label="Channel" value={playlist.channelTitle || "YouTube"} />
              <Row label="Saved on" value={formatDate(playlist.createdAt)} />
              <Row label="Last watched index" value={String(playlist.lastWatchedIndex || 0)} />
              <Row label="Resume seconds" value={String(playlist.lastWatchedSeconds || 0)} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Videos</h2>
            <div className="mt-4 space-y-3">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-24 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-950 dark:text-white">{video.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" />
                        {formatDuration(video.durationSeconds)}
                      </span>
                      <span>#{video.position}</span>
                      <span>{video.watched ? "Watched" : "Pending"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}
