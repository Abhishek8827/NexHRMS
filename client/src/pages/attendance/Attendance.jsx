import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchMyAttendance,
  fetchTodayAttendance,
  punchIn,
  punchOut,
} from "../../features/attendance/attendanceSlice";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import {
  formatDate,
  formatTime,
  formatMinutesToHours,
} from "../../utils/helpers";
import { MONTHS } from "../../utils/constants";
import { toast } from "react-hot-toast";

const statusColor = {
  present: "green",
  late: "yellow",
  absent: "red",
  "half-day": "yellow",
  "on-leave": "blue",
  holiday: "purple",
};

const Attendance = () => {
  const dispatch = useDispatch();

  // FIX: use punchLoading for buttons, loading for table
  const { records, summary, today, loading, punchLoading } = useSelector(
    (s) => s.attendance,
  );

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    dispatch(fetchTodayAttendance());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMyAttendance({ month, year }));
  }, [dispatch, month, year]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handlePunchIn = async () => {
    const res = await dispatch(punchIn({ workMode: "office" }));
    if (!res.error) toast.success("Punched in!");
    else toast.error(res.payload || "Failed to punch in");
  };

  const handlePunchOut = async () => {
    const res = await dispatch(punchOut());
    if (!res.error) toast.success("Punched out!");
    else toast.error(res.payload || "Failed to punch out");
  };

  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Attendance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your attendance and working hours
        </p>
      </div>

      {/* Today Punch Card — only show for current month */}
      {isCurrentMonth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  today?.hasPunchedOut
                    ? "bg-green-100 dark:bg-green-900/30"
                    : today?.hasPunchedIn
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <Clock
                  className={`w-6 h-6 ${
                    today?.hasPunchedOut
                      ? "text-green-600"
                      : today?.hasPunchedIn
                        ? "text-blue-600"
                        : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Today
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {today?.attendance?.punchIn
                    ? `In: ${formatTime(today.attendance.punchIn)}`
                    : "Not punched in"}
                  {today?.attendance?.punchOut &&
                    ` • Out: ${formatTime(today.attendance.punchOut)}`}
                  {today?.attendance?.workingMinutes > 0 &&
                    ` • ${formatMinutesToHours(today.attendance.workingMinutes)}`}
                </p>
                {today?.attendance?.isLate && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Late by {today.attendance.lateByMinutes} min
                  </p>
                )}
              </div>
            </div>

            {/* FIX: Only ONE button shows — mutually exclusive conditions */}
            <div>
              {!today?.hasPunchedIn && (
                <button
                  onClick={handlePunchIn}
                  disabled={punchLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700
                    text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60
                    disabled:cursor-not-allowed"
                >
                  {punchLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Punch In
                </button>
              )}

              {today?.hasPunchedIn && !today?.hasPunchedOut && (
                <button
                  onClick={handlePunchOut}
                  disabled={punchLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700
                    text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60
                    disabled:cursor-not-allowed"
                >
                  {punchLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Punch Out
                </button>
              )}

              {today?.hasPunchedIn && today?.hasPunchedOut && (
                <span
                  className="flex items-center gap-2 text-sm text-green-600 font-medium
                  bg-green-50 dark:bg-green-900/20 px-4 py-2.5 rounded-lg"
                >
                  ✓ Completed for today
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Present",
            value: summary?.present || 0,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "Late",
            value: summary?.late || 0,
            color:
              "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
          },
          {
            label: "Absent",
            value: summary?.absent || 0,
            color:
              "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
          },
          {
            label: "Total Hours",
            value: formatMinutesToHours(summary?.totalWorkingMinutes),
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
        ].map((s, i) => (
          <motion.div
            key={`summary-${s.label}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${s.color} rounded-xl p-4`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Month Navigator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            {MONTHS[month - 1]} {year}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setMonth(now.getMonth() + 1);
                setYear(now.getFullYear());
              }}
              className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              This Month
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* loading here is for TABLE DATA — correct */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  {[
                    "Date",
                    "Day",
                    "Punch In",
                    "Punch Out",
                    "Hours",
                    "Overtime",
                    "Status",
                  ].map((h) => (
                    <th
                      key={`th-${h}`}
                      className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((r, i) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(r.punchIn)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(r.punchOut)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatMinutesToHours(r.workingMinutes)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {r.overtimeMinutes > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatMinutesToHours(r.overtimeMinutes)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge color={statusColor[r.status] || "gray"}>
                        {r.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No records for {MONTHS[month - 1]} {year}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
