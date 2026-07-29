import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, ListVideo, Trash2, UploadCloud } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { Antigravity } from "@/components/common/Antigravity";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { useDeletePlaylist, useImportPlaylist, useMyPlaylists } from "@/hooks/usePlaylists";
import { getApiErrorMessage } from "@/services/api";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { toast } from "sonner";

export function FocusPlaylists() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const importInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [importUrl, setImportUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deletePlaylist = useDeletePlaylist();
  const importPlaylist = useImportPlaylist();

  const playlistsQuery = useMyPlaylists({ page, limit: 8 }, true);
  const playlists = useMemo(() => playlistsQuery.data?.data || playlistsQuery.data || [], [playlistsQuery.data]);
  const featured = useMemo(
    () => playlists.find((playlist) => playlist.status !== "completed") || playlists[0],
    [playlists],
  );
  const stats = useMemo(
    () =>
      playlists.reduce(
        (acc, playlist) => {
          acc.total += 1;
          if (playlist.status === "completed") acc.completed += 1;
          else acc.active += 1;
          return acc;
        },
        { total: 0, active: 0, completed: 0 },
      ),
    [playlists],
  );

  if (playlistsQuery.isLoading) {
    return (
      <div className="focus-room-page min-h-screen">
        <LoadingSpinner label="Loading Focus Room..." />
      </div>
    );
  }

  if (playlistsQuery.isError) {
    return (
      <div className="focus-room-page min-h-screen p-6">
        <ErrorState
          className="focus-room-elevated border"
          description="We could not load your playlists."
          onRetry={() => playlistsQuery.refetch()}
        />
      </div>
    );
  }

  const handleImport = async (event) => {
    event.preventDefault();
    const url = importUrl.trim();
    if (!url) {
      toast.error("Paste a YouTube playlist URL to begin.");
      importInputRef.current?.focus();
      return;
    }

    try {
      const playlist = await importPlaylist.mutateAsync({ url });
      setImportUrl("");
      toast.success("Playlist imported. Let's start learning.");
      navigate(`/playlists/${playlist._id}/watch`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlaylist.mutateAsync(deleteTarget._id);
      toast.success("Playlist deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="focus-room-page focus-room-home min-h-screen overflow-hidden pb-6 sm:pb-10">
      <section
        id="focus-room-import"
        className="focus-room-hero relative isolate min-h-[min(720px,calc(100vh-7rem))] overflow-hidden"
      >
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color="#5231da"
            autoAnimate={!reduceMotion}
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.12)_42%,rgba(10,10,10,0.78)_100%),linear-gradient(to_bottom,rgba(10,10,10,0.25),rgba(10,10,10,0.62))]"
        />

        <div className="pointer-events-none relative z-10 flex min-h-[min(720px,calc(100vh-7rem))] items-center justify-center px-6 py-24 text-center sm:px-12 sm:py-28 lg:px-20">
          <div className="pointer-events-auto w-full max-w-3xl">
            <p className="eyebrow text-[var(--focus-accent)]">Focus Room / distraction-free learning</p>
            <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-[var(--focus-text)] sm:text-7xl sm:leading-[0.98]">
              Welcome to Focus Room.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--focus-text-secondary)] sm:text-lg">
              Drop in a playlist, tune out the noise, and start learning from the exact point you left off.
            </p>

            <form
              onSubmit={handleImport}
              className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-[var(--focus-radius-lg)] border border-[var(--focus-border-strong)] bg-black/55 p-3 shadow-2xl backdrop-blur-md sm:flex-row"
            >
              <label htmlFor="focus-room-playlist-url" className="sr-only">
                YouTube playlist URL
              </label>
              <Input
                ref={importInputRef}
                id="focus-room-playlist-url"
                name="playlistUrl"
                type="url"
                autoComplete="url"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                placeholder="Paste a YouTube playlist link..."
                className="h-12 flex-1 border-0 bg-transparent text-[var(--focus-text)] placeholder:text-[var(--focus-text-muted)] focus-visible:ring-0"
              />
              <Button type="submit" disabled={importPlaylist.isPending} className="focus-room-primary h-12 px-6">
                <UploadCloud className="h-4 w-4" />
                {importPlaylist.isPending ? "Importing..." : "Start learning"}
                {!importPlaylist.isPending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-3 text-xs text-[var(--focus-text-muted)]">
              Public YouTube playlists only / your progress stays saved to your account.
            </p>

            {featured && (
              <Button
                variant="outline"
                className="focus-room-secondary mt-8"
                onClick={() => navigate("/playlists/" + featured._id + "/watch")}
              >
                <Clock3 className="h-4 w-4" />
                Continue: {featured.title}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section id="saved-playlists" className="page-shell mt-14 space-y-5 pb-20 sm:mt-20 sm:pb-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--focus-accent)]">Your library</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--focus-text)]">Keep going when you are ready.</h2>
            <p className="mt-2 text-sm text-[var(--focus-text-secondary)]">
              {stats.total} total <span className="mx-2 text-[var(--focus-text-muted)]">/</span> {stats.active} active{" "}
              <span className="mx-2 text-[var(--focus-text-muted)]">/</span> {stats.completed} completed
            </p>
          </div>
          <Button variant="outline" className="focus-room-secondary" onClick={() => importInputRef.current?.focus()}>
            Add playlist
          </Button>
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            title="Your Focus Room is ready"
            description="Paste a public YouTube playlist above and your saved lessons will appear here."
            icon={ListVideo}
            className="focus-room-elevated border"
            actionLabel="Paste a playlist link"
            onAction={() => importInputRef.current?.focus()}
          />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {playlists.map((playlist, index) => (
                <motion.div
                  key={playlist._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  transition={reduceMotion ? undefined : { duration: 0.25, delay: Math.min(index, 5) * 0.03 }}
                >
                  <Card className="focus-room-surface group overflow-hidden rounded-[var(--focus-radius-lg)] border shadow-[0_24px_48px_-32px_rgba(0,0,0,0.75)]">
                    <div className="relative">
                      <img
                        src={playlist.thumbnailUrl}
                        alt={playlist.title}
                        className="aspect-video h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                        <Badge variant={playlist.status === "completed" ? "success" : "secondary"}>
                          {playlist.status === "completed" ? "Completed" : (playlist.progressPercent || 0) + "%"}
                        </Badge>
                        <Badge variant="outline">{playlist.videoCount || 0} videos</Badge>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-[var(--focus-text)]">
                          {playlist.title}
                        </h3>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--focus-border)]">
                          <div
                            className="focus-room-progress h-full rounded-full transition-all"
                            style={{ width: getProgressWidth(playlist.progressPercent) }}
                          />
                        </div>
                      </div>
                      <div className="focus-room-muted space-y-1.5 text-sm">
                        <p>{formatDuration(playlist.totalDuration)}</p>
                        <p className="truncate">{playlist.channelTitle || "YouTube playlist"}</p>
                        <p>Updated {formatDate(playlist.updatedAt)}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          className="focus-room-primary flex-1"
                          onClick={() => navigate("/playlists/" + playlist._id + "/watch")}
                        >
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          className="focus-room-secondary"
                          onClick={() => navigate("/playlists/" + playlist._id)}
                        >
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteTarget(playlist)}
                          disabled={deletePlaylist.isPending}
                          aria-label={"Delete " + playlist.title}
                          title={"Delete " + playlist.title}
                          className="shrink-0 border-[var(--focus-border)] text-red-300 hover:bg-red-400/10 hover:text-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            <Pagination pagination={playlistsQuery.data?.pagination} onPageChange={setPage} />
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this playlist?"
        description={
          deleteTarget
            ? '"' +
              deleteTarget.title +
              '" and its saved progress will be removed from your Focus Room. This cannot be undone.'
            : ""
        }
        busy={deletePlaylist.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
}

function getProgressWidth(progress) {
  return `${Math.max(0, Math.min(100, progress || 0))}%`;
}
