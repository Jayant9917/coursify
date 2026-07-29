import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/common/Sidebar";
import { BadgeDollarSign, BookOpen, LayoutDashboard, ReceiptText, Shapes, Users } from "lucide-react";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: Shapes },
  { to: "/admin/coupons", label: "Coupons", icon: BadgeDollarSign },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="page-shell py-6 lg:flex lg:gap-6">
        <Sidebar title="Admin" items={items} />
        <main className="mt-6 min-w-0 flex-1 lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
