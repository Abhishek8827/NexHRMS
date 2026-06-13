import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { MessageSquare, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  fetchComplaints,
  createComplaint,
  updateComplaintStatus,
} from "../../features/complaints/complaintSlice";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import { formatDate } from "../../utils/helpers";

const CATEGORIES = [
  "harassment",
  "discrimination",
  "workplace-safety",
  "payroll",
  "policy-violation",
  "manager-behavior",
  "other",
];

const statusColor = {
  open: "red",
  "under-review": "yellow",
  "action-taken": "blue",
  resolved: "green",
  closed: "gray",
};

const Complaints = () => {
  const dispatch = useDispatch();
  const { isAdminOrHR, isManager } = useAuth();
  const { list, loading } = useSelector((s) => s.complaints);

  const [showModal, setShowModal] = useState(false);
  const [resolveModal, setResolveModal] = useState({
    open: false,
    complaint: null,
  });
  const [resolution, setResolution] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { priority: "medium" } });

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const payload = { ...data, isAnonymous: Boolean(data.isAnonymous) };
    const res = await dispatch(createComplaint(payload));
    if (!res.error) {
      toast.success("Complaint submitted successfully");
      setShowModal(false);
      reset();
    } else {
      toast.error(res.payload || "Failed to submit complaint");
    }
  };

  const handleStatusUpdate = async (status) => {
    setUpdatingStatus(true);
    const res = await dispatch(
      updateComplaintStatus({
        id: resolveModal.complaint._id,
        status,
        resolution: resolution || undefined,
      }),
    );
    setUpdatingStatus(false);
    if (!res.error) {
      toast.success(`Complaint marked as: ${status.replace(/-/g, " ")}`);
      setResolveModal({ open: false, complaint: null });
      setResolution("");
    } else {
      toast.error(res.payload || "Failed to update");
    }
  };

  const stats = {
    open: list.filter((c) => c.status === "open").length,
    inReview: list.filter((c) => c.status === "under-review").length,
    resolved: list.filter((c) => c.status === "resolved").length,
  };

  const canManage = isAdminOrHR || isManager;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Complaints
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Raise and track workplace concerns
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Raise Complaint</span>
          <span className="sm:hidden">Raise</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Open",
            value: stats.open,
            color:
              "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
          },
          {
            label: "Under Review",
            value: stats.inReview,
            color:
              "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            color:
              "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 sm:p-4`}>
            <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
            <p className="text-xs sm:text-sm font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              No complaints raised yet
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-4 h-4" /> Raise First Complaint
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {list.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded capitalize">
                        {c.category?.replace(/-/g, " ")}
                      </span>
                      <Badge color={statusColor[c.status] || "gray"}>
                        {c.status?.replace(/-/g, " ")}
                      </Badge>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          c.priority === "critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : c.priority === "high"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              : c.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </div>

                    {/* Subject */}
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      {c.subject}
                    </p>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {c.description}
                    </p>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs text-gray-400">
                      {!c.isAnonymous && c.raisedBy && (
                        <span>
                          By: {c.raisedBy?.firstName} {c.raisedBy?.lastName}
                        </span>
                      )}
                      {c.isAnonymous && (
                        <span className="italic">Anonymous</span>
                      )}
                      <span>{formatDate(c.createdAt)}</span>
                    </div>

                    {/* Resolution (if resolved) */}
                    {c.resolution && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          Resolution
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {c.resolution}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage &&
                    c.status !== "resolved" &&
                    c.status !== "closed" && (
                      <button
                        onClick={() =>
                          setResolveModal({ open: true, complaint: c })
                        }
                        className="flex-shrink-0 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors whitespace-nowrap"
                      >
                        Update Status
                      </button>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Complaint Modal ─────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Raise a Complaint"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category", { required: "Category is required" })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat.replace(/-/g, " ")}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">
                {errors.category.message}
              </p>
            )}
          </div>

          <Input
            label="Subject"
            required
            placeholder="Brief subject of complaint"
            error={errors.subject?.message}
            {...register("subject", { required: "Subject is required" })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", {
                required: "Description is required",
                minLength: { value: 10, message: "Min 10 characters required" },
              })}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="isAnonymous"
              {...register("isAnonymous")}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="isAnonymous"
              className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Submit anonymously — your identity will be hidden from HR/Manager
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Submit Complaint
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

      {/* ── Update Status Modal (HR/Admin) ─────────────────── */}
      <Modal
        isOpen={resolveModal.open}
        onClose={() => {
          setResolveModal({ open: false, complaint: null });
          setResolution("");
        }}
        title="Update Complaint Status"
        size="sm"
      >
        {resolveModal.complaint && (
          <div className="space-y-4">
            {/* Complaint summary */}
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  color={statusColor[resolveModal.complaint.status] || "gray"}
                >
                  {resolveModal.complaint.status}
                </Badge>
                <span className="text-xs text-gray-500 capitalize">
                  {resolveModal.complaint.category?.replace(/-/g, " ")}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {resolveModal.complaint.subject}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {resolveModal.complaint.description}
              </p>
            </div>

            {/* Resolution notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resolution / Action Notes
              </label>
              <textarea
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe the action taken or resolution provided..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Status buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatusUpdate("under-review")}
                disabled={updatingStatus}
                className="px-3 py-2.5 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-60"
              >
                Under Review
              </button>
              <button
                onClick={() => handleStatusUpdate("action-taken")}
                disabled={updatingStatus}
                className="px-3 py-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-60"
              >
                Action Taken
              </button>
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={updatingStatus}
                className="px-3 py-2.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-60"
              >
                ✓ Mark Resolved
              </button>
              <button
                onClick={() => handleStatusUpdate("closed")}
                disabled={updatingStatus}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setResolveModal({ open: false, complaint: null });
                setResolution("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Complaints;
