import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  CheckSquare,
  Users,
  DollarSign,
  Briefcase,
  Star,
  Receipt,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Building2,
  Menu,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/helpers";

// Bottom tab items (most used — always visible)
const bottomTabs = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Attendance", icon: Clock, path: "/attendance" },
  { label: "Leaves", icon: Calendar, path: "/leaves" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
];

// All nav items for the full drawer
const allNavItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Employees",
    icon: Users,
    path: "/employees",
    roles: ["admin", "hr", "manager"],
  },
  {
    label: "Attendance",
    icon: Clock,
    path: "/attendance",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Leaves",
    icon: Calendar,
    path: "/leaves",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Payroll",
    icon: DollarSign,
    path: "/payroll",
    roles: ["admin", "hr"],
  },
  {
    label: "Recruitment",
    icon: Briefcase,
    path: "/recruitment",
    roles: ["admin", "hr"],
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    path: "/tasks",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Performance",
    icon: Star,
    path: "/performance",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Reimbursements",
    icon: Receipt,
    path: "/reimbursements",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Complaints",
    icon: MessageSquare,
    path: "/complaints",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    label: "Reports",
    icon: BarChart2,
    path: "/reports",
    roles: ["admin", "hr"],
  },
  {
    label: "Company",
    icon: Building2,
    path: "/company",
    roles: ["admin", "hr"],
  },
  {
    label: "Work Schedules",
    icon: Settings,
    path: "/settings/schedules",
    roles: ["admin", "hr"],
  },
];

const roleColors = {
  admin: "from-violet-500 to-indigo-600",
  hr: "from-blue-500 to-cyan-600",
  manager: "from-emerald-500 to-teal-600",
  employee: "from-orange-500 to-amber-600",
};

const roleLabel = {
  admin: "Super Admin",
  hr: "HR Manager",
  manager: "Team Manager",
  employee: "Employee",
};

const MobileNav = ({ companyName }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const gradient = roleColors[user?.role] || roleColors.employee;

  const handleLogout = async () => {
    setDrawerOpen(false);
    await dispatch(logoutUser());
    navigate("/login");
  };

  const filteredNav = allNavItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  // Split into two columns for the drawer grid
  const half = Math.ceil(filteredNav.length / 2);
  const col1 = filteredNav.slice(0, half);
  const col2 = filteredNav.slice(half);

  return (
    <>
      {/* ── Full-screen Drawer ──────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel — slides up from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden"
              style={{ maxHeight: "88vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-700 rounded-full" />
              </div>

              {/* Header — company + user */}
              <div
                className={`mx-4 mt-2 mb-4 p-4 rounded-2xl bg-gradient-to-r ${gradient}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">
                        {companyName || "NexHR"}
                      </p>
                      <p className="text-white/70 text-xs">
                        {roleLabel[user?.role]}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
                  <div
                    className={`w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                  >
                    {getInitials(user?.firstName, user?.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-white/60 text-xs truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav grid */}
              <div
                className="overflow-y-auto px-4 pb-8"
                style={{ maxHeight: "calc(88vh - 200px)" }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Navigation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {filteredNav.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                          isActive
                            ? `bg-gradient-to-r ${gradient} text-white`
                            : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700",
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {item.label}
                      </span>
                    </NavLink>
                  ))}
                </div>

                {/* Profile + Logout */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDrawerOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                  >
                    <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    </div>
                    <span className="text-xs font-medium">My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bottom Tab Bar ──────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Bottom tabs */}
          {bottomTabs
            .filter((t) =>
              allNavItems
                .find((n) => n.path === t.path)
                ?.roles.includes(user?.role),
            )
            .map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-1",
                    isActive
                      ? "text-indigo-400"
                      : "text-gray-500 hover:text-gray-300",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={clsx(
                        "p-1.5 rounded-lg transition-all",
                        isActive ? "bg-indigo-500/20" : "",
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}

          {/* More / hamburger button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-300 flex-1"
          >
            <div className="p-1.5 rounded-lg">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
