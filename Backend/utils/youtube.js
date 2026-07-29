const ApiError = require("./apiError");

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const getYouTubeApiKey = () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "YouTube API is not configured");
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
      throw new ApiError(502, payload?.error?.message || "YouTube request failed");
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(504, "YouTube request timed out");
    }
    throw error;
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

  const playlistInfoUrl =
    `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${encodeURIComponent(normalizedPlaylistId)}&key=${encodeURIComponent(apiKey)}`;
  const playlistInfo = await fetchJson(playlistInfoUrl);
  const playlist = playlistInfo?.items?.[0];

  if (!playlist) {
    throw new ApiError(404, "YouTube playlist not found or is not public");
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
        isAvailable: resolved.isAvailable !== false,
      });
    }

    pageToken = playlistItems?.nextPageToken || "";
  } while (pageToken);

  const totalDuration = videos.reduce((sum, video) => sum + (Number(video.durationSeconds) || 0), 0);

  return {
    youtubePlaylistId: normalizedPlaylistId,
    title: playlistTitle,
    description: playlistDescription,
    thumbnailUrl: playlistThumbnailUrl,
    channelTitle,
    videoCount: videos.length,
    totalDuration,
    videos,
  };
};

module.exports = {
  extractPlaylistId,
  parseIsoDurationToSeconds,
  fetchYouTubePlaylistDetails,
  getYouTubeApiKey,
};
