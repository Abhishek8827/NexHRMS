import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart2, Users, Clock, DollarSign, TrendingUp } from "lucide-react";
import api from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { formatCurrency } from "../../utils/helpers";
import { MONTHS } from "../../utils/constants";

const COLORS = [
  "#3b82f6", // blue  — present
  "#f59e0b", // amber — late
  "#ef4444", // red   — absent
  "#10b981", // green — on leave
];

// ── Chart Card wrapper ────────────────────────────────────
const ChartCard = ({ title, subtitle, children, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
  >
    <div className="mb-5">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {loading ? (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    ) : (
      children
    )}
  </motion.div>
);

// ── Main Reports Component ────────────────────────────────
const Reports = () => {
  const [stats, setStats] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, attendanceRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/reports/attendance", {
            params: { month: selectedMonth, year: selectedYear },
          }),
        ]);
        setStats(statsRes.data.data);
        setAttendanceReport(attendanceRes.data.data);
      } catch (err) {
        console.error(
          "Reports fetch error:",
          err?.response?.data || err.message,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  // ── Chart data ──────────────────────────────────────────
  const attendanceChartData = attendanceReport.slice(0, 10).map((r) => ({
    name: `${r.employee?.firstName?.charAt(0) || ""}. ${r.employee?.lastName || ""}`,
    Present: r.present || 0,
    Late: r.late || 0,
    Absent: r.absent || 0,
    "On Leave": r.onLeave || 0,
  }));

  const attendancePieData = [
    {
      name: "Present",
      value: attendanceReport.reduce((s, r) => s + (r.present || 0), 0),
    },
    {
      name: "Late",
      value: attendanceReport.reduce((s, r) => s + (r.late || 0), 0),
    },
    {
      name: "Absent",
      value: attendanceReport.reduce((s, r) => s + (r.absent || 0), 0),
    },
    {
      name: "On Leave",
      value: attendanceReport.reduce((s, r) => s + (r.onLeave || 0), 0),
    },
  ].filter((d) => d.value > 0);

  const tabs = ["overview", "attendance", "payroll"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Business insights and workforce analytics
          </p>
        </div>

        {/* Month/Year selectors */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {MONTHS.map((m, i) => (
              <option key={`month-${i}`} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={`year-${y}`} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Employees",
                value: stats?.activeEmployees ?? "—",
                icon: Users,
                color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
              },
              {
                label: "Present Today",
                value: stats?.presentToday ?? "—",
                icon: Clock,
                color: "text-green-600 bg-green-50 dark:bg-green-900/20",
              },
              {
                label: "Monthly Payroll",
                value: formatCurrency(stats?.monthlyPayroll || 0),
                icon: DollarSign,
                color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
              },
              {
                label: "Pending Leaves",
                value: stats?.pendingLeaves ?? "—",
                icon: TrendingUp,
                color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
              },
            ].map((s, i) => (
              <motion.div
                key={`kpi-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`${s.color} rounded-xl p-5 flex items-center gap-4`}
              >
                <s.icon className="w-8 h-8 flex-shrink-0" />
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-sm font-medium">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Attendance Pie + Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Attendance Distribution"
              subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              loading={loading}
            >
              {attendancePieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {attendancePieData.map((entry, i) => (
                          // KEY FIX: composite key with name + index
                          <Cell
                            key={`pie-cell-${entry.name}-${i}`}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} days`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {attendancePieData.map((item, i) => (
                      <div
                        key={`legend-${item.name}-${i}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-gray-600 dark:text-gray-400 flex-1">
                          {item.name}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  No attendance data for this period
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Month Summary"
              subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              loading={loading}
            >
              <div className="space-y-3">
                {[
                  {
                    label: "Employees Tracked",
                    value: attendanceReport.length,
                    color: "bg-blue-500",
                  },
                  {
                    label: "Avg Present Days",
                    value:
                      attendanceReport.length > 0
                        ? Math.round(
                            attendanceReport.reduce(
                              (s, r) => s + (r.present || 0),
                              0,
                            ) / attendanceReport.length,
                          )
                        : 0,
                    color: "bg-green-500",
                  },
                  {
                    label: "Total Late Marks",
                    value: attendanceReport.reduce(
                      (s, r) => s + (r.late || 0),
                      0,
                    ),
                    color: "bg-yellow-500",
                  },
                  {
                    label: "Total Absent Days",
                    value: attendanceReport.reduce(
                      (s, r) => s + (r.absent || 0),
                      0,
                    ),
                    color: "bg-red-500",
                  },
                ].map((s, i) => (
                  <div key={`summary-${i}`} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {s.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── Attendance Tab ── */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Bar Chart */}
          <ChartCard
            title="Individual Attendance (Top 10)"
            subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            loading={loading}
          >
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={attendanceChartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Present" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar
                    dataKey="On Leave"
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                No attendance data for selected period
              </div>
            )}
          </ChartCard>

          {/* Detailed Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Detailed Attendance Report
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {[
                        "Employee",
                        "Present",
                        "Late",
                        "Absent",
                        "On Leave",
                        "Total Hours",
                      ].map((h) => (
                        <th
                          key={`th-att-${h}`}
                          className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {attendanceReport.map((r, i) => (
                      <motion.tr
                        // KEY FIX: use employee._id if available, else index
                        key={r.employee?._id || `att-row-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {r.employee?.employeeId}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">
                          {r.present || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-yellow-600 font-medium">
                          {r.late || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 font-medium">
                          {r.absent || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                          {r.onLeave || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {Math.floor((r.totalMinutes || 0) / 60)}h{" "}
                          {(r.totalMinutes || 0) % 60}m
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {attendanceReport.length === 0 && (
                  <div className="text-center py-12 text-sm text-gray-400">
                    No data for {MONTHS[selectedMonth - 1]} {selectedYear}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payroll Tab ── */}
      {activeTab === "payroll" && (
        <div className="space-y-6">
          <ChartCard
            title="Payroll Summary"
            subtitle="Monthly overview"
            loading={false}
          >
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">
                Process payroll records to see analytics here
              </p>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default Reports;
