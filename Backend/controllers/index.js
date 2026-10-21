const asyncHandler = require("../utils/asyncHandler");
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
  auditService,
} = require("../services");
const uploadService = require("../services/upload");
const { recordAudit } = require("../utils/audit");

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
    const data = await userService.updateStatus(req.user, req.params.id, req.body.status, req);
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
    await recordAudit({ actor: req.user, action: "course.deleted", resourceType: "course", resourceId: req.params.id, request: req });
    send(res, data);
  }),
  restore: asyncHandler(async (req, res) => {
    const data = await courseService.restore(req.user, req.params.id);
    await recordAudit({ actor: req.user, action: "course.restored", resourceType: "course", resourceId: req.params.id, request: req });
    send(res, data);
  }),
  duplicate: asyncHandler(async (req, res) => {
    const data = await courseService.duplicate(req.user, req.params.id);
    await recordAudit({ actor: req.user, action: "course.duplicated", resourceType: "course", resourceId: data?._id, metadata: { sourceCourseId: req.params.id }, request: req });
    send(res, data, 201);
  }),
  publish: asyncHandler(async (req, res) => {
    const data = await courseService.publish(req.user, req.params.id, req.body.isPublished);
    await recordAudit({ actor: req.user, action: "course.publish_changed", resourceType: "course", resourceId: req.params.id, metadata: { isPublished: req.body.isPublished }, request: req });
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
  requestReview: asyncHandler(async (req, res) => {
    const data = await courseService.requestReview(req.user, req.params.id);
    send(res, data);
  }),
  review: asyncHandler(async (req, res) => {
    const data = await courseService.review(req.user, req.params.id, req.body.status, req.body.reason);
    await recordAudit({ actor: req.user, action: "course.reviewed", resourceType: "course", resourceId: req.params.id, metadata: { status: req.body.status }, request: req });
    send(res, data);
  }),
  versions: asyncHandler(async (req, res) => {
    send(res, await courseService.versions(req.user, req.params.id));
  }),
  instructorDetails: asyncHandler(async (req, res) => {
    const data = await courseService.instructorCourseDetails(req.user, req.params.id);
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
  bookmark: asyncHandler(async (req, res) => send(res, await enrollmentService.toggleBookmark(req.user, req.body))),
  bookmarks: asyncHandler(async (req, res) => send(res, await enrollmentService.listBookmarks(req.user, req.query.courseId))),
  saveNote: asyncHandler(async (req, res) => send(res, await enrollmentService.saveLessonNote(req.user, req.body))),
  notes: asyncHandler(async (req, res) => send(res, await enrollmentService.listLessonNotes(req.user, req.query.courseId))),
  quiz: asyncHandler(async (req, res) => send(res, await enrollmentService.submitQuiz(req.user, req.body))),
  assignment: asyncHandler(async (req, res) => send(res, await enrollmentService.submitAssignment(req.user, req.body), 201)),
  certificate: asyncHandler(async (req, res) => send(res, await enrollmentService.issueCertificate(req.user, req.params.courseId), 201)),
  certificates: asyncHandler(async (req, res) => send(res, await enrollmentService.myCertificates(req.user.id))),
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
  status: asyncHandler(async (req, res) => {
    const data = await orderService.getMyOrder(req.user.id, req.params.id);
    send(res, data);
  }),
  cancel: asyncHandler(async (req, res) => {
    const data = await orderService.cancel(req.user.id, req.params.id);
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
    const data = await orderService.recordAdminRefund(req.user, req.params.id, req);
    send(res, data);
  }),
  webhookMonitoring: asyncHandler(async (req, res) => {
    const data = await orderService.listWebhookDeliveries(req.query.limit);
    send(res, data);
  }),
  replayWebhook: asyncHandler(async (req, res) => {
    const data = await orderService.replayWebhookDelivery(req.user, req.params.id, req);
    send(res, data);
  }),
  reconciliation: asyncHandler(async (req, res) => {
    const data = await orderService.listReconciliationCases(req.query.limit);
    send(res, data);
  }),
  retryReconciliation: asyncHandler(async (req, res) => {
    const data = await orderService.retryReconciliation(req.user, req.params.id, req);
    send(res, data);
  }),
  resolveDispute: asyncHandler(async (req, res) => {
    const data = await orderService.resolveDispute(req.user, req.params.id, req);
    send(res, data);
  }),
  bookmark: asyncHandler(async (req, res) => send(res, await enrollmentService.toggleBookmark(req.user, req.body))),
  bookmarks: asyncHandler(async (req, res) => send(res, await enrollmentService.listBookmarks(req.user, req.query.courseId))),
  saveNote: asyncHandler(async (req, res) => send(res, await enrollmentService.saveLessonNote(req.user, req.body))),
  notes: asyncHandler(async (req, res) => send(res, await enrollmentService.listLessonNotes(req.user, req.query.courseId))),
  quiz: asyncHandler(async (req, res) => send(res, await enrollmentService.submitQuiz(req.user, req.body))),
  certificate: asyncHandler(async (req, res) => send(res, await enrollmentService.issueCertificate(req.user, req.params.courseId), 201)),
  certificates: asyncHandler(async (req, res) => send(res, await enrollmentService.myCertificates(req.user.id))),
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
    await recordAudit({ actor: req.user, action: "category.created", resourceType: "category", resourceId: data?._id, metadata: { name: data?.name }, request: req });
    send(res, data, 201);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await categoryService.update(req.params.id, req.body);
    await recordAudit({ actor: req.user, action: "category.updated", resourceType: "category", resourceId: req.params.id, metadata: { fields: Object.keys(req.body || {}) }, request: req });
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await categoryService.remove(req.params.id);
    await recordAudit({ actor: req.user, action: "category.deactivated", resourceType: "category", resourceId: req.params.id, request: req });
    send(res, data);
  }),
};

const couponController = {
  create: asyncHandler(async (req, res) => {
    const data = await couponService.create(req.body);
    await recordAudit({ actor: req.user, action: "coupon.created", resourceType: "coupon", resourceId: data?._id, metadata: { code: data?.code }, request: req });
    send(res, data, 201);
  }),
  list: asyncHandler(async (req, res) => {
    const data = await couponService.list();
    send(res, data);
  }),
  update: asyncHandler(async (req, res) => {
    const data = await couponService.update(req.params.id, req.body);
    await recordAudit({ actor: req.user, action: "coupon.updated", resourceType: "coupon", resourceId: req.params.id, metadata: { fields: Object.keys(req.body || {}) }, request: req });
    send(res, data);
  }),
  delete: asyncHandler(async (req, res) => {
    const data = await couponService.remove(req.params.id);
    await recordAudit({ actor: req.user, action: "coupon.deactivated", resourceType: "coupon", resourceId: req.params.id, request: req });
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
  config: asyncHandler(async (req, res) => send(res, uploadService.getConfig())),
  image: asyncHandler(async (req, res) => {
    const data = await uploadService.uploadImage(req.user, req.body, req);
    send(res, data, 201);
  }),
  publicImage: asyncHandler(async (req, res) => {
    const data = await uploadService.uploadPublicAvatar(req.body);
    send(res, data, 201);
  }),
  lessonFile: asyncHandler(async (req, res) => {
    const data = await uploadService.requestLessonFileUpload(req.user, req.body, req);
    send(res, data, 201);
  }),
  localFile: asyncHandler(async (req, res) => {
    const data = await uploadService.completeLocalFileUpload(req.user, req.file, req.body.folder, req);
    send(res, data, 201);
  }),
  s3MultipartInitiate: asyncHandler(async (req, res) => send(res, await uploadService.initiateS3Multipart(req.user, req.body, req), 201)),
  s3MultipartStatus: asyncHandler(async (req, res) => send(res, await uploadService.getS3MultipartStatus(req.user, req.params.uploadId))),
  s3MultipartPartUrl: asyncHandler(async (req, res) => send(res, await uploadService.getS3MultipartPartUrl(req.user, req.params.uploadId, req.body.partNumber))),
  s3MultipartComplete: asyncHandler(async (req, res) => send(res, await uploadService.completeS3Multipart(req.user, req.params.uploadId, req.body.parts, req))),
  s3MultipartAbort: asyncHandler(async (req, res) => send(res, await uploadService.abortS3Multipart(req.user, req.params.uploadId, req))),
  localVideoStart: asyncHandler(async (req, res) => send(res, await uploadService.startLocalVideoUpload(req.user, req.body, req), 201)),
  localVideoStatus: asyncHandler(async (req, res) => send(res, await uploadService.localVideoUploadStatus(req.user, req.params.uploadId))),
  localVideoChunk: asyncHandler(async (req, res) => send(res, await uploadService.writeLocalVideoChunk(req.user, req.params.uploadId, req.headers["upload-offset"], req.file?.buffer))),
  localVideoComplete: asyncHandler(async (req, res) => send(res, await uploadService.completeLocalVideoUpload(req.user, req.params.uploadId, req))),
  localVideoCancel: asyncHandler(async (req, res) => send(res, await uploadService.cancelLocalVideoUpload(req.user, req.params.uploadId, req))),
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

const auditController = {
  list: asyncHandler(async (req, res) => {
    const data = await auditService.list(req.query);
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
  auditController,
  playlistController,
};
