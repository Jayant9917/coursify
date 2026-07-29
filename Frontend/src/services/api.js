import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const REFRESH_TOKEN_KEY = "coursify_refresh_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

const readableFieldName = (path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()))
    .join(" ");

const formatValidationError = (item) => {
  if (typeof item === "string") return item;

  const field = readableFieldName(Array.isArray(item?.path) ? item.path.join(".") : item?.path);
  if (item?.code === "too_small" && item?.type === "string") {
    return `${field || "This field"} must be at least ${item.minimum} characters.`;
  }
  if (item?.code === "too_big" && item?.type === "string") {
    return `${field || "This field"} must be no more than ${item.maximum} characters.`;
  }
  if (item?.code === "invalid_string" && item?.validation === "email") {
    return `${field || "Email"} must be a valid email address.`;
  }
  if (item?.code === "invalid_type" && item?.received === "undefined") {
    return `${field || "This field"} is required.`;
  }

  const message = item?.message || item?.msg || item?.reason;
  return message ? (field ? `${field}: ${message}` : message) : "Please check the submitted information.";
};

const statusFallbackMessage = (status) => {
  if (status === 400) return "The request could not be processed. Please check your information.";
  if (status === 401) return "Your session is invalid or has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This action conflicts with existing data.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status === 502) return "The external service could not complete the request. Please try again.";
  if (status === 503) return "This service is temporarily unavailable. Please try again later.";
  if (status === 504) return "The request took too long. Please try again.";
  return "Something went wrong on our side. Please try again.";
};

const isInternalErrorMessage = (message) =>
  /Mongo|Mongoose|MongoServerError|TypeError|ReferenceError|SyntaxError|ECONN|ETIMEDOUT|at\s+\w+\s*\(/i.test(
    String(message || "")
  );

function getErrorMessage(error) {
  const response = error?.response?.data || {};
  const status = error?.response?.status;
  const validationErrors = Array.isArray(response.errors) ? response.errors : [];
  const messages = validationErrors.map(formatValidationError).filter(Boolean);

  if (messages.length > 0 && response.message === "Validation failed") {
    return messages.join(". ");
  }

  if (response.message && !isInternalErrorMessage(response.message)) {
    return response.message;
  }

  if (messages.length > 0) return messages.join(". ");
  if (!error?.response) {
    if (error?.code === "ERR_CANCELED") return "The request was canceled.";
    return "Unable to reach the server. Please check your connection and try again.";
  }

  return statusFallbackMessage(status);
}

export function getApiErrorMessage(error) {
  return getErrorMessage(error);
}

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

let refreshPromise = null;

export function refreshSession() {
  if (refreshPromise) return refreshPromise;

  const promise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const { data } = await api.post(
      "/auth/refresh",
      { refreshToken },
      { skipAuthRefresh: true }
    );

    const payload = data?.data ?? {};
    if (payload.refreshToken) {
      setStoredRefreshToken(payload.refreshToken);
    }

    if (payload.user && payload.accessToken) {
      useAuthStore.getState().setAuth(payload.user, payload.accessToken);
    }

    return payload;
  })();

  refreshPromise = promise;
  promise.then(
    () => { if (refreshPromise === promise) refreshPromise = null; },
    () => { if (refreshPromise === promise) refreshPromise = null; }
  );
  return promise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const isAuthEndpoint = String(originalRequest.url || "").includes("/auth/");

    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshed = await refreshSession();
      const accessToken = refreshed?.accessToken || useAuthStore.getState().accessToken;

      if (accessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      setStoredRefreshToken(null);

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    }
  }
);

export const authApi = {
  async login(payload) {
    const response = await api.post("/auth/login", payload);
    return unwrap(response);
  },
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return unwrap(response);
  },
  async refresh() {
    const payload = await refreshSession();
    return payload;
  },
  async logout() {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken }, { skipAuthRefresh: true });
    }
    setStoredRefreshToken(null);
  },
  async forgotPassword(payload) {
    const response = await api.post("/auth/forgot-password", payload, { skipAuthRefresh: true });
    return unwrap(response);
  },
  async resetPassword(payload) {
    const response = await api.post("/auth/reset-password", payload, { skipAuthRefresh: true });
    return unwrap(response);
  },
};

export const userApi = {
  async me() {
    const response = await api.get("/users/me");
    return unwrap(response);
  },
  async updateMe(payload) {
    const response = await api.put("/users/me", payload);
    return unwrap(response);
  },
  async list(query = {}) {
    const response = await api.get("/users", { params: query });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return unwrap(response);
  },
  async updateStatus(id, status) {
    const response = await api.patch(`/users/${id}/status`, { status });
    return unwrap(response);
  },
};

export const courseApi = {
  async list(query = {}) {
    const response = await api.get("/courses", { params: query });
    return unwrap(response);
  },
  async getBySlug(slug) {
    const response = await api.get(`/courses/${slug}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/courses", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/courses/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/courses/${id}`);
    return unwrap(response);
  },
  async publish(id, isPublished) {
    const response = await api.patch(`/courses/${id}/publish`, { isPublished });
    return unwrap(response);
  },
  async adminList(query = {}) {
    const response = await api.get("/courses/admin/all", { params: query });
    return unwrap(response);
  },
  async instructorList(query = {}) {
    const response = await api.get("/courses/instructor/me", { params: query });
    return unwrap(response);
  },
  async createSection(courseId, payload) {
    const response = await api.post(`/courses/${courseId}/sections`, payload);
    return unwrap(response);
  },
  async updateSection(id, payload) {
    const response = await api.put(`/courses/sections/${id}`, payload);
    return unwrap(response);
  },
  async removeSection(id) {
    const response = await api.delete(`/courses/sections/${id}`);
    return unwrap(response);
  },
  async createLesson(sectionId, payload) {
    const response = await api.post(`/courses/sections/${sectionId}/lessons`, payload);
    return unwrap(response);
  },
  async updateLesson(id, payload) {
    const response = await api.put(`/courses/lessons/${id}`, payload);
    return unwrap(response);
  },
  async removeLesson(id) {
    const response = await api.delete(`/courses/lessons/${id}`);
    return unwrap(response);
  },
  async getReviews(id, query = {}) {
    const response = await api.get(`/courses/${id}/reviews`, { params: query });
    return unwrap(response);
  },
  async createReview(id, payload) {
    const response = await api.post(`/courses/${id}/reviews`, payload);
    return unwrap(response);
  },
  async getCourseProgress(id) {
    const response = await api.get(`/courses/${id}/progress`);
    return unwrap(response);
  },
  async getLessonAccessUrl(courseId, lessonId) {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/access`);
    return unwrap(response);
  },
};

export const categoryApi = {
  async list() {
    const response = await api.get("/categories");
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/categories", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/categories/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/categories/${id}`);
    return unwrap(response);
  },
};

export const enrollmentApi = {
  async enroll(courseId) {
    const response = await api.post("/enrollments", { courseId });
    return unwrap(response);
  },
  async getMyEnrollments() {
    const response = await api.get("/enrollments/me");
    return unwrap(response);
  },
  async myEnrollments() {
    return enrollmentApi.getMyEnrollments();
  },
  async updateProgress(payload) {
    const response = await api.patch("/enrollments/progress", payload);
    return unwrap(response);
  },
  async getProgress(courseId) {
    const response = await api.get(`/courses/${courseId}/progress`);
    return unwrap(response);
  },
};

export const orderApi = {
  async create(payload) {
    const response = await api.post("/orders", payload);
    return unwrap(response);
  },
  async getMyOrders() {
    const response = await api.get("/orders/me");
    return unwrap(response);
  },
  async getOrders(page = 1, limit = 10) {
    const response = await api.get("/orders", { params: { page, limit } });
    return unwrap(response);
  },
  async myOrders() {
    return orderApi.getMyOrders();
  },
  async list(query = {}) {
    const response = await api.get("/orders", { params: query });
    return unwrap(response);
  },
  async adminDetails(id) {
    const response = await api.get(`/orders/${id}`);
    return unwrap(response);
  },
  async adminRefund(id) {
    const response = await api.post(`/orders/${id}/refund`);
    return unwrap(response);
  },
  async webhookMonitoring(limit = 50) {
    const response = await api.get("/orders/webhook-monitoring", { params: { limit } });
    return unwrap(response);
  },
};

export const wishlistApi = {
  async list() {
    const response = await api.get("/wishlist");
    return unwrap(response);
  },
  async add(courseId) {
    const response = await api.post(`/wishlist/${courseId}`);
    return unwrap(response);
  },
  async remove(courseId) {
    const response = await api.delete(`/wishlist/${courseId}`);
    return unwrap(response);
  },
};

export const notesApi = {
  async list(query = {}) {
    const response = await api.get("/notes", { params: query });
    return unwrap(response);
  },
  async getBySlug(slug) {
    const response = await api.get(`/notes/${slug}`);
    return unwrap(response);
  },
  async purchase(id) {
    const response = await api.post(`/notes/${id}/purchase`);
    return unwrap(response);
  },
  async checkout(id) {
    const response = await api.post("/orders", { noteIds: [id] });
    return unwrap(response);
  },
  async download(id) {
    const response = await api.get(`/notes/${id}/download`);
    return unwrap(response);
  },
  async myPurchases() {
    const response = await api.get("/notes/purchases/me");
    return unwrap(response);
  },
  async listMine() {
    const response = await api.get("/notes/instructor/me");
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/notes", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/notes/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/notes/${id}`);
    return unwrap(response);
  },
};

export const couponApi = {
  async list() {
    const response = await api.get("/coupons");
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/coupons", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/coupons/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/coupons/${id}`);
    return unwrap(response);
  },
  async validate(code, subtotal = 0) {
    const response = await api.post("/coupons/validate", { code, subtotal });
    return unwrap(response);
  },
};

export const notificationApi = {
  async list() {
    const response = await api.get("/notifications");
    return unwrap(response);
  },
  async markRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return unwrap(response);
  },
  async markAllRead() {
    const response = await api.patch("/notifications/read-all");
    return unwrap(response);
  },
};

export const dashboardApi = {
  async instructorStats() {
    const response = await api.get("/instructor/stats");
    return unwrap(response);
  },
  async instructorCourses(query = {}) {
    const response = await api.get("/instructor/courses", { params: query });
    return unwrap(response);
  },
  async adminStats() {
    const response = await api.get("/admin/stats");
    return unwrap(response);
  },
  async adminUsers(query = {}) {
    const response = await api.get("/admin/users", { params: query });
    return unwrap(response);
  },
  async adminCourses(query = {}) {
    const response = await api.get("/admin/courses", { params: query });
    return unwrap(response);
  },
};

export const platformApi = {
  async stats() {
    const response = await api.get("/platform/stats");
    return unwrap(response);
  },
};

export const playlistApi = {
  async import(payload) {
    const response = await api.post("/playlists/import", payload);
    return unwrap(response);
  },
  async listMine(query = {}) {
    const response = await api.get("/playlists/me", { params: query });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/playlists/${id}`);
    return unwrap(response);
  },
  async watch(id) {
    const response = await api.get(`/playlists/${id}/watch`);
    return unwrap(response);
  },
  async updateProgress(id, payload) {
    const response = await api.patch(`/playlists/${id}/progress`, payload);
    return unwrap(response);
  },
  async refresh(id) {
    const response = await api.post(`/playlists/${id}/refresh`);
    return unwrap(response);
  },
};

export const uploadApi = {
  async uploadImage({ dataUrl, folder = "avatars", publicId }) {
    const response = await api.post("/uploads/image", { dataUrl, folder, publicId });
    return unwrap(response);
  },
  async uploadPublicImage({ dataUrl, publicId }) {
    const response = await api.post("/uploads/public-image", { dataUrl, publicId }, { skipAuthRefresh: true });
    return unwrap(response);
  },
  async requestLessonFileUpload({ fileName, contentType, folder }) {
    const response = await api.post("/uploads/lesson-file", { fileName, contentType, folder });
    return unwrap(response);
  },
  async uploadToPresignedUrl(uploadUrl, file, contentType) {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType || file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("S3 upload failed");
    }

    return true;
  },
};
