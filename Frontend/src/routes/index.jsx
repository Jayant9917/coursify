import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { InstructorLayout } from "@/layouts/InstructorLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGuard } from "@/components/common/RoleGuard";

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));

const Home = lazyNamed(() => import("../pages/public/Home"), "Home");
const CourseList = lazyNamed(() => import("../pages/public/CourseList"), "CourseList");
const CourseDetail = lazyNamed(() => import("../pages/public/CourseDetail"), "CourseDetail");
const Checkout = lazyNamed(() => import("../pages/public/Checkout"), "Checkout");
const Login = lazyNamed(() => import("../pages/public/Login"), "Login");
const Register = lazyNamed(() => import("../pages/public/Register"), "Register");
const ForgotPassword = lazyNamed(() => import("../pages/public/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyNamed(() => import("../pages/public/ResetPassword"), "ResetPassword");
const PaymentResult = lazyNamed(() => import("../pages/public/PaymentResult"), "PaymentResult");

const StudentDashboard = lazyNamed(() => import("../pages/student/Dashboard"), "Dashboard");
const StudentCourses = lazyNamed(() => import("../pages/student/MyCourses"), "MyCourses");
const LessonPlayer = lazyNamed(() => import("../pages/student/LessonPlayer"), "LessonPlayer");
const OrderHistory = lazyNamed(() => import("../pages/student/OrderHistory"), "OrderHistory");
const Wishlist = lazyNamed(() => import("../pages/student/Wishlist"), "Wishlist");
const StudentProfile = lazyNamed(() => import("../pages/student/Profile"), "Profile");

const InstructorDashboard = lazyNamed(() => import("../pages/instructor/Dashboard"), "Dashboard");
const InstructorCourses = lazyNamed(() => import("../pages/instructor/MyCourses"), "MyCourses");
const CourseEditor = lazyNamed(() => import("../pages/instructor/CourseEditor"), "CourseEditor");
const CoursePreview = lazyNamed(() => import("../pages/instructor/CoursePreview"), "CoursePreview");
const InstructorStats = lazyNamed(() => import("../pages/instructor/Stats"), "Stats");
const InstructorProfile = lazyNamed(() => import("../pages/instructor/Profile"), "Profile");

const AdminDashboard = lazyNamed(() => import("../pages/admin/Dashboard"), "Dashboard");
const UserManagement = lazyNamed(() => import("../pages/admin/UserManagement"), "UserManagement");
const CourseManagement = lazyNamed(() => import("../pages/admin/CourseManagement"), "CourseManagement");
const CategoryManagement = lazyNamed(() => import("../pages/admin/CategoryManagement"), "CategoryManagement");
const CouponManagement = lazyNamed(() => import("../pages/admin/CouponManagement"), "CouponManagement");
const OrderManagement = lazyNamed(() => import("../pages/admin/OrderManagement"), "OrderManagement");

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">Loading page...</div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["student"]}>
                <StudentLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:id/learn" element={<LessonPlayer />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route
          path="/payment/result"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["student"]}>
                <StudentLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<PaymentResult />} />
        </Route>

        <Route
          path="/instructor"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["instructor"]}>
                <InstructorLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorCourses />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:id/edit" element={<CourseEditor />} />
          <Route path="courses/:id/preview" element={<CoursePreview />} />
          <Route path="stats" element={<InstructorStats />} />
          <Route path="profile" element={<InstructorProfile />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="coupons" element={<CouponManagement />} />
          <Route path="orders" element={<OrderManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
