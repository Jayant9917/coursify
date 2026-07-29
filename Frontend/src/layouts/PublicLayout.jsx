import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Announcement } from "@/components/layout/Announcement";

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Announcement />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
