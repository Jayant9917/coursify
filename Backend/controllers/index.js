const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  authService,
  userService,
  courseService,
  sectionService,
  lessonService,
  enrollmentService,
  orderService,
  reviewService,
  wishlistService,
  noteService,
  categoryService,
  couponService,
  notificationService,
  platformService,
} = require("../services");
const uploadService = require("../services/upload");

const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

const authController = {
  register: asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    send(res, data, 201);
  }),
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    send(res, data);
  }),
  refresh: asyncHandler(async (req, res) => {
    const data = await authService.refresh(req.body.refreshToken);
    send(res, data);
  }),
  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    send(res, { success: true });
  }),
  forgotPassword: asyncHandler(async (req, res) => {
    const data = await authService.requestPasswordReset(req.body.email);
    send(res, data);
  }),
  resetPassword: asyncHandler(async (req, res) => {
    const data = await authService.resetPassword(req.body);
    send(res, data);
  }),
};

const userController = {
  me: asyncHandler(async (req, res) => {
    const data = await authService.getCurrentUser(req.user.id);
    send(res, data);
  }),
  updateMe: asyncHandler(async (req, res) => {
    const data = await userService.updateMe(req.user.id, req.body);
    send(res, data);
  }),
  getById: asyncHandler(async (req, res) => {
    const data = await userService.getById(req.params.id);
    send(res, data);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await authService.listUsers(req.query);
    send(res, data);
  }),
  updateStatus: asyncHandler(async (req, res) => {
    const data = await userService.updateStatus(req.user, req.params.id, req.body.status);
    send(res, data);
  }),
};

const courseController = {
  listPublic: asyncHandler(async (req, res) => {
    const data = await courseService.listPublic(req.query);
    send(res, data);
  }),
  getPublicBySlug: asyncHandler(async (req, res) => {
    const data = await courseService.getPublicBySlug(req.params.slug);
    send(res, data);
  }),
  create: asyncHandler(async (req, res) => {
    const data = await courseService.create(req.user, req.body);
    send(res, data, 201);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await courseService.update(req.user, req.params.id, req.body);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await courseService.delete(req.user, req.params.id);
    send(res, data);
  }),
  publish: asyncHandler(async (req, res) => {
    const data = await courseService.publish(req.user, req.params.id, req.body.isPublished);
    send(res, data);
  }),
  adminList: asyncHandler(async (req, res) => {
    const data = await courseService.adminList(req.query);
    send(res, data);
  }),
  instructorCourses: asyncHandler(async (req, res) => {
    const data = await courseService.instructorCourses(req.user.id, req.query);
    send(res, data);
  }),
  lessonAccess: asyncHandler(async (req, res) => {
    const data = await enrollmentService.getLessonAccessUrl(req.user, req.params.id, req.params.lessonId);
    send(res, data);
  }),
};

const sectionController = {
  create: asyncHandler(async (req, res) => {
    const data = await sectionService.create(req.user, req.params.id, req.body);
    send(res, data, 201);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await sectionService.update(req.user, req.params.id, req.body);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await sectionService.delete(req.user, req.params.id);
    send(res, data);
  }),
};

const lessonController = {
  create: asyncHandler(async (req, res) => {
    const data = await lessonService.create(req.user, req.params.id, req.body);
    send(res, data, 201);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await lessonService.update(req.user, req.params.id, req.body);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await lessonService.delete(req.user, req.params.id);
    send(res, data);
  }),
};

const enrollmentController = {
  create: asyncHandler(async (req, res) => {
    const data = await enrollmentService.enroll(req.user, req.body);
    send(res, data, 201);
  }),
  me: asyncHandler(async (req, res) => {
    const data = await enrollmentService.myEnrollments(req.user.id);
    send(res, data);
  }),
  progress: asyncHandler(async (req, res) => {
    const data = await enrollmentService.updateProgress(req.user, req.body);
    send(res, data);
  }),
  courseProgress: asyncHandler(async (req, res) => {
    const data = await enrollmentService.getCourseProgress(req.user, req.params.id);
    send(res, data);
  }),
};

const orderController = {
  create: asyncHandler(async (req, res) => {
    const data = await orderService.create(req.user, req.body);
    send(res, data, 201);
  }),
  lemonSqueezyWebhook: asyncHandler(async (req, res) => {
    const data = await orderService.handleLemonSqueezyWebhook({
      rawBody: req.rawBody || "",
      signature: req.get("X-Signature") || req.get("x-signature") || "",
      body: req.body,
    });
    send(res, data);
  }),
  me: asyncHandler(async (req, res) => {
    const data = await orderService.myOrders(req.user.id);
    send(res, data);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await orderService.listOrders(req.query);
    send(res, data);
  }),
  adminDetails: asyncHandler(async (req, res) => {
    const data = await orderService.getAdminOrder(req.params.id);
    send(res, data);
  }),
  adminRefund: asyncHandler(async (req, res) => {
    const data = await orderService.recordAdminRefund(req.params.id);
    send(res, data);
  }),
  webhookMonitoring: asyncHandler(async (req, res) => {
    const data = await orderService.listWebhookDeliveries(req.query.limit);
    send(res, data);
  }),
};

const reviewController = {
  create: asyncHandler(async (req, res) => {
    const data = await reviewService.create(req.user, req.params.id, req.body);
    send(res, data, 201);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await reviewService.list(req.params.id, req.query);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await reviewService.remove(req.user, req.params.id);
    send(res, data);
  }),
};

const wishlistController = {
  add: asyncHandler(async (req, res) => {
    const data = await wishlistService.add(req.user, req.params.courseId);
    send(res, data, 201);
  }),
  remove: asyncHandler(async (req, res) => {
    const data = await wishlistService.remove(req.user, req.params.courseId);
    send(res, data);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await wishlistService.list(req.user);
    send(res, data);
  }),
};

const noteController = {
  listPublic: asyncHandler(async (req, res) => send(res, await noteService.listPublic(req.query))),
  listMine: asyncHandler(async (req, res) => send(res, await noteService.listMine(req.user))),
  getPublicBySlug: asyncHandler(async (req, res) => send(res, await noteService.getPublicBySlug(req.params.slug))),
  create: asyncHandler(async (req, res) => send(res, await noteService.create(req.user, req.body), 201)),
  update: asyncHandler(async (req, res) => send(res, await noteService.update(req.user, req.params.id, req.body))),
  remove: asyncHandler(async (req, res) => send(res, await noteService.remove(req.user, req.params.id))),
  purchase: asyncHandler(async (req, res) => send(res, await noteService.purchase(req.user, req.params.id), 201)),
  download: asyncHandler(async (req, res) => send(res, await noteService.download(req.user, req.params.id))),
  myPurchases: asyncHandler(async (req, res) => send(res, await noteService.myPurchases(req.user.id))),
};

const categoryController = {
  list: asyncHandler(async (req, res) => {
    const data = await categoryService.list();
    send(res, data);
  }),
  create: asyncHandler(async (req, res) => {
    const data = await categoryService.create(req.body);
    send(res, data, 201);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await categoryService.update(req.params.id, req.body);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await categoryService.remove(req.params.id);
    send(res, data);
  }),
};

const couponController = {
  create: asyncHandler(async (req, res) => {
    const data = await couponService.create(req.body);
    send(res, data, 201);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await couponService.list();
    send(res, data);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await couponService.update(req.params.id, req.body);
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await couponService.remove(req.params.id);
    send(res, data);
  }),
  validate: asyncHandler(async (req, res) => {
    const data = await couponService.validate(req.body.code, req.body.subtotal, req.user.id);
    send(res, data);
  }),
};

const notificationController = {
  list: asyncHandler(async (req, res) => {
    const data = await notificationService.list(req.user.id);
    send(res, data);
  }),
  markRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markRead(req.user.id, req.params.id);
    send(res, data);
  }),
  markAllRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAllRead(req.user.id);
    send(res, data);
  }),
};

const uploadController = {
  image: asyncHandler(async (req, res) => {
    const data = await uploadService.uploadImage(req.user, req.body);
    send(res, data, 201);
  }),
  publicImage: asyncHandler(async (req, res) => {
    const data = await uploadService.uploadPublicAvatar(req.body);
    send(res, data, 201);
  }),
  lessonFile: asyncHandler(async (req, res) => {
    const data = await uploadService.requestLessonFileUpload(req.user, req.body);
    send(res, data, 201);
  }),
};

const instructorController = {
  courses: asyncHandler(async (req, res) => {
    const data = await courseService.instructorCourses(req.user.id, req.query);
    send(res, data);
  }),
  stats: asyncHandler(async (req, res) => {
    const data = await courseService.instructorStats(req.user.id);
    send(res, data);
  }),
};

const adminController = {
  stats: asyncHandler(async (req, res) => {
    const data = await courseService.adminStats();
    send(res, data);
  }),
  users: asyncHandler(async (req, res) => {
    const data = await authService.listUsers(req.query);
    send(res, data);
  }),
  courses: asyncHandler(async (req, res) => {
    const data = await courseService.adminList(req.query);
    send(res, data);
  }),
};

const platformController = {
  stats: asyncHandler(async (req, res) => {
    const data = await platformService.stats();
    send(res, data);
  }),
};

const playlistController = require("./playlists");

module.exports = {
  authController,
  userController,
  courseController,
  sectionController,
  lessonController,
  enrollmentController,
  orderController,
  reviewController,
  wishlistController,
  noteController,
  categoryController,
  couponController,
  notificationController,
  uploadController,
  instructorController,
  adminController,
  platformController,
  playlistController,
};
