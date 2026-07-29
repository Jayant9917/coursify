const ApiError = require("./apiError");

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const playlistCache = new Map();
const CACHE_TTL_MS = Math.max(30, Number(process.env.YOUTUBE_CACHE_TTL_SECONDS || 300)) * 1000;

const getYouTubeApiKey = () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "YouTube API is not configured", [], "YOUTUBE_NOT_CONFIGURED");
  }
  return apiKey;
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = payload?.error?.errors?.[0]?.reason || "";
      if (response.status === 403 && ["quotaExceeded", "dailyLimitExceeded", "userRateLimitExceeded", "rateLimitExceeded"].includes(reason)) {
        throw new ApiError(429, "YouTube quota is temporarily exhausted. Please try again later.", [], "YOUTUBE_QUOTA_EXCEEDED");
      }
      if (response.status === 403 && ["forbidden", "playlistForbidden", "videoForbidden"].includes(reason)) {
        throw new ApiError(404, "This YouTube resource is private or unavailable.", [], "YOUTUBE_RESOURCE_UNAVAILABLE");
      }
      if (response.status === 404) {
        throw new ApiError(404, "YouTube resource was not found or is no longer public.", [], "YOUTUBE_NOT_FOUND");
      }
      if (response.status === 429) {
        throw new ApiError(429, "YouTube is rate limiting requests. Please try again later.", [], "YOUTUBE_RATE_LIMITED");
      }
      if (response.status >= 500) {
        throw new ApiError(503, "YouTube is temporarily unavailable. Please try again later.", [], "YOUTUBE_UNAVAILABLE");
      }
      throw new ApiError(502, payload?.error?.message || "YouTube request failed", [], "YOUTUBE_PROVIDER_ERROR");
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(504, "YouTube request timed out", [], "YOUTUBE_TIMEOUT");
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "YouTube could not be reached. Please try again later.", [], "YOUTUBE_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
};

const extractPlaylistId = (input) => {
  if (!input || typeof input !== "string") return "";
  const value = input.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const playlistId = url.searchParams.get("list") || "";
    if (playlistId) return playlistId.trim();
  } catch {
    // Not a full URL, fall through to raw value handling.
  }

  if (/^[A-Za-z0-9_-]{10,150}$/.test(value)) {
    return value;
  }

  const match = value.match(/[?&]list=([A-Za-z0-9_-]{10,150})/i);
  return match?.[1] || "";
};

const parseIsoDurationToSeconds = (value = "") => {
  const match = String(value).match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i
  );
  if (!match) return 0;

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
};

const getThumbnailUrl = (thumbnails = {}) =>
  thumbnails.maxres?.url ||
  thumbnails.standard?.url ||
  thumbnails.high?.url ||
  thumbnails.medium?.url ||
  thumbnails.default?.url ||
  "";

const fetchYouTubePlaylistDetails = async (playlistId) => {
  const apiKey = getYouTubeApiKey();
  const normalizedPlaylistId = String(playlistId || "").trim();
  if (!normalizedPlaylistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  const cached = playlistCache.get(normalizedPlaylistId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const playlistInfoUrl =
    `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${encodeURIComponent(normalizedPlaylistId)}&key=${encodeURIComponent(apiKey)}`;
  const playlistInfo = await fetchJson(playlistInfoUrl);
  const playlist = playlistInfo?.items?.[0];

  if (!playlist) {
    throw new ApiError(404, "YouTube playlist not found or is not public", [], "YOUTUBE_NOT_FOUND");
  }

  const playlistSnippet = playlist.snippet || {};
  const playlistTitle = playlistSnippet.title || "Untitled playlist";
  const playlistDescription = playlistSnippet.description || "";
  const playlistThumbnailUrl = getThumbnailUrl(playlistSnippet.thumbnails || {});
  const channelTitle = playlistSnippet.channelTitle || "";

  const videos = [];
  let pageToken = "";

  do {
    const playlistItemsUrl =
      `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(normalizedPlaylistId)}&key=${encodeURIComponent(apiKey)}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const playlistItems = await fetchJson(playlistItemsUrl);
    const items = Array.isArray(playlistItems?.items) ? playlistItems.items : [];
    const videoIds = items
      .map((item) => item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId || "")
      .filter(Boolean);

    const durationMap = new Map();
    if (videoIds.length > 0) {
      for (let index = 0; index < videoIds.length; index += 50) {
        const batch = videoIds.slice(index, index + 50);
        const videosUrl =
          `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${encodeURIComponent(batch.join(","))}&key=${encodeURIComponent(apiKey)}`;
        const videosInfo = await fetchJson(videosUrl);
        for (const item of videosInfo?.items || []) {
          durationMap.set(item.id, {
            durationSeconds: parseIsoDurationToSeconds(item?.contentDetails?.duration || ""),
            title: item?.snippet?.title || "",
            description: item?.snippet?.description || "",
            thumbnailUrl: getThumbnailUrl(item?.snippet?.thumbnails || {}),
            isAvailable: true,
          });
        }
      }
    }

    for (const item of items) {
      const youtubeVideoId = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId || "";
      if (!youtubeVideoId) continue;

      const fallbackTitle = item?.snippet?.title || `Video ${videos.length + 1}`;
      const resolved = durationMap.get(youtubeVideoId) || {};

      videos.push({
        youtubeVideoId,
        title: resolved.title || fallbackTitle,
        description: resolved.description || item?.snippet?.description || "",
        thumbnailUrl:
          resolved.thumbnailUrl ||
          getThumbnailUrl(item?.snippet?.thumbnails || {}) ||
          `https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/hqdefault.jpg`,
        durationSeconds: resolved.durationSeconds || 0,
        position: Number(item?.snippet?.position || videos.length) + 1,
        isAvailable: durationMap.has(youtubeVideoId) && resolved.isAvailable !== false,
      });
    }

    pageToken = playlistItems?.nextPageToken || "";
  } while (pageToken);

  const totalDuration = videos.reduce((sum, video) => sum + (Number(video.durationSeconds) || 0), 0);

  const result = {
    youtubePlaylistId: normalizedPlaylistId,
    title: playlistTitle,
    description: playlistDescription,
    thumbnailUrl: playlistThumbnailUrl,
    channelTitle,
    videoCount: videos.length,
    totalDuration,
    videos,
  };
  playlistCache.set(normalizedPlaylistId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
};

module.exports = {
  extractPlaylistId,
  parseIsoDurationToSeconds,
  fetchYouTubePlaylistDetails,
  getYouTubeApiKey,
};
