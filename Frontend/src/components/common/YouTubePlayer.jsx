import { useEffect, useRef } from "react";

let youtubeApiPromise = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API is unavailable"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const onReady = () => resolve(window.YT);

    if (existing) {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        onReady();
      };
      return;
    }

    window.onYouTubeIframeAPIReady = onReady;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  });

  return youtubeApiPromise;
}

export function YouTubePlayer({
  videoId,
  startSeconds = 0,
  onReady,
  onProgress,
  onEnded,
  onError,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const currentVideoRef = useRef(videoId);
  const callbacksRef = useRef({ onReady, onProgress, onEnded, onError });

  useEffect(() => {
    callbacksRef.current = { onReady, onProgress, onEnded, onError };
  }, [onReady, onProgress, onEnded, onError]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await loadYouTubeApi();
      if (!mounted || !containerRef.current) return;

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            fs: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            start: Math.max(0, Number(startSeconds) || 0),
          },
          events: {
            onReady: (event) => {
              if (Number(startSeconds) > 0) {
                event.target.seekTo(Number(startSeconds), true);
                event.target.pauseVideo();
              }
              callbacksRef.current.onReady?.(event.target);
            },
            onStateChange: (event) => {
              const player = event.target;
              const YT = window.YT;
              if (!YT) return;

              if (event.data === YT.PlayerState.PLAYING) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = window.setInterval(() => {
                  const currentTime = player.getCurrentTime?.() || 0;
                  const duration = player.getDuration?.() || 0;
                  callbacksRef.current.onProgress?.(currentTime, duration);
                }, 1000);
              }

              if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                clearInterval(progressTimerRef.current);
                const currentTime = player.getCurrentTime?.() || 0;
                const duration = player.getDuration?.() || 0;
                callbacksRef.current.onProgress?.(currentTime, duration);
              }

              if (event.data === YT.PlayerState.ENDED) {
                callbacksRef.current.onEnded?.(player);
              }
            },
            onError: (event) => {
              callbacksRef.current.onError?.(event);
            },
          },
        });
        return;
      }

      if (currentVideoRef.current !== videoId) {
        playerRef.current.cueVideoById({
          videoId,
          startSeconds: Math.max(0, Number(startSeconds) || 0),
        });
        currentVideoRef.current = videoId;
      } else if (Number(startSeconds) > 0) {
        playerRef.current.seekTo(Number(startSeconds), true);
      }
    };

    initialize().catch((error) => {
      callbacksRef.current.onError?.(error);
    });

    return () => {
      mounted = false;
      clearInterval(progressTimerRef.current);
    };
  }, [videoId, startSeconds]);

  useEffect(
    () => () => {
      clearInterval(progressTimerRef.current);
      playerRef.current = null;
    },
    []
  );

  return <div ref={containerRef} className="aspect-video w-full overflow-hidden rounded-3xl bg-black" />;
}
