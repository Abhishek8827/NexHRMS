import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertCircle,
  CheckSquare,
  Receipt,
  Building2,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  fetchTodayAttendance,
  punchIn,
  punchOut,
} from "../../features/attendance/attendanceSlice";
import useAuth from "../../hooks/useAuth";
import { formatTime } from "../../utils/helpers";
import api from "../../services/api";
import Spinner from "../../components/common/Spinner";

const DashCard = ({
  title,
  value,
  sub,
  icon: Icon,
  color,
  onClick,
  delay = 0,
}) => {
  const colors = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-300",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: "bg-green-500",
      text: "text-green-700 dark:text-green-300",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-300",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      icon: "bg-purple-500",
      text: "text-purple-700 dark:text-purple-300",
    },
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      icon: "bg-indigo-500",
      text: "text-indigo-700 dark:text-indigo-300",
    },
  };
  const c = colors[color] || colors.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`${c.bg} rounded-xl p-4 sm:p-5 border border-white/50 dark:border-gray-700 ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98] transition-all" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3">
          <p
            className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate ${c.text}`}
          >
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value ?? "—"}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
              {sub}
            </p>
          )}
        </div>
        <div className={`${c.icon} p-2.5 sm:p-3 rounded-xl flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      {onClick && (
        <div
          className={`flex items-center gap-1 mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium ${c.text}`}
        >
          View details <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
};

const PunchCard = ({ today, loading, onPunchIn, onPunchOut }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
  >
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${today?.hasPunchedOut ? "bg-green-100 dark:bg-green-900/30" : today?.hasPunchedIn ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
        >
          <Clock
            className={`w-5 h-5 sm:w-6 sm:h-6 ${today?.hasPunchedOut ? "text-green-600" : today?.hasPunchedIn ? "text-blue-600" : "text-gray-400"}`}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
            Today's Attendance
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {today?.attendance?.punchIn
              ? `In: ${formatTime(today.attendance.punchIn)}`
              : "Not punched in yet"}
            {today?.attendance?.punchOut &&
              ` • Out: ${formatTime(today.attendance.punchOut)}`}
          </p>
          {today?.attendance?.isLate && (
            <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> Late by{" "}
              {today.attendance.lateByMinutes} min
            </p>
          )}
        </div>
      </div>
      <div className="ml-auto">
        {!today?.hasPunchedIn && (
          <button
            onClick={onPunchIn}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60 active:scale-95"
          >
            {loading ? <Spinner size="sm" /> : <Clock className="w-4 h-4" />}{" "}
            Punch In
          </button>
        )}
        {today?.hasPunchedIn && !today?.hasPunchedOut && (
          <button
            onClick={onPunchOut}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60 active:scale-95"
          >
            {loading ? <Spinner size="sm" /> : <Clock className="w-4 h-4" />}{" "}
            Punch Out
          </button>
        )}
        {today?.hasPunchedIn && today?.hasPunchedOut && (
          <span className="flex items-center gap-2 text-xs sm:text-sm text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg">
            <UserCheck className="w-4 h-4" /> Completed
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

const QuickBtn = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md active:scale-95 transition-all bg-white dark:bg-gray-900 group"
  >
    <div
      className={`p-2.5 sm:p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
      {label}
    </span>
  </button>
);

const AdminDashboard = ({ stats }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashCard
          title="Total Employees"
          value={stats?.activeEmployees}
          sub="Active staff"
          icon={Users}
          color="blue"
          delay={0.05}
          onClick={() => navigate("/employees")}
        />
        <DashCard
          title="Present Today"
          value={stats?.presentToday}
          sub="In office"
          icon={UserCheck}
          color="green"
          delay={0.1}
          onClick={() => navigate("/attendance")}
        />
        <DashCard
          title="On Leave"
          value={stats?.onLeaveToday}
          sub="Approved"
          icon={Calendar}
          color="yellow"
          delay={0.15}
          onClick={() => navigate("/leaves")}
        />
        <DashCard
          title="Pending"
          value={stats?.pendingLeaves}
          sub="Needs action"
          icon={AlertCircle}
          color="red"
          delay={0.2}
          onClick={() => navigate("/leaves")}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashCard
          title="Departments"
          value={stats?.departments ?? "—"}
          icon={Building2}
          color="purple"
          delay={0.25}
        />
        <DashCard
          title="Monthly Payroll"
          value={
            stats?.monthlyPayroll
              ? `₹${(stats.monthlyPayroll / 100000).toFixed(1)}L`
              : "₹0"
          }
          icon={DollarSign}
          color="green"
          delay={0.3}
          onClick={() => navigate("/payroll")}
        />
        <DashCard
          title="Open Positions"
          value={stats?.openJobs ?? "0"}
          icon={Activity}
          color="indigo"
          delay={0.35}
          onClick={() => navigate("/recruitment")}
        />
        <DashCard
          title="Tasks Pending"
          value={stats?.pendingTasks ?? "—"}
          icon={CheckSquare}
          color="yellow"
          delay={0.4}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          <QuickBtn
            icon={Users}
            label="Add Employee"
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            onClick={() => navigate("/employees/new")}
          />
          <QuickBtn
            icon={DollarSign}
            label="Payroll"
            color="text-green-600 bg-green-50 dark:bg-green-900/20"
            onClick={() => navigate("/payroll")}
          />
          <QuickBtn
            icon={Calendar}
            label="Leaves"
            color="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
            onClick={() => navigate("/leaves")}
          />
          <QuickBtn
            icon={TrendingUp}
            label="Reports"
            color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
            onClick={() => navigate("/reports")}
          />
          <QuickBtn
            icon={Building2}
            label="Recruitment"
            color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
            onClick={() => navigate("/recruitment")}
          />
          <QuickBtn
            icon={CheckSquare}
            label="Tasks"
            color="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
            onClick={() => navigate("/tasks")}
          />
        </div>
      </motion.div>
    </div>
  );
};

const HRDashboard = ({ stats }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashCard
          title="Total Employees"
          value={stats?.activeEmployees}
          icon={Users}
          color="blue"
          delay={0.05}
          onClick={() => navigate("/employees")}
        />
        <DashCard
          title="Present Today"
          value={stats?.presentToday}
          icon={UserCheck}
          color="green"
          delay={0.1}
        />
        <DashCard
          title="Pending Leaves"
          value={stats?.pendingLeaves}
          sub="Needs approval"
          icon={Calendar}
          color="yellow"
          delay={0.15}
          onClick={() => navigate("/leaves")}
        />
        <DashCard
          title="On Leave Today"
          value={stats?.onLeaveToday}
          icon={AlertCircle}
          color="red"
          delay={0.2}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">
          HR Quick Actions
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          <QuickBtn
            icon={Users}
            label="Add Employee"
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            onClick={() => navigate("/employees/new")}
          />
          <QuickBtn
            icon={Calendar}
            label="Approvals"
            color="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
            onClick={() => navigate("/leaves")}
          />
          <QuickBtn
            icon={Clock}
            label="Attendance"
            color="text-green-600 bg-green-50 dark:bg-green-900/20"
            onClick={() => navigate("/attendance")}
          />
          <QuickBtn
            icon={DollarSign}
            label="Payroll"
            color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
            onClick={() => navigate("/payroll")}
          />
          <QuickBtn
            icon={Receipt}
            label="Reimbursements"
            color="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
            onClick={() => navigate("/reimbursements")}
          />
        </div>
      </motion.div>
    </div>
  );
};

const ManagerDashboard = ({ today, punchLoading, onPunchIn, onPunchOut }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-6">
      <PunchCard
        today={today}
        loading={punchLoading}
        onPunchIn={onPunchIn}
        onPunchOut={onPunchOut}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <DashCard
          title="My Team"
          value="—"
          sub="Active members"
          icon={Users}
          color="blue"
          delay={0.1}
          onClick={() => navigate("/employees")}
        />
        <DashCard
          title="Leave Requests"
          value="—"
          sub="Pending"
          icon={Calendar}
          color="yellow"
          delay={0.15}
          onClick={() => navigate("/leaves")}
        />
        <DashCard
          title="Tasks Assigned"
          value="—"
          icon={CheckSquare}
          color="purple"
          delay={0.2}
          onClick={() => navigate("/tasks")}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <QuickBtn
            icon={Calendar}
            label="Leave Approvals"
            color="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
            onClick={() => navigate("/leaves")}
          />
          <QuickBtn
            icon={CheckSquare}
            label="Assign Task"
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            onClick={() => navigate("/tasks")}
          />
          <QuickBtn
            icon={Clock}
            label="Attendance"
            color="text-green-600 bg-green-50 dark:bg-green-900/20"
            onClick={() => navigate("/attendance")}
          />
        </div>
      </motion.div>
    </div>
  );
};

const EmployeeDashboard = ({ today, punchLoading, onPunchIn, onPunchOut }) => {
  const navigate = useNavigate();
  const [leaveBalance, setLeaveBalance] = useState(null);
  useEffect(() => {
    api
      .get("/leaves/balance")
      .then((res) => setLeaveBalance(res.data.data))
      .catch(() => {});
  }, []);
  return (
    <div className="space-y-4 sm:space-y-6">
      <PunchCard
        today={today}
        loading={punchLoading}
        onPunchIn={onPunchIn}
        onPunchOut={onPunchOut}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashCard
          title="Casual Leave"
          value={
            leaveBalance
              ? `${leaveBalance.casual?.remaining ?? 0}/${leaveBalance.casual?.entitled ?? 12}`
              : "—"
          }
          sub="Days remaining"
          icon={Calendar}
          color="blue"
          delay={0.1}
        />
        <DashCard
          title="Sick Leave"
          value={
            leaveBalance
              ? `${leaveBalance.sick?.remaining ?? 0}/${leaveBalance.sick?.entitled ?? 12}`
              : "—"
          }
          sub="Days remaining"
          icon={Activity}
          color="green"
          delay={0.15}
        />
        <DashCard
          title="My Tasks"
          value="—"
          sub="Assigned"
          icon={CheckSquare}
          color="yellow"
          delay={0.2}
          onClick={() => navigate("/tasks")}
        />
        <DashCard
          title="Reimbursements"
          value="—"
          sub="Pending"
          icon={Receipt}
          color="purple"
          delay={0.25}
          onClick={() => navigate("/reimbursements")}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <QuickBtn
            icon={Calendar}
            label="Apply Leave"
            color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            onClick={() => navigate("/leaves")}
          />
          <QuickBtn
            icon={DollarSign}
            label="My Payslips"
            color="text-green-600 bg-green-50 dark:bg-green-900/20"
            onClick={() => navigate("/payroll")}
          />
          <QuickBtn
            icon={Receipt}
            label="Reimbursement"
            color="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
            onClick={() => navigate("/reimbursements")}
          />
          <QuickBtn
            icon={AlertCircle}
            label="Raise Complaint"
            color="text-red-600 bg-red-50 dark:bg-red-900/20"
            onClick={() => navigate("/complaints")}
          />
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, isAdmin, isHR, isManager, isAdminOrHR } = useAuth();
  const { today, loading, punchLoading } = useSelector((s) => s.attendance);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchTodayAttendance());
    if (isAdminOrHR) {
      setStatsLoading(true);
      api
        .get("/reports/dashboard")
        .then((res) => setStats(res.data.data))
        .catch(() => {})
        .finally(() => setStatsLoading(false));
    }
    const a = setInterval(() => dispatch(fetchTodayAttendance()), 60000);
    const s = setInterval(() => {
      if (isAdminOrHR)
        api
          .get("/reports/dashboard")
          .then((r) => setStats(r.data.data))
          .catch(() => {});
    }, 120000);
    return () => {
      clearInterval(a);
      clearInterval(s);
    };
  }, [dispatch, isAdminOrHR]);

  const handlePunchIn = async () => {
    const res = await dispatch(punchIn({ workMode: "office" }));
    if (!res.error) toast.success("Punched in! 🙌");
    else toast.error(res.payload || "Failed");
  };

  const handlePunchOut = async () => {
    const res = await dispatch(punchOut());
    if (!res.error) toast.success("Punched out! 👋");
    else toast.error(res.payload || "Failed");
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  };

  const roleLabel = {
    admin: "⚡ Super Admin",
    hr: "👥 HR Manager",
    manager: "📋 Team Manager",
    employee: "💼 Employee",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
          {greeting()}, {user?.firstName}! 👋
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <span className="text-[10px] sm:text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-medium">
            {roleLabel[user?.role]}
          </span>
        </div>
      </motion.div>

      {(isAdmin || isHR) && (
        <PunchCard
          today={today}
          loading={punchLoading}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
        />
      )}
      {isAdmin && <AdminDashboard stats={stats} />}
      {isHR && <HRDashboard stats={stats} />}
      {isManager && (
        <ManagerDashboard
          today={today}
          punchLoading={punchLoading}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
        />
      )}
      {user?.role === "employee" && (
        <EmployeeDashboard
          today={today}
          punchLoading={punchLoading}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
        />
      )}
    </div>
  );
};

export default Dashboard;
