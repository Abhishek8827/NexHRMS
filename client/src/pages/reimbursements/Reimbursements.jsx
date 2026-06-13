import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Upload,
} from "lucide-react";
import {
  fetchReimbursements,
  submitReimbursement,
  approveReimbursement,
  rejectReimbursement,
} from "../../features/reimbursements/reimbursementSlice";
import useAuth from "../../hooks/useAuth";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { useForm } from "react-hook-form";

const CATEGORIES = [
  "travel",
  "meals",
  "accommodation",
  "office-supplies",
  "training",
  "medical",
  "internet",
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
  const { isAdmin, isHR, isManager } = useAuth();
  const { list, loading } = useSelector((s) => s.reimbursements);
  const canApprove = isAdmin || isHR || isManager;

  const [modal, setModal] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    dispatch(fetchReimbursements());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(submitReimbursement(data));
    if (!res.error) {
      toast.success("Reimbursement submitted!");
      setModal(false);
      reset();
    } else toast.error(res.payload || "Failed");
  };

  const onApprove = async (id) => {
    const res = await dispatch(approveReimbursement(id));
    if (!res.error) toast.success("Approved!");
    else toast.error(res.payload || "Failed");
  };

  const onReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Provide a reason");
      return;
    }
    const res = await dispatch(
      rejectReimbursement({ id: rejectModal.id, reason: rejectReason }),
    );
    if (!res.error) {
      toast.success("Rejected");
      setRejectModal({ open: false, id: null });
      setRejectReason("");
    } else toast.error(res.payload || "Failed");
  };

  const tabs = ["all", "pending", "approved", "rejected"];
  const filtered =
    activeTab === "all" ? list : list.filter((r) => r.status === activeTab);

  const totalPending = list
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.amount, 0);
  const totalApproved = list
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Reimbursements
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Submit and manage expense claims
          </p>
        </div>
        <Button onClick={() => setModal(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Claim</span>
          <span className="sm:hidden">Claim</span>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Claims",
            value: list.length,
            color:
              "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
          },
          {
            label: "Pending",
            value: list.filter((r) => r.status === "pending").length,
            color:
              "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
          },
          {
            label: "Pending Amt",
            value: formatCurrency(totalPending),
            color:
              "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
          },
          {
            label: "Approved Amt",
            value: formatCurrency(totalApproved),
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${s.color} rounded-xl p-3 sm:p-4`}
          >
            <p className="text-base sm:text-xl font-bold truncate">{s.value}</p>
            <p className="text-[10px] sm:text-xs font-medium mt-0.5">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tab bar + list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium capitalize whitespace-nowrap transition-colors flex-shrink-0
                ${activeTab === tab ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No {activeTab === "all" ? "" : activeTab} claims
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {r.category?.replace(/-/g, " ")} ·{" "}
                        {formatDate(r.date || r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(r.amount)}
                    </span>
                    <Badge color={statusColor[r.status] || "gray"}>
                      {r.status}
                    </Badge>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${expanded === r._id ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {expanded === r._id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 sm:px-5 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-3"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {r.description}
                    </p>

                    {r.submittedBy && (
                      <p className="text-xs text-gray-500">
                        Submitted by:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {r.submittedBy?.firstName} {r.submittedBy?.lastName}
                        </span>
                      </p>
                    )}

                    {r.status === "rejected" && r.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-red-600 mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {r.rejectionReason}
                        </p>
                      </div>
                    )}

                    {canApprove && r.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApprove(r._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({ open: true, id: r._id })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          reset();
        }}
        title="Submit Reimbursement"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title *"
            placeholder="e.g. Cab to client office"
            {...register("title", { required: "Title required" })}
            error={errors.title?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                {...register("category")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Amount (₹) *"
              type="number"
              placeholder="0.00"
              {...register("amount", {
                required: "Amount required",
                min: { value: 1, message: "Min ₹1" },
              })}
              error={errors.amount?.message}
            />
          </div>
          <Input label="Expense Date" type="date" {...register("date")} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Add expense details..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <Input
            label="Receipt URL (optional)"
            placeholder="https://..."
            {...register("receiptUrl")}
          />
          <div className="flex gap-3">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Submit Claim
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModal(false);
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
        onClose={() => setRejectModal({ open: false, id: null })}
        title="Reject Reimbursement"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Provide reason for rejection..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={onReject}>
              Reject Claim
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ open: false, id: null })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reimbursements;