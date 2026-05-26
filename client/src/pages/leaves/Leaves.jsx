import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from "lucide-react";
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
  const { user, canApproveLeaves } = useAuth();
  const { myLeaves, pending, balance, loading } = useSelector(
    (state) => state.leaves,
  );
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
      toast.success("Leave application submitted successfully!");
      setShowModal(false);
      reset();
      dispatch(fetchLeaveBalance());
    } else {
      toast.error(res.payload || "Failed to submit leave");
    }
  };

  const handleApprove = async (id) => {
    const res = await dispatch(updateLeaveStatus({ id, action: "approve" }));
    if (!res.error) toast.success("Leave approved");
    else toast.error(res.payload || "Failed to approve");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
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
    } else {
      toast.error(res.payload || "Failed to reject");
    }
  };

  const tabs = [
    { id: "my-leaves", label: "My Leaves" },
    { id: "balance", label: "Leave Balance" },
    ...(canApproveLeaves
      ? [
          {
            id: "approvals",
            label: `Pending Approvals${pending.length ? ` (${pending.length})` : ""}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leave Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage leave applications and approvals
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Apply Leave
        </Button>
      </div>

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
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Leaves Tab */}
        {activeTab === "my-leaves" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
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
                      "Applied On",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {leave.leaveType?.replace(/-/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(leave.from)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(leave.to)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {leave.numberOfDays}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        <p className="truncate">{leave.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={statusColor[leave.status]}>
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(leave.createdAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && myLeaves.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400">
                  No leave applications yet
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => setShowModal(true)}
                >
                  Apply Your First Leave
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Balance Tab */}
        {activeTab === "balance" && (
          <div className="p-6">
            {!balance ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(balance).map(([type, data]) => (
                  <div
                    key={type}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {type.replace(/-/g, " ")} Leave
                      </p>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-primary-600">
                          {data.remaining}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Days remaining
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {data.used} used
                        </p>
                        <p className="text-xs text-gray-400">
                          of {data.entitled} entitled
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
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

        {/* Approvals Tab */}
        {activeTab === "approvals" && canApproveLeaves && (
          <div className="overflow-x-auto">
            {pending.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="text-gray-500 dark:text-gray-400">
                  No pending leave approvals
                </p>
              </div>
            ) : (
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
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {leave.employee?.employeeId}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {leave.leaveType?.replace(/-/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(leave.from)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(leave.to)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {leave.numberOfDays}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        <p className="truncate">{leave.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(leave._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({ open: true, leaveId: leave._id })
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
            )}
          </div>
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
              {...register("leaveType", {
                required: "Please select leave type",
              })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select leave type</option>
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              required
              error={errors.from?.message}
              {...register("from", { required: "Start date is required" })}
            />
            <Input
              label="To Date"
              type="date"
              required
              error={errors.to?.message}
              {...register("to", { required: "End date is required" })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("reason", {
                required: "Reason is required",
                minLength: {
                  value: 10,
                  message: "Please provide a detailed reason (min 10 chars)",
                },
              })}
              rows={3}
              placeholder="Please describe the reason for your leave..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
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

      {/* Reject Reason Modal */}
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
              placeholder="Provide a reason for rejection..."
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
