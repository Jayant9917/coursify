import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
import { BookOpen, LayoutDashboard, Heart, ShoppingBag, UserCircle2 } from "lucide-react";

const items = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/courses", label: "My Courses", icon: BookOpen },
  { to: "/student/orders", label: "Orders", icon: ShoppingBag },
  { to: "/student/wishlist", label: "Wishlist", icon: Heart },
  { to: "/student/profile", label: "Profile", icon: UserCircle2 },
];

export function StudentLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="page-shell py-6 lg:flex lg:gap-6">
        <Sidebar title="Student" items={items} />
        <main className="mt-6 min-w-0 flex-1 lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
