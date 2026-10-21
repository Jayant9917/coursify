import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
import { BookOpen, LayoutDashboard, SlidersHorizontal, Sparkles, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const getItems = (basePath) => [
  { to: `${basePath}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { to: `${basePath}/courses`, label: "Courses", icon: BookOpen },
  { to: `${basePath}/courses/new`, label: "New Course", icon: Sparkles },
  { to: `${basePath}/stats`, label: "Stats", icon: SlidersHorizontal },
  { to: `${basePath}/profile`, label: "Profile", icon: UserCircle2 },
];

export function InstructorLayout() {
  const { user } = useAuth();
  const isCreator = user?.role === "admin";
  const basePath = isCreator ? "/creator" : "/instructor";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="page-shell py-6 lg:flex lg:gap-6">
        <Sidebar title={isCreator ? "Creator" : "Instructor"} items={getItems(basePath)} />
        <main className="mt-6 min-w-0 flex-1 lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
