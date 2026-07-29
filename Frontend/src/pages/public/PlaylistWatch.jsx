import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Keyboard,
  PanelRightClose,
  PanelRightOpen,
  PlayCircle,
  SkipForward,
  Video,
} from "lucide-react";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePlaylistWatch, useUpdatePlaylistProgress } from "@/hooks/usePlaylists";
import { YouTubePlayer } from "@/components/common/YouTubePlayer";
import { PomodoroTimer } from "@/components/common/PomodoroTimer";
import { formatDuration } from "@/utils/formatDuration";
import { getPreviousRoute } from "@/utils/routeHistory";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

export function PlaylistWatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const watchQuery = usePlaylistWatch(id);
  const progressMutation = useUpdatePlaylistProgress();
  const [activeVideoId, setActiveVideoId] = useState("");
  const [currentPlaybackPercent, setCurrentPlaybackPercent] = useState(0);
  const [currentPlaybackLabel, setCurrentPlaybackLabel] = useState("0:00 / 0:00");
  const [unavailableVideoIds, setUnavailableVideoIds] = useState(() => new Set());
  const [showQueue, setShowQueue] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const lastSavedSecondsRef = useRef(0);
  const playerRef = useRef(null);
  const activeQueueItemRef = useRef(null);
  const shortcutButtonRef = useRef(null);
  const shortcutDialogRef = useRef(null);
  const shortcutCloseRef = useRef(null);
  const shortcutsWasOpenRef = useRef(false);

  const playlist = watchQuery.data || {};
  const videos = playlist.videos || [];
  const availableVideos = useMemo(() => videos.filter((video) => video.isAvailable !== false), [videos]);

  useEffect(() => {
    const resumeVideo = videos.find(
      (video) => String(video._id) === String(playlist.resumeVideoId) && video.isAvailable !== false,
    );
    if (!activeVideoId && resumeVideo) {
      setActiveVideoId(String(playlist.resumeVideoId));
    } else if (!activeVideoId && availableVideos.length > 0) {
      setActiveVideoId(String(availableVideos[0]._id));
    }
  }, [activeVideoId, playlist.resumeVideoId, availableVideos, videos]);

  const activeVideo = useMemo(
    () => videos.find((video) => String(video._id) === String(activeVideoId)) || availableVideos[0] || null,
    [videos, activeVideoId, availableVideos],
  );

  const activeVideoIndex = useMemo(
    () => videos.findIndex((video) => String(video._id) === String(activeVideoId)),
    [videos, activeVideoId],
  );
  const isVideoUnavailable = useCallback(
    (video) => Boolean(video && (video.isAvailable === false || unavailableVideoIds.has(String(video._id)))),
    [unavailableVideoIds],
  );
  const nextVideo = useMemo(
    () => videos.slice(Math.max(0, activeVideoIndex + 1)).find((video) => !isVideoUnavailable(video)) || null,
    [videos, activeVideoIndex, isVideoUnavailable],
  );
  const previousVideo = useMemo(
    () =>
      videos
        .slice(0, Math.max(0, activeVideoIndex))
        .reverse()
        .find((video) => !isVideoUnavailable(video)) || null,
    [videos, activeVideoIndex, isVideoUnavailable],
  );
  const activeVideoUnavailable = isVideoUnavailable(activeVideo);
  const currentVideoPosition = activeVideoIndex >= 0 ? activeVideoIndex + 1 : 0;

  const startSeconds =
    String(activeVideo?._id || "") === String(playlist.resumeVideoId || "")
      ? Number(playlist.resumePositionSeconds || 0)
      : 0;

  useEffect(() => {
    lastSavedSecondsRef.current = startSeconds;
    const resumePercent =
      activeVideo?.durationSeconds > 0 ? Math.round((startSeconds / activeVideo.durationSeconds) * 100) : 0;
    setCurrentPlaybackPercent(Math.max(0, Math.min(100, resumePercent)));
    setCurrentPlaybackLabel(`${formatDuration(startSeconds)} / ${formatDuration(activeVideo?.durationSeconds || 0)}`);
  }, [activeVideo, activeVideoId, startSeconds]);

  const goBack = useCallback(() => {
    const previousRoute = getPreviousRoute();
    navigate(previousRoute || `/playlists/${playlist._id}`);
  }, [navigate, playlist._id]);

  useEffect(() => {
    activeQueueItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeVideoId]);

  useEffect(() => {
    if (!showShortcuts) {
      if (shortcutsWasOpenRef.current) shortcutButtonRef.current?.focus();
      shortcutsWasOpenRef.current = false;
      return undefined;
    }

    shortcutsWasOpenRef.current = true;
    shortcutCloseRef.current?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        shortcutDialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) || [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => window.removeEventListener("keydown", trapFocus);
  }, [showShortcuts]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
      if (typing) return;

      const key = event.key.toLowerCase();
      if (key === "q") {
        event.preventDefault();
        setShowQueue((visible) => !visible);
        return;
      }
      if (key === "?") {
        event.preventDefault();
        setShowShortcuts((visible) => !visible);
        return;
      }
      if (event.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else {
          goBack();
        }
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        const player = playerRef.current;
        if (!player) return;
        if (player.getPlayerState?.() === window.YT?.PlayerState.PLAYING) player.pauseVideo?.();
        else player.playVideo?.();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const player = playerRef.current;
        if (!player) return;
        const current = Number(player.getCurrentTime?.() || 0);
        player.seekTo?.(Math.max(0, current + (event.key === "ArrowRight" ? 10 : -10)), true);
        return;
      }
      if (key === "n" && nextVideo) {
        event.preventDefault();
        setActiveVideoId(String(nextVideo._id));
      }
      if (key === "p" && previousVideo) {
        event.preventDefault();
        setActiveVideoId(String(previousVideo._id));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, nextVideo, previousVideo, showShortcuts]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastSavedSecondsRef.current = startSeconds;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [startSeconds]);

  const handleProgress = async (currentTime, duration) => {
    if (!activeVideo || progressMutation.isPending) return;

    const current = Math.floor(Number(currentTime) || 0);
    const total = Math.floor(Number(duration) || activeVideo.durationSeconds || 0);
    const playbackPercent = total > 0 ? Math.round((current / total) * 100) : 0;
    const completed = total > 0 && current >= Math.max(0, total - 5);
    const shouldSave = completed || current - lastSavedSecondsRef.current >= 30;

    setCurrentPlaybackPercent(Math.max(0, Math.min(100, playbackPercent)));
    setCurrentPlaybackLabel(`${formatDuration(current)} / ${formatDuration(total)}`);

    if (!shouldSave) return;

    lastSavedSecondsRef.current = current;
    try {
      await progressMutation.mutateAsync({
        id: playlist._id,
        payload: {
          videoId: activeVideo._id,
          currentTimeSeconds: current,
          durationSeconds: total,
          isWatched: completed,
        },
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEnded = async () => {
    if (!activeVideo) return;
    try {
      await progressMutation.mutateAsync({
        id: playlist._id,
        payload: {
          videoId: activeVideo._id,
          currentTimeSeconds: activeVideo.durationSeconds || 0,
          durationSeconds: activeVideo.durationSeconds || 0,
          isWatched: true,
        },
      });
      toast.success("Video marked as watched");
      if (nextVideo) {
        setActiveVideoId(String(nextVideo._id));
      } else {
        toast.success("Playlist complete");
      }
      watchQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (watchQuery.isLoading)
    return (
      <div className="focus-room-page min-h-screen">
        <LoadingSpinner label="Opening Focus Room..." className="text-[var(--focus-text-secondary)]" />
      </div>
    );
  if (watchQuery.isError) {
    return (
      <div className="focus-room-page min-h-screen p-6">
        <ErrorState
          className="focus-room-elevated border"
          description="We could not load this playlist."
          onRetry={() => watchQuery.refetch()}
        />
      </div>
    );
  }

  if (!playlist._id) {
    return (
      <div className="focus-room-page min-h-screen p-6">
        <ErrorState
          className="focus-room-elevated border"
          title="Playlist unavailable"
          description="This playlist could not be found."
        />
      </div>
    );
  }

  return (
    <div className="focus-room-page min-h-screen">
      <div className="focus-room-glass sticky top-0 z-30 border-b px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="focus-room-control inline-flex items-center gap-2 text-sm font-medium text-[var(--focus-text-secondary)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--focus-text-muted)]">
              Focus Room
            </p>
            <h1 className="truncate text-base font-semibold">{playlist.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="focus-room-secondary"
              onClick={() => setShowQueue((visible) => !visible)}
              aria-pressed={showQueue}
            >
              {showQueue ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">{showQueue ? "Hide queue" : "Show queue"}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="focus-room-secondary"
              onClick={() => setShowShortcuts((visible) => !visible)}
              ref={shortcutButtonRef}
              aria-label="Show keyboard shortcuts"
              aria-pressed={showShortcuts}
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Badge
              variant={playlist.status === "completed" ? "success" : "secondary"}
              className={
                playlist.status === "completed"
                  ? ""
                  : "border border-[var(--focus-accent)] bg-[var(--focus-accent-subtle)] text-[var(--focus-accent)]"
              }
            >
              {playlist.status === "completed" ? "Completed" : `${playlist.progressPercent || 0}%`}
            </Badge>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 ${showQueue ? "lg:grid-cols-[minmax(0,1fr)_380px]" : "lg:grid-cols-1"}`}
      >
        <div className="space-y-6">
          <Card className="focus-room-surface overflow-hidden rounded-[var(--focus-radius-lg)] border text-white">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="truncate text-sm text-[var(--focus-text-secondary)]">
                    {activeVideo?.title || "Select a video"}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">{playlist.title}</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--focus-text-secondary)]">
                  <Clock3 className="h-4 w-4" />
                  {formatDuration(playlist.totalDuration)}
                </div>
              </div>
            </div>

            {showShortcuts ? (
              <div
                ref={shortcutDialogRef}
                className="focus-room-elevated mx-4 mb-4 rounded-[var(--focus-radius-md)] border p-4 text-sm text-[var(--focus-text-secondary)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcut-title"
              >
                <div className="flex items-center justify-between gap-4">
                  <p id="shortcut-title" className="font-semibold text-white">
                    Keyboard shortcuts
                  </p>
                  <button
                    ref={shortcutCloseRef}
                    type="button"
                    className="focus-room-control text-[var(--focus-text-secondary)] hover:text-white"
                    onClick={() => setShowShortcuts(false)}
                    aria-label="Close keyboard shortcuts"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Shortcut keys="Space" label="Play or pause" />
                  <Shortcut keys="← / →" label="Seek 10 seconds" />
                  <Shortcut keys="N" label="Next available video" />
                  <Shortcut keys="P" label="Previous available video" />
                  <Shortcut keys="Q" label="Show or hide queue" />
                  <Shortcut keys="Esc" label="Close help or go back" />
                </div>
              </div>
            ) : null}

            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              {activeVideo && !activeVideoUnavailable ? (
                <YouTubePlayer
                  videoId={activeVideo.youtubeVideoId}
                  startSeconds={startSeconds}
                  onReady={(player) => {
                    playerRef.current = player;
                  }}
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                  onError={(error) => {
                    const unavailableCodes = [2, 5, 100, 101, 150, 153];
                    if (unavailableCodes.includes(Number(error?.code))) {
                      setUnavailableVideoIds((current) => new Set(current).add(String(activeVideo._id)));
                      if (nextVideo) {
                        setActiveVideoId(String(nextVideo._id));
                        toast.info("This video is unavailable. Moving to the next available video.");
                      } else {
                        toast.error("This video is unavailable and there are no more available videos.");
                      }
                      return;
                    }
                    toast.error(error?.message || "Unable to load the YouTube player");
                  }}
                />
              ) : activeVideo ? (
                <div className="grid aspect-video place-items-center rounded-[var(--focus-radius-lg)] border border-[var(--focus-border)] bg-black px-6 text-center text-[var(--focus-text-secondary)]">
                  <div>
                    <Video className="mx-auto h-10 w-10" />
                    <p className="mt-3 font-semibold text-white">Video unavailable</p>
                    <p className="mt-2 text-sm">This item was removed, made private, or restricted on YouTube.</p>
                  </div>
                </div>
              ) : (
                <div className="grid aspect-video place-items-center rounded-[var(--focus-radius-lg)] border border-[var(--focus-border)] bg-black">
                  <div className="text-center text-[var(--focus-text-secondary)]">
                    <PlayCircle className="mx-auto h-10 w-10" />
                    <p className="mt-3">Choose a video to begin.</p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--focus-text-muted)]">
                    Watching now · Video {currentVideoPosition} of {videos.length}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress
                      value={currentPlaybackPercent}
                      className="w-56 bg-[var(--focus-border)]"
                      indicatorClassName="focus-room-progress"
                    />
                    <span className="text-sm font-semibold">{currentPlaybackPercent}%</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--focus-text-secondary)]">{currentPlaybackLabel}</p>
                  <p className="mt-1 text-xs text-[var(--focus-text-muted)]">
                    Playlist completion: {playlist.progressPercent || 0}%
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="focus-room-secondary"
                  title={nextVideo ? `Next: ${nextVideo.title}` : "No more available videos"}
                  onClick={() => {
                    if (nextVideo) {
                      setActiveVideoId(String(nextVideo._id));
                    }
                  }}
                  disabled={!nextVideo}
                >
                  Next video
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          <PomodoroTimer />
        </div>

        {showQueue ? (
          <Card className="focus-room-elevated h-fit rounded-[var(--focus-radius-lg)] border p-4 text-white lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--focus-text-muted)]">
                  Playlist videos
                </p>
                <h2 className="mt-1 text-xl font-bold">{videos.length} items</h2>
              </div>
              <Badge
                variant="outline"
                className="border-[var(--focus-border-strong)] bg-transparent text-[var(--focus-text-secondary)]"
              >
                {playlist.status}
              </Badge>
            </div>
            <p className="mb-4 text-xs text-[var(--focus-text-muted)]">
              Video {currentVideoPosition} of {videos.length}
            </p>
            <div className="focus-room-scrollbar space-y-3 overflow-y-auto lg:max-h-[calc(100vh-13rem)]">
              {videos.map((video) => {
                const active = String(video._id) === String(activeVideoId);
                const unavailable = isVideoUnavailable(video);
                return (
                  <button
                    type="button"
                    key={video._id}
                    ref={active ? activeQueueItemRef : null}
                    aria-current={active ? "true" : undefined}
                    aria-disabled={unavailable ? "true" : undefined}
                    onClick={() => !unavailable && setActiveVideoId(String(video._id))}
                    disabled={unavailable}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-l-2 border-l-[var(--focus-accent)] border-[var(--focus-border)] bg-[var(--focus-accent-subtle)]"
                        : "border-[var(--focus-border)] hover:border-[var(--focus-border-strong)] hover:bg-white/[0.04]"
                    } ${unavailable ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-24 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{video.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--focus-text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" />
                          {formatDuration(video.durationSeconds)}
                        </span>
                        <span>#{video.position}</span>
                        <span>{unavailable ? "Unavailable" : video.watched ? "Watched" : "Pending"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Shortcut({ keys, label }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <kbd className="rounded border border-[var(--focus-border-strong)] bg-black/20 px-2 py-1 text-xs text-white">
        {keys}
      </kbd>
    </div>
  );
}
