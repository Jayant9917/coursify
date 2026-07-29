const asyncHandler = require("../utils/asyncHandler");
const playlistService = require("../services/playlists");

const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

const playlistController = {
  import: asyncHandler(async (req, res) => {
    const data = await playlistService.import(req.user, req.body);
    send(res, data, 201);
  }),
  me: asyncHandler(async (req, res) => {
    const data = await playlistService.listMine(req.user, req.query);
    send(res, data);
  }),
  getById: asyncHandler(async (req, res) => {
    const data = await playlistService.getById(req.user, req.params.id);
    send(res, data);
  }),
  remove: asyncHandler(async (req, res) => {
    const data = await playlistService.remove(req.user, req.params.id);
    send(res, data);
  }),
  watch: asyncHandler(async (req, res) => {
    const data = await playlistService.watch(req.user, req.params.id);
    send(res, data);
  }),
  progress: asyncHandler(async (req, res) => {
    const data = await playlistService.updateProgress(req.user, req.params.id, req.body);
    send(res, data);
  }),
  refresh: asyncHandler(async (req, res) => {
    const data = await playlistService.refresh(req.user, req.params.id);
    send(res, data);
  }),
};

module.exports = playlistController;
