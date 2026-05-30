import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  CheckSquare,
  Star,
  Receipt,
  MessageSquare,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Settings,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/helpers";

const navItems = [
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
    label: "Work Schedules",
    icon: Settings,
    path: "/settings/schedules",
    roles: ["admin", "hr"],
  },
];

// Role-based accent colors — each role gets its own identity
const roleConfig = {
  admin: {
    gradient: "from-violet-500 to-indigo-600",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    label: "Super Admin",
  },
  hr: {
    gradient: "from-blue-500 to-cyan-500",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    label: "HR Manager",
  },
  manager: {
    gradient: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    label: "Team Manager",
  },
  employee: {
    gradient: "from-orange-500 to-amber-500",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    label: "Employee",
  },
};

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  // Get role config — fallback to employee if unknown
  const rc = roleConfig[user?.role] || roleConfig.employee;

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-40",
        "bg-gray-900 border-r border-gray-800",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        className={clsx(
          "flex items-center h-16 px-4 border-b border-gray-800",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Logo icon — uses role gradient */}
          <div
            className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br ${rc.gradient}`,
            )}
          >
            <Building2 className="w-4 h-4 text-white" />
          </div>

          {!collapsed && (
            <div className="leading-none">
              <span className="font-bold text-white text-base tracking-tight">
                NexHR
              </span>
              <p className="text-gray-500 text-[10px] mt-0.5">HR Management</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className={clsx(
            "p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors",
            collapsed && "mx-auto mt-1",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Role Badge (only when expanded) ──────────────── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2">
          <span
            className={clsx(
              "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border",
              rc.badge,
            )}
          >
            {rc.label}
          </span>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? `bg-gradient-to-r ${rc.gradient} text-white shadow-lg shadow-black/20`
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile ─────────────────────────────────── */}
      <div className="p-3 border-t border-gray-800">
        <div
          className={clsx(
            "flex items-center gap-3",
            collapsed && "flex-col gap-2",
          )}
        >
          {/* Avatar — uses role gradient */}
          <div
            className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
              "text-xs font-bold text-white",
              `bg-gradient-to-br ${rc.gradient}`,
            )}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Logout button visible in collapsed state too */}
          {collapsed && (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
