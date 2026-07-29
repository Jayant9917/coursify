import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PlayCircle, RefreshCcw, Trash2, Video } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeletePlaylist, usePlaylistDetail, useRefreshPlaylist } from "@/hooks/usePlaylists";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

export function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detailQuery = usePlaylistDetail(id);
  const refreshPlaylist = useRefreshPlaylist();
  const deletePlaylist = useDeletePlaylist();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (detailQuery.isLoading) return <div className="focus-room-library min-h-screen"><LoadingSpinner label="Loading playlist..." /></div>;
  if (detailQuery.isError) {
    return <div className="focus-room-library min-h-screen p-6"><ErrorState className="focus-room-elevated border" description="We could not load this playlist." onRetry={() => detailQuery.refetch()} /></div>;
  }

  const playlist = detailQuery.data || {};
  const videos = playlist.videos || [];
  const currentVideoIndex = videos.findIndex((video) => String(video._id) === String(playlist.lastWatchedVideoId));
  const currentVideoNumber = currentVideoIndex >= 0 ? currentVideoIndex + 1 : 1;
  const resumeLabel = formatDuration(playlist.lastWatchedSeconds || 0);

  if (!playlist._id) {
    return <div className="focus-room-library min-h-screen p-6"><EmptyState className="focus-room-elevated border" title="Playlist not found" description="The playlist you requested does not exist or is unavailable." /></div>;
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

  const executeRemove = async () => {
    if (deleteOpen) {
      try {
        await deletePlaylist.mutateAsync(playlist._id);
        toast.success("Playlist deleted");
        setDeleteOpen(false);
        navigate("/playlists");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
      return;
    }
    try {
      await deletePlaylist.mutateAsync(playlist._id);
      toast.success("Playlist deleted");
      setDeleteOpen(false);
      navigate("/playlists");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const requestRemove = () => setDeleteOpen(true);

  const progressLabel = playlist.status === "completed" ? "Completed" : `${playlist.progressPercent || 0}% complete`;

  return (
    <div className="focus-room-library page-shell min-h-screen py-8">
      <button
        type="button"
        onClick={() => navigate("/playlists")}
        className="focus-room-control mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--focus-text-secondary)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to playlists
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="focus-room-surface overflow-hidden rounded-[var(--focus-radius-xl)] border">
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--focus-text-muted)]">Imported playlist</p>
              <h1 className="mt-2 text-4xl font-black text-[var(--focus-text)]">{playlist.title}</h1>
              <p className="mt-3 text-base leading-7 text-[var(--focus-text-secondary)]">{playlist.description || "No description available."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="focus-room-primary" onClick={startWatching}>
                <PlayCircle className="h-4 w-4" />
                Start watching
              </Button>
              <Button variant="outline" className="focus-room-secondary" onClick={refresh} disabled={refreshPlaylist.isPending}>
                <RefreshCcw className="h-4 w-4" />
                Refresh from YouTube
              </Button>
              <Button variant="ghost" onClick={requestRemove} disabled={deletePlaylist.isPending} className="text-red-300 hover:bg-red-400/10 hover:text-red-200">
                <Trash2 className="h-4 w-4" />
                Delete playlist
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="focus-room-elevated rounded-[var(--focus-radius-lg)] p-6">
            <h2 className="text-xl font-bold text-[var(--focus-text)]">Playlist summary</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--focus-text-secondary)]">
              <Row label="Channel" value={playlist.channelTitle || "YouTube"} />
              <Row label="Saved on" value={formatDate(playlist.createdAt)} />
              <Row label="Progress" value={`Currently on lesson ${currentVideoNumber} of ${videos.length || 0}`} />
              <Row label="Resume" value={`Resume from ${resumeLabel}`} />
            </div>
          </Card>

          <Card className="focus-room-elevated rounded-[var(--focus-radius-lg)] p-6">
            <h2 className="text-xl font-bold text-[var(--focus-text)]">Videos</h2>
            <div className="mt-4 space-y-3">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className={`flex items-start gap-3 rounded-[var(--focus-radius-md)] border p-3 ${String(video._id) === String(playlist.lastWatchedVideoId) ? "border-l-2 border-l-[var(--focus-accent)] bg-[var(--focus-accent-subtle)]" : "border-[var(--focus-border)]"}`}
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-24 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--focus-text)]">{video.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--focus-text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" />
                        {formatDuration(video.durationSeconds)}
                      </span>
                      <span>#{video.position}</span>
                    <span className="rounded-full border border-[var(--focus-border-strong)] px-2 py-0.5">{video.isAvailable === false ? "Unavailable" : video.watched ? "Watched" : "Pending"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this playlist?"
        description={`“${playlist.title}” and its saved progress will be removed from your Focus Room. This cannot be undone.`}
        busy={deletePlaylist.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={executeRemove}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--focus-text-muted)]">{label}</span>
      <span className="text-right font-medium text-[var(--focus-text)]">{value}</span>
    </div>
  );
}
