import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  CheckSquare,
  Plus,
  X,
  Clock,
  Flag,
  MessageSquare,
  Calendar,
} from "lucide-react";
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} from "../../features/tasks/taskSlice";
import { fetchEmployees } from "../../features/employees/employeeSlice";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import Badge from "../../components/common/Badge";
import useAuth from "../../hooks/useAuth";
import { formatDate, getInitials } from "../../utils/helpers";

const COLUMNS = [
  {
    id: "todo",
    label: "To Do",
    color: "border-gray-300 dark:border-gray-600",
    bg: "bg-gray-50 dark:bg-gray-800/50",
  },
  {
    id: "in-progress",
    label: "In Progress",
    color: "border-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/10",
  },
  {
    id: "in-review",
    label: "In Review",
    color: "border-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
  },
  {
    id: "done",
    label: "Done",
    color: "border-green-400",
    bg: "bg-green-50 dark:bg-green-900/10",
  },
];

const PRIORITY_CONFIG = {
  low: {
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-700",
    icon: "○",
  },
  medium: {
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "◑",
  },
  high: {
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: "●",
  },
  critical: {
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: "⬤",
  },
};

// ── Task Card ─────────────────────────────────────────────
const TaskCard = ({ task, onStatusChange, onDelete, onView, canManage }) => {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      // KEY is provided by parent — no need here
      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(task)}
    >
      {/* Priority + Delete */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${p.bg} ${p.color}`}
        >
          {p.icon} {task.priority}
        </span>
        {canManage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag, tagIdx) => (
            <span
              key={`tag-${task._id}-${tagIdx}`}
              className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Assignees */}
          <div className="flex -space-x-1">
            {task.assignedTo?.slice(0, 3).map((a, aIdx) => (
              <div
                key={a._id || `assignee-${task._id}-${aIdx}`}
                className="w-6 h-6 rounded-full bg-primary-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                title={`${a.firstName} ${a.lastName}`}
              >
                {getInitials(a.firstName, a.lastName)}
              </div>
            ))}
          </div>

          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>

        {task.dueDate && (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-red-500 font-medium" : "text-gray-400"
            }`}
          >
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Status changer */}
      <select
        value={task.status}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(task._id, e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="in-review">In Review</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
    </motion.div>
  );
};

// ── Main Tasks Component ──────────────────────────────────
const Tasks = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.tasks);
  const { list: employees } = useSelector((s) => s.employees);
  const { isAdminOrHR, isManager } = useAuth();

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, task: null });
  const [comment, setComment] = useState("");
  const [view, setView] = useState("kanban");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: [],
    dueDate: "",
    tags: "",
    project: "",
  });

  const canManage = isAdminOrHR || isManager;

  useEffect(() => {
    dispatch(fetchTasks());
    if (canManage) {
      dispatch(fetchEmployees({ status: "active", limit: 100 }));
    }
  }, [dispatch, canManage]);

  const handleCreate = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    const payload = {
      ...taskForm,
      tags: taskForm.tags
        ? taskForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      assignedTo: taskForm.assignedTo,
    };
    const res = await dispatch(createTask(payload));
    if (!res.error) {
      toast.success("Task created!");
      setCreateModal(false);
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: [],
        dueDate: "",
        tags: "",
        project: "",
      });
    } else {
      toast.error(res.payload || "Failed to create task");
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await dispatch(updateTaskStatus({ id, status }));
    if (!res.error) toast.success("Status updated");
    else toast.error(res.payload || "Failed");
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteTask(id));
    if (!res.error) toast.success("Task deleted");
    else toast.error(res.payload || "Failed");
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await dispatch(
      addComment({ id: viewModal.task._id, text: comment }),
    );
    if (!res.error) {
      setComment("");
      // Update the task in the modal with new comment
      setViewModal((v) => ({ ...v, task: res.payload }));
    } else {
      toast.error(res.payload || "Failed to add comment");
    }
  };

  const tasksByColumn = (colId) => list.filter((t) => t.status === colId);

  const stats = {
    total: list.length,
    todo: list.filter((t) => t.status === "todo").length,
    inProgress: list.filter((t) => t.status === "in-progress").length,
    done: list.filter((t) => t.status === "done").length,
    overdue: list.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track team tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {["kanban", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  view === v
                    ? "bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {canManage && (
            <Button onClick={() => setCreateModal(true)}>
              <Plus className="w-4 h-4" /> New Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            color:
              "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300",
          },
          {
            label: "To Do",
            value: stats.todo,
            color:
              "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Done",
            value: stats.done,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            color: "text-red-600 bg-red-50 dark:bg-red-900/20",
          },
        ].map((s) => (
          <div
            key={`stat-${s.label}`}
            className={`${s.color} rounded-xl p-3 text-center`}
          >
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : view === "kanban" ? (
        /* ── Kanban Board ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  {col.label}
                </h3>
                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 font-medium">
                  {tasksByColumn(col.id).length}
                </span>
              </div>
              <div
                className={`min-h-[200px] ${col.bg} rounded-xl p-3 space-y-3 border-t-2 ${col.color}`}
              >
                <AnimatePresence>
                  {tasksByColumn(col.id).map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onView={(t) => setViewModal({ open: true, task: t })}
                      canManage={canManage}
                    />
                  ))}
                </AnimatePresence>
                {tasksByColumn(col.id).length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                {[
                  "Task",
                  "Assigned To",
                  "Priority",
                  "Status",
                  "Due Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={`th-${h}`}
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {list.map((task, i) => {
                const p =
                  PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "done";

                return (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => setViewModal({ open: true, task })}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.project && (
                        <p className="text-xs text-gray-500">{task.project}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-1">
                        {task.assignedTo?.slice(0, 3).map((a, aIdx) => (
                          <div
                            key={a._id || `list-assignee-${task._id}-${aIdx}`}
                            className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                            title={`${a.firstName} ${a.lastName}`}
                          >
                            {getInitials(a.firstName, a.lastName)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${p.bg} ${p.color}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        color={
                          task.status === "done"
                            ? "green"
                            : task.status === "in-progress"
                              ? "blue"
                              : task.status === "blocked"
                                ? "red"
                                : "gray"
                        }
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        isOverdue
                          ? "text-red-600 font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatDate(task.dueDate)}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canManage && (
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {list.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Task Modal ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Task"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="What needs to be done?"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, title: e.target.value }))
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Add more details..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, priority: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign To
            </label>
            <select
              multiple
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm((f) => ({
                  ...f,
                  assignedTo: Array.from(
                    e.target.selectedOptions,
                    (o) => o.value,
                  ),
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-28"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} — {emp.designation || emp.role}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Hold Ctrl / Cmd to select multiple
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Project"
              placeholder="e.g. NexHR v2"
              value={taskForm.project}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, project: e.target.value }))
              }
            />
            <Input
              label="Tags (comma separated)"
              placeholder="frontend, urgent"
              value={taskForm.tags}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, tags: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleCreate}>
              Create Task
            </Button>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── View Task Modal ── */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, task: null })}
        title="Task Details"
        size="md"
      >
        {viewModal.task && (
          <div className="space-y-4">
            {/* Title + Priority */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {viewModal.task.title}
                </h3>
                {viewModal.task.project && (
                  <p className="text-sm text-primary-600 mt-1">
                    {viewModal.task.project}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  PRIORITY_CONFIG[viewModal.task.priority]?.bg
                } ${PRIORITY_CONFIG[viewModal.task.priority]?.color}`}
              >
                {viewModal.task.priority}
              </span>
            </div>

            {/* Description */}
            {viewModal.task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                {viewModal.task.description}
              </p>
            )}

            {/* Status + Due Date */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">
                  <Badge
                    color={
                      viewModal.task.status === "done"
                        ? "green"
                        : viewModal.task.status === "in-progress"
                          ? "blue"
                          : viewModal.task.status === "blocked"
                            ? "red"
                            : "gray"
                    }
                  >
                    {viewModal.task.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Due Date
                </span>
                <p className="mt-1 text-gray-900 dark:text-white font-medium">
                  {formatDate(viewModal.task.dueDate)}
                </p>
              </div>
            </div>

            {/* Assigned To */}
            {viewModal.task.assignedTo?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Assigned To
                </p>
                <div className="flex flex-wrap gap-2">
                  {viewModal.task.assignedTo.map((a, aIdx) => (
                    <div
                      key={a._id || `modal-assignee-${aIdx}`}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(a.firstName, a.lastName)}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {a.firstName} {a.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {viewModal.task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewModal.task.tags.map((tag, tIdx) => (
                  <span
                    key={`modal-tag-${tIdx}-${tag}`}
                    className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({viewModal.task.comments?.length || 0})
              </p>

              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {viewModal.task.comments?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">
                    No comments yet
                  </p>
                ) : (
                  viewModal.task.comments?.map((c, i) => (
                    // KEY FIX: use c._id if available, else composite key
                    <div
                      key={c._id || `comment-${viewModal.task._id}-${i}`}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {c.user?.firstName} {c.user?.lastName} •{" "}
                        {formatDate(c.createdAt)}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  placeholder="Add a comment... (Enter to post)"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400"
                />
                <Button size="sm" onClick={handleComment}>
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
