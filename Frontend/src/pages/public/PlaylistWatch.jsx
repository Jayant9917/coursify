import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, PlayCircle, SkipForward, Video } from "lucide-react";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePlaylistWatch, useUpdatePlaylistProgress } from "@/hooks/usePlaylists";
import { YouTubePlayer } from "@/components/common/YouTubePlayer";
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
  const lastSavedSecondsRef = useRef(0);

  const playlist = watchQuery.data || {};
  const videos = playlist.videos || [];

  useEffect(() => {
    if (!activeVideoId && playlist.resumeVideoId) {
      setActiveVideoId(String(playlist.resumeVideoId));
    } else if (!activeVideoId && videos.length > 0) {
      setActiveVideoId(String(videos[0]._id));
    }
  }, [activeVideoId, playlist.resumeVideoId, videos]);

  const activeVideo = useMemo(
    () => videos.find((video) => String(video._id) === String(activeVideoId)) || videos[0] || null,
    [videos, activeVideoId]
  );

  const activeVideoIndex = useMemo(
    () => videos.findIndex((video) => String(video._id) === String(activeVideoId)),
    [videos, activeVideoId]
  );

  const startSeconds =
    String(activeVideo?._id || "") === String(playlist.resumeVideoId || "")
      ? Number(playlist.resumePositionSeconds || 0)
      : 0;

  useEffect(() => {
    lastSavedSecondsRef.current = startSeconds;
    const resumePercent = activeVideo?.durationSeconds > 0 ? Math.round((startSeconds / activeVideo.durationSeconds) * 100) : 0;
    setCurrentPlaybackPercent(Math.max(0, Math.min(100, resumePercent)));
    setCurrentPlaybackLabel(`${formatDuration(startSeconds)} / ${formatDuration(activeVideo?.durationSeconds || 0)}`);
  }, [activeVideo, activeVideoId, startSeconds]);

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
      const nextVideo = videos[activeVideoIndex + 1];
      if (nextVideo) {
        setActiveVideoId(String(nextVideo._id));
      }
      watchQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (watchQuery.isLoading) return <LoadingSpinner />;
  if (watchQuery.isError) {
    return <ErrorState description="We could not load this playlist." onRetry={() => watchQuery.refetch()} />;
  }

  if (!playlist._id) {
    return <ErrorState title="Playlist unavailable" description="This playlist could not be found." />;
  }

  const goBack = () => {
    const previousRoute = getPreviousRoute();
    navigate(previousRoute || `/playlists/${playlist._id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-white/10 bg-neutral-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Focus Playlists</p>
            <h1 className="truncate text-base font-semibold">{playlist.title}</h1>
          </div>
          <Badge variant={playlist.status === "completed" ? "success" : "secondary"}>
            {playlist.status === "completed" ? "Completed" : `${playlist.progressPercent || 0}%`}
          </Badge>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-white/10 bg-[#111111] text-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/60">{activeVideo?.title || "Select a video"}</p>
                <h2 className="mt-1 text-2xl font-bold">{playlist.title}</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Clock3 className="h-4 w-4" />
                {formatDuration(playlist.totalDuration)}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {activeVideo ? (
              <YouTubePlayer
                videoId={activeVideo.youtubeVideoId}
                startSeconds={startSeconds}
                onProgress={handleProgress}
                onEnded={handleEnded}
                onError={() => toast.error("Unable to load the YouTube player")}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-3xl bg-black">
                <div className="text-center text-white/70">
                  <PlayCircle className="mx-auto h-10 w-10" />
                  <p className="mt-3">Choose a video to begin.</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Watching now</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={currentPlaybackPercent} className="w-56 bg-white/10" />
                  <span className="text-sm font-semibold">{currentPlaybackPercent}%</span>
                </div>
                <p className="mt-2 text-xs text-white/45">{currentPlaybackLabel}</p>
                <p className="mt-1 text-xs text-white/45">Playlist completion: {playlist.progressPercent || 0}%</p>
              </div>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  const nextVideo = videos[activeVideoIndex + 1];
                  if (nextVideo) {
                    setActiveVideoId(String(nextVideo._id));
                  }
                }}
                disabled={!videos[activeVideoIndex + 1]}
              >
                Next video
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="h-fit border-white/10 bg-white p-4 text-neutral-950 dark:bg-neutral-950 dark:text-white">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Playlist videos</p>
              <h2 className="mt-1 text-xl font-bold">{videos.length} items</h2>
            </div>
            <Badge variant="outline">{playlist.status}</Badge>
          </div>
          <div className="space-y-3">
            {videos.map((video) => {
              const active = String(video._id) === String(activeVideoId);
              return (
                <button
                  type="button"
                  key={video._id}
                  onClick={() => setActiveVideoId(String(video._id))}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-lime-400 bg-lime-50 dark:border-lime-500/40 dark:bg-lime-300/10"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                  }`}
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-24 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{video.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" />
                        {formatDuration(video.durationSeconds)}
                      </span>
                      <span>#{video.position}</span>
                      <span>{video.watched ? "Watched" : "Pending"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
