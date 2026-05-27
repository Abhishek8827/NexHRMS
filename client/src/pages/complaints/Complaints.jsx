import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  MessageSquare,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
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
import { useForm } from "react-hook-form";

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
  const { isAdminOrHR } = useAuth();
  const { list, loading } = useSelector((s) => s.complaints);

  const [showModal, setShowModal] = useState(false);
  const [resolveModal, setResolveModal] = useState({
    open: false,
    complaint: null,
  });
  const [resolution, setResolution] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createComplaint(data));
    if (!res.error) {
      toast.success("Complaint submitted successfully");
      setShowModal(false);
      reset();
    } else {
      toast.error(res.payload || "Failed to submit complaint");
    }
  };

  const handleResolve = async (status) => {
    const res = await dispatch(
      updateComplaintStatus({
        id: resolveModal.complaint._id,
        status,
        resolution,
      }),
    );
    if (!res.error) {
      toast.success("Complaint status updated");
      setResolveModal({ open: false, complaint: null });
      setResolution("");
    } else {
      toast.error(res.payload || "Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complaints
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Raise and track workplace concerns
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Raise Complaint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Open",
            value: list.filter((c) => c.status === "open").length,
            color:
              "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          },
          {
            label: "Under Review",
            value: list.filter((c) => c.status === "under-review").length,
            color:
              "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
          },
          {
            label: "Resolved",
            value: list.filter((c) => c.status === "resolved").length,
            color:
              "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
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
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">
              No complaints raised yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {list.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded capitalize">
                        {c.category?.replace(/-/g, " ")}
                      </span>
                      <Badge color={statusColor[c.status] || "gray"}>
                        {c.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {c.subject}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {c.description}
                    </p>
                    {c.resolution && (
                      <p className="text-sm text-green-600 mt-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                        <strong>Resolution:</strong> {c.resolution}
                      </p>
                    )}
                    {isAdminOrHR && c.raisedBy && (
                      <p className="text-xs text-gray-400 mt-2">
                        Raised by: {c.raisedBy.firstName} {c.raisedBy.lastName}
                        {c.raisedBy.employeeId && ` (${c.raisedBy.employeeId})`}
                      </p>
                    )}
                  </div>
                  {isAdminOrHR &&
                    c.status !== "resolved" &&
                    c.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setResolveModal({ open: true, complaint: c })
                        }
                      >
                        Update
                      </Button>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Complaint Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Raise a Complaint"
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
                  {c.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Subject"
            required
            placeholder="Brief subject of complaint"
            {...register("subject", { required: true })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", { required: true })}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAnonymous"
              {...register("isAnonymous")}
              className="rounded"
            />
            <label
              htmlFor="isAnonymous"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Submit anonymously (your identity will be hidden)
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

      {/* Update Status Modal — HR/Admin */}
      <Modal
        isOpen={resolveModal.open}
        onClose={() => setResolveModal({ open: false, complaint: null })}
        title="Update Complaint Status"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {resolveModal.complaint?.subject}
            </p>
            <p className="text-xs text-gray-500">
              {resolveModal.complaint?.description}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resolution / Notes
            </label>
            <textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe action taken or resolution..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleResolve("under-review")}
              className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium"
            >
              Mark Under Review
            </button>
            <button
              onClick={() => handleResolve("action-taken")}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
            >
              Action Taken
            </button>
            <button
              onClick={() => handleResolve("resolved")}
              className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium"
            >
              Mark Resolved
            </button>
            <button
              onClick={() => handleResolve("closed")}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Close Complaint
            </button>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setResolveModal({ open: false, complaint: null })}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Complaints;
