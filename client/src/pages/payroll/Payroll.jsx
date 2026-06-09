import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  DollarSign,
  FileText,
  CheckCircle,
  TrendingUp,
  Eye,
  Calculator,
} from "lucide-react";
import {
  fetchAllPayroll,
  fetchMyPayroll,
  processPayroll,
  markAsPaid,
} from "../../features/payroll/payrollSlice";
import { fetchEmployees } from "../../features/employees/employeeSlice";
import useAuth from "../../hooks/useAuth";
import Spinner from "../../components/common/Spinner";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { MONTHS } from "../../utils/constants";
import api from "../../services/api";

const statusColor = { draft: "gray", processed: "blue", paid: "green" };

const Payroll = () => {
  const dispatch = useDispatch();
  const { isAdminOrHR, user } = useAuth();
  const { allRecords, myPayslips, loading, processing } = useSelector(
    (s) => s.payroll,
  );
  const { list: employees } = useSelector((s) => s.employees);

  const now = new Date();
  const [activeTab, setActiveTab] = useState(
    isAdminOrHR ? "records" : "my-payslips",
  );
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [processModal, setProcessModal] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, record: null });
  const [ctcSalary, setCtcSalary] = useState("");
  const [ctcResult, setCtcResult] = useState(null);
  const [processForm, setProcessForm] = useState({
    employeeId: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    bonus: 0,
    overtimePay: 0,
  });

  useEffect(() => {
    if (isAdminOrHR) {
      dispatch(fetchAllPayroll({ month: selectedMonth, year: selectedYear }));
      dispatch(fetchEmployees({ status: "active", limit: 100 }));
    } else {
      dispatch(fetchMyPayroll());
    }
  }, [dispatch, isAdminOrHR, selectedMonth, selectedYear]);

  const handleProcess = async () => {
    if (!processForm.employeeId) {
      toast.error("Select an employee");
      return;
    }
    const res = await dispatch(processPayroll(processForm));
    if (!res.error) {
      toast.success("Payroll processed!");
      setProcessModal(false);
    } else toast.error(res.payload || "Failed");
  };

  const handleMarkPaid = async (id) => {
    const res = await dispatch(markAsPaid(id));
    if (!res.error) toast.success("Marked as paid!");
    else toast.error(res.payload || "Failed");
  };

  const calculateCTC = () => {
    const annual = Number(ctcSalary);
    if (!annual || annual <= 0) return;
    const monthly = annual / 12;
    const basic = monthly * 0.4;
    const hra = basic * 0.4;
    const gross = basic + hra + 1600 + 1250 + monthly * 0.1;
    const epf = basic * 0.12;
    const esic = gross <= 21000 ? gross * 0.0075 : 0;
    const pt = gross > 15000 ? 200 : 0;
    setCtcResult({
      basic: Math.round(basic),
      hra: Math.round(hra),
      conveyance: 1600,
      medical: 1250,
      special: Math.round(monthly * 0.1),
      gross: Math.round(gross),
      epf: Math.round(epf),
      esic: Math.round(esic),
      pt,
      net: Math.round(gross - epf - esic - pt),
    });
  };

  const totalNet = allRecords.reduce((s, r) => s + (r.netSalary || 0), 0);
  const processedCount = allRecords.filter((r) => r.status !== "draft").length;
  const paidCount = allRecords.filter((r) => r.status === "paid").length;

  const tabs = [
    ...(isAdminOrHR ? [{ id: "records", label: "All Records" }] : []),
    { id: "my-payslips", label: "My Payslips" },
    { id: "ctc", label: "CTC Calc" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Payroll Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage salaries, payslips and compensation
          </p>
        </div>
        {isAdminOrHR && (
          <Button onClick={() => setProcessModal(true)} size="sm">
            <DollarSign className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Process Payroll</span>
            <span className="sm:hidden">Process</span>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Total Net Payout",
              value: formatCurrency(totalNet),
              icon: DollarSign,
              color: "text-green-600 bg-green-50 dark:bg-green-900/20",
            },
            {
              label: "Processed",
              value: `${processedCount} employees`,
              icon: CheckCircle,
              color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Paid",
              value: `${paidCount} employees`,
              icon: TrendingUp,
              color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${s.color} rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4`}
            >
              <s.icon className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{s.value}</p>
                <p className="text-xs sm:text-sm font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* All Records */}
        {activeTab === "records" && isAdminOrHR && (
          <div>
            <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="text-xs sm:text-sm text-gray-500">
                {allRecords.length} records
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {allRecords.length === 0 ? (
                    <div className="text-center py-10">
                      <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No records for this period
                      </p>
                    </div>
                  ) : (
                    allRecords.map((r) => (
                      <div key={r._id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {r.employee?.firstName} {r.employee?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.employee?.employeeId}
                            </p>
                          </div>
                          <Badge color={statusColor[r.status]}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Basic</span>
                            <p className="font-mono text-gray-700 dark:text-gray-300">
                              {formatCurrency(r.basicSalary)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Gross</span>
                            <p className="font-mono text-gray-700 dark:text-gray-300">
                              {formatCurrency(r.grossSalary)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Net</span>
                            <p className="font-mono font-bold text-green-600">
                              {formatCurrency(r.netSalary)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setViewModal({ open: true, record: r })
                            }
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {r.status === "processed" && (
                            <button
                              onClick={() => handleMarkPaid(r._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        {[
                          "Employee",
                          "Basic",
                          "Gross",
                          "Deductions",
                          "Net Salary",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {allRecords.map((r, i) => (
                        <motion.tr
                          key={r._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 lg:px-6 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {r.employee?.firstName} {r.employee?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.employee?.employeeId}
                            </p>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                            {formatCurrency(r.basicSalary)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                            {formatCurrency(r.grossSalary)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm font-mono text-red-600">
                            -{formatCurrency(r.totalDeductions)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm font-mono font-bold text-green-600">
                            {formatCurrency(r.netSalary)}
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <Badge color={statusColor[r.status]}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setViewModal({ open: true, record: r })
                                }
                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {r.status === "processed" && (
                                <button
                                  onClick={() => handleMarkPaid(r._id)}
                                  className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {allRecords.length === 0 && (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No payroll records for this period
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* My Payslips */}
        {activeTab === "my-payslips" && (
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : myPayslips.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payslips yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {myPayslips.map((slip, i) => (
                  <motion.div
                    key={slip._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {MONTHS[slip.month - 1]} {slip.year}
                        </p>
                        <Badge color={statusColor[slip.status]}>
                          {slip.status}
                        </Badge>
                      </div>
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {formatCurrency(slip.grossSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deductions</span>
                        <span className="font-mono text-red-600">
                          -{formatCurrency(slip.totalDeductions)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
                        <span className="text-gray-900 dark:text-white">
                          Net
                        </span>
                        <span className="font-mono text-green-600">
                          {formatCurrency(slip.netSalary)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModal({ open: true, record: slip })}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View Payslip
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTC Calculator */}
        {activeTab === "ctc" && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="max-w-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Calculator className="w-5 h-5 text-primary-600" /> CTC
                Calculator
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual CTC (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 600000"
                    value={ctcSalary}
                    onChange={(e) => setCtcSalary(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button onClick={calculateCTC} className="w-full">
                  Calculate Breakdown
                </Button>
              </div>
            </div>
            {ctcResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-w-md"
              >
                <div className="bg-primary-600 px-4 py-3">
                  <p className="text-white font-semibold text-sm">
                    Monthly Breakdown — CTC ₹
                    {Number(ctcSalary).toLocaleString("en-IN")} p.a.
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="px-4 py-2 bg-green-50 dark:bg-green-900/10">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                      Earnings
                    </p>
                  </div>
                  {[
                    ["Basic Salary", ctcResult.basic],
                    ["HRA", ctcResult.hra],
                    ["Conveyance", ctcResult.conveyance],
                    ["Medical", ctcResult.medical],
                    ["Special Allowance", ctcResult.special],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="flex justify-between px-4 py-2 text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {l}
                      </span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {formatCurrency(v)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2.5 bg-green-50 dark:bg-green-900/10 text-sm font-bold">
                    <span className="text-green-700 dark:text-green-400">
                      Gross Salary
                    </span>
                    <span className="text-green-700 dark:text-green-400 font-mono">
                      {formatCurrency(ctcResult.gross)}
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                      Deductions
                    </p>
                  </div>
                  {[
                    ["EPF (12%)", ctcResult.epf],
                    ["ESIC (0.75%)", ctcResult.esic],
                    ["Professional Tax", ctcResult.pt],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="flex justify-between px-4 py-2 text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {l}
                      </span>
                      <span className="font-mono text-red-600">
                        -{formatCurrency(v)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-sm font-bold">
                    <span className="text-primary-700 dark:text-primary-300">
                      Net Monthly Salary
                    </span>
                    <span className="text-primary-700 dark:text-primary-300 font-mono">
                      {formatCurrency(ctcResult.net)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Process Payroll Modal */}
      <Modal
        isOpen={processModal}
        onClose={() => setProcessModal(false)}
        title="Process Payroll"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={processForm.employeeId}
              onChange={(e) =>
                setProcessForm((f) => ({ ...f, employeeId: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                value={processForm.month}
                onChange={(e) =>
                  setProcessForm((f) => ({
                    ...f,
                    month: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={processForm.year}
                onChange={(e) =>
                  setProcessForm((f) => ({
                    ...f,
                    year: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bonus (₹)
              </label>
              <input
                type="number"
                value={processForm.bonus}
                onChange={(e) =>
                  setProcessForm((f) => ({
                    ...f,
                    bonus: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Overtime (₹)
              </label>
              <input
                type="number"
                value={processForm.overtimePay}
                onChange={(e) =>
                  setProcessForm((f) => ({
                    ...f,
                    overtimePay: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleProcess}
              loading={processing}
            >
              Process
            </Button>
            <Button variant="secondary" onClick={() => setProcessModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payslip View Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, record: null })}
        title="Payslip"
        size="lg"
      >
        {viewModal.record && (
          <div className="space-y-4">
            <div className="bg-primary-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-bold text-lg">NexHR</p>
                  <p className="text-primary-200 text-sm">Salary Payslip</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-200 text-xs">Pay Period</p>
                  <p className="font-bold">
                    {MONTHS[viewModal.record.month - 1]} {viewModal.record.year}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [
                  "Employee",
                  `${viewModal.record.employee?.firstName || ""} ${viewModal.record.employee?.lastName || ""}`,
                ],
                ["Employee ID", viewModal.record.employee?.employeeId || "—"],
                ["Working Days", viewModal.record.workingDays || "—"],
                ["Present Days", viewModal.record.presentDays || "—"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                >
                  <p className="text-xs text-gray-400 uppercase">{l}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div>
                <div className="bg-green-50 dark:bg-green-900/10 px-4 py-2">
                  <p className="text-xs font-semibold text-green-700 uppercase">
                    Earnings
                  </p>
                </div>
                {[
                  ["Basic Salary", viewModal.record.basicSalary],
                  ["HRA", viewModal.record.hra],
                  ["Conveyance", viewModal.record.conveyanceAllowance],
                  ["Medical", viewModal.record.medicalAllowance],
                  ["Special Allow.", viewModal.record.specialAllowance],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="flex justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {l}
                    </span>
                    <span className="font-mono">{formatCurrency(v || 0)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 bg-green-50 dark:bg-green-900/10 text-sm font-bold">
                  <span className="text-green-700">Gross</span>
                  <span className="text-green-700 font-mono">
                    {formatCurrency(viewModal.record.grossSalary)}
                  </span>
                </div>
              </div>
              <div>
                <div className="bg-red-50 dark:bg-red-900/10 px-4 py-2">
                  <p className="text-xs font-semibold text-red-700 uppercase">
                    Deductions
                  </p>
                </div>
                {[
                  ["EPF (12%)", viewModal.record.epfEmployee],
                  ["ESIC (0.75%)", viewModal.record.esicEmployee],
                  ["Professional Tax", viewModal.record.professionalTax],
                  ["LOP Deduction", viewModal.record.lopDeduction],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="flex justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {l}
                    </span>
                    <span className="font-mono text-red-600">
                      -{formatCurrency(v || 0)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-sm font-bold">
                  <span className="text-red-700">Total Deductions</span>
                  <span className="text-red-700 font-mono">
                    -{formatCurrency(viewModal.record.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <div>
                <p className="text-sm text-primary-600 font-medium">
                  Net Salary (Take Home)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gross − Employee Deductions
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary-700 font-mono">
                {formatCurrency(viewModal.record.netSalary)}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              🖨 Print / Save as PDF
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payroll;
