import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
import { Announcement } from "@/components/layout/Announcement";
import { BookOpen, FileText, LayoutDashboard, SlidersHorizontal, Sparkles, UserCircle2 } from "lucide-react";

const items = [
  { to: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/instructor/courses", label: "Courses", icon: BookOpen },
  { to: "/instructor/courses/new", label: "New Course", icon: Sparkles },
  { to: "/instructor/stats", label: "Stats", icon: SlidersHorizontal },
  { to: "/instructor/notes", label: "Study Vault", icon: FileText },
  { to: "/instructor/profile", label: "Profile", icon: UserCircle2 },
];

export function InstructorLayout() {
  return (
    <div className="min-h-screen">
      <Announcement />
      <Navbar />
      <div className="page-shell py-6 lg:flex lg:gap-6">
        <Sidebar title="Instructor" items={items} />
        <main className="mt-6 min-w-0 flex-1 lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
