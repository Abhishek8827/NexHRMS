import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  DollarSign,
  FileText,
  Calculator,
  TrendingUp,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  X,
  Eye,
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
import PayslipPDF from "./PayslipPDF";

const statusColor = {
  draft: "gray",
  processed: "blue",
  paid: "green",
  "on-hold": "yellow",
};

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
      toast.error("Please select an employee");
      return;
    }
    const res = await dispatch(processPayroll(processForm));
    if (!res.error) {
      toast.success("Payroll processed successfully!");
      setProcessModal(false);
      setProcessForm({
        employeeId: "",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        bonus: 0,
        overtimePay: 0,
      });
    } else {
      toast.error(res.payload || "Failed to process payroll");
    }
  };

  const handleMarkPaid = async (id) => {
    const res = await dispatch(markAsPaid(id));
    if (!res.error) toast.success("Marked as paid!");
    else toast.error(res.payload || "Failed");
  };

  const totalNetSalary = allRecords.reduce((s, r) => s + (r.netSalary || 0), 0);
  const processedCount = allRecords.filter((r) => r.status !== "draft").length;
  const paidCount = allRecords.filter((r) => r.status === "paid").length;

  const tabs = [
    ...(isAdminOrHR
      ? [
          { id: "records", label: "All Records" },
          { id: "process", label: "Process Payroll" },
        ]
      : []),
    { id: "my-payslips", label: isAdminOrHR ? "My Payslips" : "My Payslips" },
    { id: "ctc", label: "CTC Calculator" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payroll Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage salaries, payslips and compensation
          </p>
        </div>
        {isAdminOrHR && (
          <Button onClick={() => setProcessModal(true)}>
            <DollarSign className="w-4 h-4" /> Process Payroll
          </Button>
        )}
      </div>

      {/* Summary Cards — Admin/HR only */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Net Payout",
              value: formatCurrency(totalNetSalary),
              icon: DollarSign,
              color:
                "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
            },
            {
              label: "Processed",
              value: `${processedCount} employees`,
              icon: CheckCircle,
              color:
                "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
            },
            {
              label: "Paid",
              value: `${paidCount} employees`,
              icon: TrendingUp,
              color:
                "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${s.color} rounded-xl p-5 flex items-center gap-4`}
            >
              <s.icon className="w-8 h-8 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm font-medium">{s.label}</p>
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
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* All Records Tab */}
        {activeTab === "records" && isAdminOrHR && (
          <div>
            {/* Month Filter */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
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
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {allRecords.length} records
              </span>
            </div>

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
                          className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {allRecords.map((record, i) => (
                      <motion.tr
                        key={record._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.employee?.firstName}{" "}
                            {record.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.employee?.employeeId}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {formatCurrency(record.basicSalary)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {formatCurrency(record.grossSalary)}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-mono">
                          -{formatCurrency(record.totalDeductions)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400 font-mono">
                          {formatCurrency(record.netSalary)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge color={statusColor[record.status]}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setViewModal({ open: true, record })
                              }
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="View Payslip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {record.status === "processed" && (
                              <button
                                onClick={() => handleMarkPaid(record._id)}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium"
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
                {allRecords.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No payroll records for {MONTHS[selectedMonth - 1]}{" "}
                      {selectedYear}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Payslips Tab */}
        {activeTab === "my-payslips" && (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : myPayslips.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No payslips yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPayslips.map((slip, i) => (
                  <motion.div
                    key={slip._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gross Salary</span>
                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                          {formatCurrency(slip.grossSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deductions</span>
                        <span className="text-red-600 font-mono">
                          -{formatCurrency(slip.totalDeductions)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <span className="text-gray-900 dark:text-white">
                          Net Salary
                        </span>
                        <span className="text-green-600 font-mono">
                          {formatCurrency(slip.netSalary)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModal({ open: true, record: slip })}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View Payslip
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTC Calculator Tab */}
        {activeTab === "ctc" && (
          <CTCCalculator
            employees={employees}
            isAdminOrHR={isAdminOrHR}
            user={user}
          />
        )}
      </div>

      {/* Process Payroll Modal */}
      <Modal
        isOpen={processModal}
        onClose={() => setProcessModal(false)}
        title="Process Payroll"
        size="md"
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
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
                Overtime Pay (₹)
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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ️ Payroll is auto-calculated based on employee's basic salary,
              attendance records, and standard deductions (EPF 12%, ESIC 0.75%,
              Professional Tax).
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleProcess}
              loading={processing}
            >
              Process Payroll
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
        {viewModal.record && <PayslipPDF record={viewModal.record} />}
      </Modal>
    </div>
  );
};

// ── CTC Calculator Component ──────────────────────────────
const CTCCalculator = ({ employees, isAdminOrHR, user }) => {
  const dispatch = useDispatch();
  const { ctcData } = useSelector((s) => s.payroll);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [manualCTC, setManualCTC] = useState("");
  const [calcResult, setCalcResult] = useState(null);

  const calculateFromCTC = (ctc) => {
    const annual = Number(ctc);
    if (!annual || annual <= 0) return;
    const monthly = annual / 12;
    const basic = monthly * 0.4;
    const hra = basic * 0.4;
    const conveyance = 1600;
    const medical = 1250;
    const special = monthly * 0.1;
    const gross = basic + hra + conveyance + medical + special;
    const epfEmp = basic * 0.12;
    const epfEmpR = basic * 0.12;
    const esic = gross <= 21000 ? gross * 0.0075 : 0;
    const esicEmpR = gross <= 21000 ? gross * 0.0325 : 0;
    const pt = gross > 15000 ? 200 : gross > 10000 ? 150 : 0;
    const net = gross - epfEmp - esic - pt;

    setCalcResult({
      annualCTC: annual,
      monthly: {
        basic: Math.round(basic),
        hra: Math.round(hra),
        conveyance,
        medical,
        special: Math.round(special),
        grossSalary: Math.round(gross),
        epfEmployee: Math.round(epfEmp),
        epfEmployer: Math.round(epfEmpR),
        esicEmployee: Math.round(esic),
        esicEmployer: Math.round(esicEmpR),
        professionalTax: pt,
        netSalary: Math.round(net),
      },
    });
  };

  const handleFetchEmployee = () => {
    if (selectedEmp) dispatch(fetchCTCBreakdown(selectedEmp));
  };

  const display = ctcData || calcResult;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Manual Calculator */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary-600" />
            Manual CTC Calculator
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual CTC (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 600000"
              value={manualCTC}
              onChange={(e) => setManualCTC(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button
            onClick={() => calculateFromCTC(manualCTC)}
            className="w-full"
          >
            Calculate Breakdown
          </Button>
        </div>

        {/* Employee Lookup */}
        {isAdminOrHR && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              Employee CTC Lookup
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Employee
              </label>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
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
            <Button
              variant="secondary"
              onClick={handleFetchEmployee}
              className="w-full"
            >
              Fetch CTC Data
            </Button>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      {display && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        >
          <div className="bg-primary-600 px-6 py-4">
            <p className="text-white font-semibold">
              CTC Breakdown —{" "}
              {formatCurrency(display.annualCTC || display.annual?.ctc)} per
              annum
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Earnings */}
            <div className="px-6 py-3 bg-green-50 dark:bg-green-900/10">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">
                Earnings (Monthly)
              </p>
            </div>
            {[
              { label: "Basic Salary", value: display.monthly?.basic },
              { label: "HRA (40% of Basic)", value: display.monthly?.hra },
              {
                label: "Conveyance Allowance",
                value: display.monthly?.conveyance,
              },
              { label: "Medical Allowance", value: display.monthly?.medical },
              { label: "Special Allowance", value: display.monthly?.special },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between px-6 py-3 text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {row.label}
                </span>
                <span className="font-medium text-gray-900 dark:text-white font-mono">
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-6 py-3 bg-green-50 dark:bg-green-900/10 text-sm font-bold">
              <span className="text-green-700 dark:text-green-400">
                Gross Salary
              </span>
              <span className="text-green-700 dark:text-green-400 font-mono">
                {formatCurrency(display.monthly?.grossSalary)}
              </span>
            </div>

            {/* Deductions */}
            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/10">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Deductions (Monthly)
              </p>
            </div>
            {[
              {
                label: "EPF — Employee (12%)",
                value: display.monthly?.epfEmployee,
              },
              {
                label: "EPF — Employer (12%)",
                value: display.monthly?.epfEmployer,
              },
              {
                label: "ESIC — Employee (0.75%)",
                value: display.monthly?.esicEmployee,
              },
              {
                label: "ESIC — Employer (3.25%)",
                value: display.monthly?.esicEmployer,
              },
              {
                label: "Professional Tax",
                value: display.monthly?.professionalTax,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between px-6 py-3 text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {row.label}
                </span>
                <span className="font-medium text-red-600 dark:text-red-400 font-mono">
                  -{formatCurrency(row.value)}
                </span>
              </div>
            ))}

            {/* Net */}
            <div className="flex justify-between px-6 py-4 bg-primary-50 dark:bg-primary-900/20 text-base font-bold">
              <span className="text-primary-700 dark:text-primary-300">
                Net Monthly Salary
              </span>
              <span className="text-primary-700 dark:text-primary-300 font-mono">
                {formatCurrency(display.monthly?.netSalary)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Payroll;
