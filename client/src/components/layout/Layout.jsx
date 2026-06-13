import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Get company name from Redux store if available
  const companyName = useSelector((s) => s.company?.profile?.name);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const handleNavbarMenuClick = () => {
    // On mobile → MobileNav handles its own state
    // On desktop → toggle sidebar collapse
    if (window.innerWidth >= 1024) {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* ── Desktop Sidebar (hidden on mobile) ───────────── */}
      <div
        className={clsx(
          "hidden lg:block fixed inset-y-0 left-0 z-40",
          "transition-all duration-300",
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div
        className={clsx(
          "flex flex-col min-h-screen transition-all duration-300",
          // Mobile: no left margin
          "ml-0",
          // Desktop: margin matches sidebar width
          collapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        {/* Top navbar */}
        <Navbar onMenuClick={handleNavbarMenuClick} />

        {/* Page content */}
        {/* Extra bottom padding on mobile for the tab bar */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Footer — desktop only */}
        <footer className="hidden lg:block py-3 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} {companyName || "NexHR"} •{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent font-medium">
              Developed by Abhishek Wani &amp; Group
            </span>
          </p>
        </footer>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ─────────── */}
      <MobileNav companyName={companyName} />
    </div>
  );
};

export default Layout;
