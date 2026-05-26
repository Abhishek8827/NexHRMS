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

const Sidebar = ({ collapsed, onToggle }) => {
  //   const { user, isAdmin, isHR } = useAuth();
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

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">NexHR</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white",
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

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div
          className={clsx(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 hover:text-red-400 text-gray-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
