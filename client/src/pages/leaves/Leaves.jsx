import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Calendar, Plus, CheckCircle, XCircle, Info } from "lucide-react";
import {
  fetchMyLeaves,
  applyLeave,
  fetchPendingLeaves,
  updateLeaveStatus,
  fetchLeaveBalance,
} from "../../features/leaves/leaveSlice";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import { formatDate } from "../../utils/helpers";
import { LEAVE_TYPES } from "../../utils/constants";

const statusColor = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  cancelled: "gray",
};

const Leaves = () => {
  const dispatch = useDispatch();
  const { canApproveLeaves } = useAuth();
  const { myLeaves, pending, balance, loading } = useSelector((s) => s.leaves);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my-leaves");
  const [rejectModal, setRejectModal] = useState({
    open: false,
    leaveId: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    dispatch(fetchMyLeaves());
    dispatch(fetchLeaveBalance());
    if (canApproveLeaves) dispatch(fetchPendingLeaves());
  }, [dispatch, canApproveLeaves]);

  const onSubmit = async (data) => {
    const res = await dispatch(applyLeave(data));
    if (!res.error) {
      toast.success("Leave application submitted!");
      setShowModal(false);
      reset();
      dispatch(fetchLeaveBalance());
    } else {
      toast.error(res.payload || "Failed to submit");
    }
  };

  const handleApprove = async (id) => {
    const res = await dispatch(updateLeaveStatus({ id, action: "approve" }));
    if (!res.error) toast.success("Leave approved");
    else toast.error(res.payload || "Failed");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    const res = await dispatch(
      updateLeaveStatus({
        id: rejectModal.leaveId,
        action: "reject",
        reason: rejectReason,
      }),
    );
    if (!res.error) {
      toast.success("Leave rejected");
      setRejectModal({ open: false, leaveId: null });
      setRejectReason("");
    } else toast.error(res.payload || "Failed");
  };

  const tabs = [
    { id: "my-leaves", label: "My Leaves" },
    { id: "balance", label: "Balance" },
    ...(canApproveLeaves
      ? [
          {
            id: "approvals",
            label: `Approvals${pending.length ? ` (${pending.length})` : ""}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Leave Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage leave applications and approvals
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">Apply Leave</span>
          <span className="sm:hidden">Apply</span>
        </Button>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Tab Bar */}
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

        {/* My Leaves */}
        {activeTab === "my-leaves" && (
          <>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {myLeaves.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No leave applications yet
                      </p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-3 text-sm text-primary-600 font-medium"
                      >
                        Apply Leave →
                      </button>
                    </div>
                  ) : (
                    myLeaves.map((leave) => (
                      <div key={leave._id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                            {leave.leaveType?.replace(/-/g, " ")}
                          </span>
                          <Badge color={statusColor[leave.status]}>
                            {leave.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(leave.from)} → {formatDate(leave.to)} ·{" "}
                          {leave.numberOfDays} day
                          {leave.numberOfDays > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {leave.reason}
                        </p>
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
                          "Type",
                          "From",
                          "To",
                          "Days",
                          "Reason",
                          "Status",
                          "Applied",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {myLeaves.map((leave, i) => (
                        <motion.tr
                          key={leave._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 lg:px-6 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {leave.leaveType?.replace(/-/g, " ")}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(leave.from)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(leave.to)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {leave.numberOfDays}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[180px]">
                            <p className="truncate">{leave.reason}</p>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <Badge color={statusColor[leave.status]}>
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-500">
                            {formatDate(leave.createdAt)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {myLeaves.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No leave applications yet</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Balance */}
        {activeTab === "balance" && (
          <div className="p-4 sm:p-6">
            {!balance ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(balance).map(([type, data]) => (
                  <div
                    key={type}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900 dark:text-white capitalize text-sm">
                        {type.replace(/-/g, " ")} Leave
                      </p>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                          {data.remaining}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Days remaining
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {data.used} used
                        </p>
                        <p className="text-xs text-gray-400">
                          of {data.entitled}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (data.used / data.entitled) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approvals */}
        {activeTab === "approvals" && canApproveLeaves && (
          <>
            {pending.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {pending.map((leave) => (
                    <div key={leave._id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {leave.employee?.firstName}{" "}
                            {leave.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {leave.employee?.employeeId} ·{" "}
                            {leave.leaveType?.replace(/-/g, " ")} ·{" "}
                            {leave.numberOfDays} day
                            {leave.numberOfDays > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(leave.from)} → {formatDate(leave.to)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
                        {leave.reason}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({ open: true, leaveId: leave._id })
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        {[
                          "Employee",
                          "Type",
                          "From",
                          "To",
                          "Days",
                          "Reason",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pending.map((leave) => (
                        <tr
                          key={leave._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 lg:px-6 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {leave.employee?.firstName}{" "}
                              {leave.employee?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {leave.employee?.employeeId}
                            </p>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {leave.leaveType?.replace(/-/g, " ")}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(leave.from)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(leave.to)}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {leave.numberOfDays}
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[160px]">
                            <p className="truncate">{leave.reason}</p>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(leave._id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({
                                    open: true,
                                    leaveId: leave._id,
                                  })
                                }
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Apply for Leave"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("leaveType", { required: "Required" })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select type</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="mt-1 text-xs text-red-600">
                {errors.leaveType.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="From Date"
              type="date"
              required
              error={errors.from?.message}
              {...register("from", { required: "Required" })}
            />
            <Input
              label="To Date"
              type="date"
              required
              error={errors.to?.message}
              {...register("to", { required: "Required" })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("reason", {
                required: "Required",
                minLength: { value: 10, message: "Min 10 characters" },
              })}
              rows={3}
              placeholder="Describe the reason for your leave..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600">
                {errors.reason.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Submit Application
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, leaveId: null })}
        title="Reject Leave"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleReject}>
              Reject Leave
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ open: false, leaveId: null })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Leaves;
