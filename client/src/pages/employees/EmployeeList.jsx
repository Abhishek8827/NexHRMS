import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  UserX,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  fetchEmployees,
  deactivateEmployee,
  fetchDepartments,
} from "../../features/employees/employeeSlice";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import {
  getInitials,
  formatDate,
  getRoleBadgeColor,
} from "../../utils/helpers";

const STATUS_OPTIONS = ["all", "active", "inactive", "terminated"];
const ROLE_OPTIONS = ["all", "admin", "hr", "manager", "employee"];

const EmployeeList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const { list, pagination, departments, loading } = useSelector(
    (s) => s.employees,
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "active",
    role: "all",
    department: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    employee: null,
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // Fetch employees
  useEffect(() => {
    const params = {
      page,
      limit: 10,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.status !== "all" && { status: filters.status }),
      ...(filters.role !== "all" && { role: filters.role }),
      ...(filters.department !== "all" && { department: filters.department }),
    };
    dispatch(fetchEmployees(params));
  }, [dispatch, page, debouncedSearch, filters]);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleDeactivate = async () => {
    const res = await dispatch(deactivateEmployee(confirmModal.employee._id));
    if (!res.error) {
      toast.success(`${confirmModal.employee.firstName} has been deactivated`);
      setConfirmModal({ open: false, employee: null });
    } else {
      toast.error(res.payload || "Failed to deactivate");
    }
  };

  const clearFilters = () => {
    setFilters({ status: "active", role: "all", department: "all" });
    setSearch("");
  };

  const activeFilterCount = [
    filters.status !== "active",
    filters.role !== "all",
    filters.department !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employees
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination?.totalCount ?? 0} total employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => navigate("/employees/new")}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 w-full placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilters((f) => ({ ...f, status: s }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          filters.status === s
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setFilters((f) => ({ ...f, role: r }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          filters.role === r
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, department: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading employees...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    {[
                      "Employee",
                      "ID",
                      "Department",
                      "Designation",
                      "Role",
                      "Joining Date",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {list.map((emp, i) => (
                      <motion.tr
                        key={emp._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {getInitials(emp.firstName, emp.lastName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {emp.employeeId || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {emp.department?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {emp.designation || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(emp.role)}`}
                          >
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(emp.joiningDate)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            color={
                              emp.status === "active"
                                ? "green"
                                : emp.status === "terminated"
                                  ? "red"
                                  : "yellow"
                            }
                          >
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* FIX: Only Admin and HR can edit employees */}
                            {isAdminOrHR && (
                              <button
                                onClick={() =>
                                  navigate(`/employees/${emp._id}/edit`)
                                }
                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {emp.status === "active" && (
                              <button
                                onClick={() =>
                                  setConfirmModal({ open: true, employee: emp })
                                }
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Deactivate"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {list.length === 0 && !loading && (
              <div className="text-center py-16">
                <Users className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  No employees found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}"`
                    : "Get started by adding your first employee"}
                </p>
                {!debouncedSearch && (
                  <Button onClick={() => navigate("/employees/new")}>
                    <Plus className="w-4 h-4" /> Add First Employee
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(page - 1) * 10 + 1}–
                  {Math.min(page * 10, pagination.totalCount)} of{" "}
                  {pagination.totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deactivate Confirm Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, employee: null })}
        title="Deactivate Employee"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 font-semibold">
              {getInitials(
                confirmModal.employee?.firstName,
                confirmModal.employee?.lastName,
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {confirmModal.employee?.firstName}{" "}
                {confirmModal.employee?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {confirmModal.employee?.designation ||
                  confirmModal.employee?.role}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will deactivate the employee account. They will not be able to
            login. All historical data will be preserved.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeactivate}
            >
              Yes, Deactivate
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmModal({ open: false, employee: null })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeList;
