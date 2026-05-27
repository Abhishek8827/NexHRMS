import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Receipt, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  fetchMyReimbursements,
  fetchAllReimbursements,
  createReimbursement,
  updateReimbursementStatus,
} from "../../features/reimbursements/reimbursementSlice";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { useForm } from "react-hook-form";

const CATEGORIES = [
  "travel",
  "food",
  "accommodation",
  "medical",
  "training",
  "equipment",
  "other",
];
const statusColor = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  paid: "blue",
};

const Reimbursements = () => {
  const dispatch = useDispatch();
  const { isAdminOrHR, isManager } = useAuth();
  const { myList, allList, loading } = useSelector((s) => s.reimbursements);

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const [actionModal, setActionModal] = useState({ open: false, record: null });
  const [approvedAmount, setApprovedAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    dispatch(fetchMyReimbursements());
    if (isAdminOrHR || isManager) {
      dispatch(fetchAllReimbursements());
    }
  }, [dispatch, isAdminOrHR, isManager]);

  const onSubmit = async (data) => {
    const res = await dispatch(createReimbursement(data));
    if (!res.error) {
      toast.success("Reimbursement request submitted!");
      setShowModal(false);
      reset();
    } else {
      toast.error(res.payload || "Failed to submit");
    }
  };

  const handleStatusUpdate = async (status) => {
    const res = await dispatch(
      updateReimbursementStatus({
        id: actionModal.record._id,
        status,
        approvedAmount: approvedAmount || actionModal.record.amount,
        remarks,
      }),
    );
    if (!res.error) {
      toast.success(`Reimbursement ${status}`);
      setActionModal({ open: false, record: null });
      setApprovedAmount("");
      setRemarks("");
      dispatch(fetchMyReimbursements());
      if (isAdminOrHR || isManager) dispatch(fetchAllReimbursements());
    } else {
      toast.error(res.payload || "Failed");
    }
  };

  const displayList = activeTab === "my" ? myList : allList;

  const tabs = [
    { id: "my", label: "My Requests" },
    ...(isAdminOrHR || isManager
      ? [
          {
            id: "all",
            label: `All Requests${allList.length ? ` (${allList.length})` : ""}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reimbursements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Submit and track expense reimbursements
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending",
            value: myList.filter((r) => r.status === "pending").length,
            icon: Clock,
            color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
          },
          {
            label: "Approved",
            value: myList.filter((r) => r.status === "approved").length,
            icon: CheckCircle,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Paid",
            value: myList.filter((r) => r.status === "paid").length,
            icon: Receipt,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.color} rounded-xl p-4 flex items-center gap-3`}
          >
            <s.icon className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {tabs.length > 1 && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">
              No reimbursement requests yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  {[
                    ...(activeTab === "all" ? ["Employee"] : []),
                    "Category",
                    "Amount",
                    "Date",
                    "Description",
                    "Status",
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
                {displayList.map((r, i) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    {activeTab === "all" && (
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.employee?.employeeId}
                        </p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {r.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(r.expenseDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                      <p className="truncate">{r.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={statusColor[r.status] || "gray"}>
                        {r.status}
                      </Badge>
                      {r.approvedAmount && r.status !== "pending" && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(r.approvedAmount)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(isAdminOrHR || isManager) && r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setActionModal({ open: true, record: r });
                            setApprovedAmount(String(r.amount));
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Submit Reimbursement Request"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            required
            placeholder="500"
            {...register("amount", { required: true, min: 1 })}
          />
          <Input
            label="Expense Date"
            type="date"
            required
            {...register("expenseDate", { required: true })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", { required: true })}
              rows={3}
              placeholder="Describe the expense..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Submit Request
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

      {/* Review Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, record: null })}
        title="Review Reimbursement"
        size="sm"
      >
        {actionModal.record && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {actionModal.record.category}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(actionModal.record.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {actionModal.record.description}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Approved Amount (₹)
              </label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks
              </label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusUpdate("approved")}
                className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                ✗ Reject
              </button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setActionModal({ open: false, record: null })}
            >
              Cancel
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reimbursements;
