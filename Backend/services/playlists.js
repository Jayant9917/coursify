const ApiError = require("../utils/apiError");
const paginate = require("../utils/paginate");
const { ImportedPlaylist, ImportedPlaylistVideo } = require("../models");
const { extractPlaylistId, fetchYouTubePlaylistDetails } = require("../utils/youtube");

const isOwnerOrAdmin = (actor, ownerId) => actor?.role === "admin" || String(actor?.id) === String(ownerId);

const parseSort = (query = {}) => {
  const sortBy = ["updatedAt", "createdAt", "title", "progressPercent", "videoCount"].includes(query.sortBy)
    ? query.sortBy
    : "updatedAt";
  const sortOrder = String(query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder };
};

const normalizePlaylistDoc = async (playlistDoc) => {
  if (!playlistDoc) return null;
  const videos = await ImportedPlaylistVideo.find({ playlistId: playlistDoc._id })
    .sort({ position: 1 })
    .lean();

  const playlist = playlistDoc.toObject ? playlistDoc.toObject() : playlistDoc;
  return {
    ...playlist,
    videos,
  };
};

const recomputePlaylistStats = async (playlistId) => {
  const [videos, playlist] = await Promise.all([
    ImportedPlaylistVideo.find({ playlistId }).sort({ position: 1 }).lean(),
    ImportedPlaylist.findById(playlistId),
  ]);

  if (!playlist) return null;

  const totalVideos = videos.length;
  const completedVideos = videos.filter((video) => video.watched || video.lastPositionSeconds >= video.durationSeconds).length;
  const totalDuration = videos.reduce((sum, video) => sum + (Number(video.durationSeconds) || 0), 0);
  const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  playlist.videoCount = totalVideos;
  playlist.totalDuration = totalDuration;
  playlist.progressPercent = Math.max(0, Math.min(100, progressPercent));
  playlist.status = playlist.progressPercent === 100 && totalVideos > 0 ? "completed" : "active";
  await playlist.save();

  return playlist;
};

const pickResumeState = (playlist, videos) => {
  const orderedVideos = Array.isArray(videos) ? videos : [];
  const lastWatchedId = String(playlist?.lastWatchedVideoId || "");
  const resumeVideo =
    orderedVideos.find((video) => String(video._id) === lastWatchedId) ||
    orderedVideos.find((video) => !video.watched) ||
    orderedVideos[0] ||
    null;

  return {
    resumeVideoId: resumeVideo?._id || null,
    resumePositionSeconds: String(resumeVideo?._id) === lastWatchedId ? playlist?.lastWatchedSeconds || 0 : 0,
    resumeIndex: resumeVideo ? Math.max(0, orderedVideos.findIndex((video) => String(video._id) === String(resumeVideo._id))) : 0,
  };
};

const playlistService = {
  async import(actor, payload) {
    const playlistId = extractPlaylistId(payload.url);
    if (!playlistId) {
      throw new ApiError(400, "Enter a valid YouTube playlist URL");
    }

    const existing = await ImportedPlaylist.findOne({ userId: actor.id, youtubePlaylistId: playlistId });
    if (existing) {
      throw new ApiError(409, "This playlist is already imported");
    }

    const meta = await fetchYouTubePlaylistDetails(playlistId);
    const playlist = await ImportedPlaylist.create({
      userId: actor.id,
      youtubePlaylistId: meta.youtubePlaylistId,
      title: meta.title,
      description: meta.description,
      thumbnailUrl: meta.thumbnailUrl,
      channelTitle: meta.channelTitle,
      videoCount: meta.videoCount,
      totalDuration: meta.totalDuration,
      status: meta.videoCount > 0 ? "active" : "active",
      progressPercent: 0,
      isAvailable: true,
    });

    if (meta.videos.length > 0) {
      await ImportedPlaylistVideo.insertMany(
        meta.videos.map((video) => ({
          playlistId: playlist._id,
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          durationSeconds: video.durationSeconds,
          position: video.position,
          watched: false,
          lastPositionSeconds: 0,
          isAvailable: video.isAvailable,
        }))
      );
    }

    const saved = await recomputePlaylistStats(playlist._id);
    return normalizePlaylistDoc(saved);
  },

  async listMine(actor, query = {}) {
    const filter = { userId: actor.id };

    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    if (query.search) {
      const regex = new RegExp(String(query.search).trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { channelTitle: regex },
        { youtubePlaylistId: regex },
      ];
    }

    return paginate(ImportedPlaylist, filter, {
      page: query.page,
      limit: query.limit,
      sort: parseSort(query),
    });
  },

  async getById(actor, playlistId) {
    const playlist = await ImportedPlaylist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (!isOwnerOrAdmin(actor, playlist.userId)) {
      throw new ApiError(403, "You do not have permission to access this playlist");
    }
    return normalizePlaylistDoc(playlist);
  },

  async remove(actor, playlistId) {
    const playlist = await ImportedPlaylist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (!isOwnerOrAdmin(actor, playlist.userId)) {
      throw new ApiError(403, "You do not have permission to delete this playlist");
    }

    await ImportedPlaylistVideo.deleteMany({ playlistId: playlist._id });
    await playlist.deleteOne();
    return { success: true, id: String(playlist._id) };
  },

  async watch(actor, playlistId) {
    const playlist = await ImportedPlaylist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (!isOwnerOrAdmin(actor, playlist.userId)) {
      throw new ApiError(403, "You do not have permission to access this playlist");
    }

    const videos = await ImportedPlaylistVideo.find({ playlistId }).sort({ position: 1 }).lean();
    const resume = pickResumeState(playlist, videos);

    return {
      ...(playlist.toObject ? playlist.toObject() : playlist),
      videos,
      ...resume,
    };
  },

  async updateProgress(actor, playlistId, payload) {
    const playlist = await ImportedPlaylist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (!isOwnerOrAdmin(actor, playlist.userId)) {
      throw new ApiError(403, "You do not have permission to update this playlist");
    }

    const video = await ImportedPlaylistVideo.findOne({ _id: payload.videoId, playlistId });
    if (!video) {
      throw new ApiError(404, "Playlist video not found");
    }
    if (!video.isAvailable) {
      throw new ApiError(410, "This YouTube video is no longer available.", [], "YOUTUBE_VIDEO_UNAVAILABLE");
    }

    const watchedSeconds = Math.max(0, Number(payload.currentTimeSeconds) || 0);
    const durationSeconds = Math.max(0, Number(payload.durationSeconds) || video.durationSeconds || 0);
    const isWatched = Boolean(payload.isWatched) || (durationSeconds > 0 && watchedSeconds >= Math.max(0, durationSeconds - 5));

    video.lastPositionSeconds = watchedSeconds;
    video.watched = isWatched || video.watched;
    await video.save();

    playlist.lastWatchedVideoId = video._id;
    playlist.lastWatchedIndex = Math.max(0, Number(video.position) - 1);
    playlist.lastWatchedSeconds = watchedSeconds;
    await playlist.save();

    const savedPlaylist = await recomputePlaylistStats(playlistId);
    return normalizePlaylistDoc(savedPlaylist);
  },

  async refresh(actor, playlistId) {
    const playlist = await ImportedPlaylist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (!isOwnerOrAdmin(actor, playlist.userId)) {
      throw new ApiError(403, "You do not have permission to refresh this playlist");
    }

    let meta;
    try {
      meta = await fetchYouTubePlaylistDetails(playlist.youtubePlaylistId);
    } catch (error) {
      if (error?.code === "YOUTUBE_NOT_FOUND" || error?.code === "YOUTUBE_RESOURCE_UNAVAILABLE") {
        playlist.isAvailable = false;
        await ImportedPlaylistVideo.updateMany({ playlistId }, { $set: { isAvailable: false } });
        await playlist.save();
        return normalizePlaylistDoc(playlist);
      }
      throw error;
    }
    const existingVideos = await ImportedPlaylistVideo.find({ playlistId }).sort({ position: 1 });
    const existingMap = new Map(existingVideos.map((video) => [String(video.youtubeVideoId), video]));
    const seenIds = new Set();

    for (const videoData of meta.videos) {
      seenIds.add(String(videoData.youtubeVideoId));
      const existing = existingMap.get(String(videoData.youtubeVideoId));

      if (existing) {
        existing.title = videoData.title;
        existing.description = videoData.description;
        existing.thumbnailUrl = videoData.thumbnailUrl;
        existing.durationSeconds = videoData.durationSeconds;
        existing.position = videoData.position;
        existing.isAvailable = videoData.isAvailable;
        await existing.save();
      } else {
        await ImportedPlaylistVideo.create({
          playlistId,
          youtubeVideoId: videoData.youtubeVideoId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          durationSeconds: videoData.durationSeconds,
          position: videoData.position,
          watched: false,
          lastPositionSeconds: 0,
          isAvailable: videoData.isAvailable,
        });
      }
    }

    for (const existing of existingVideos) {
      if (!seenIds.has(String(existing.youtubeVideoId))) {
        existing.isAvailable = false;
        await existing.save();
      }
    }

    playlist.title = meta.title;
    playlist.description = meta.description;
    playlist.thumbnailUrl = meta.thumbnailUrl;
    playlist.channelTitle = meta.channelTitle;
    playlist.isAvailable = true;
    await playlist.save();

    const savedPlaylist = await recomputePlaylistStats(playlistId);
    return normalizePlaylistDoc(savedPlaylist);
  },
};

module.exports = playlistService;
