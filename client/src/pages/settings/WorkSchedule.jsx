import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Star,
} from "lucide-react";
import api from "../../services/api";
import { useSelector } from "react-redux";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const defaultForm = {
  shiftName: "General Shift",
  employee: "",
  department: "",
  isDefault: false,
  workingDays: [1, 2, 3, 4, 5],
  punchInHour: 9,
  punchInMinute: 0,
  punchOutHour: 18,
  punchOutMinute: 0,
  gracePeriodMinutes: 15,
  standardHours: 8,
};

const WorkSchedule = () => {
  const { list: employees } = useSelector((s) => s.employees);
  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, schedule: null });
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchDepartments();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/schedules");
      setSchedules(res.data.data);
    } catch {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data);
    } catch {}
  };

  const openCreate = () => {
    setForm(defaultForm);
    setModal({ open: true, schedule: null });
  };

  const openEdit = (schedule) => {
    setForm({
      shiftName: schedule.shiftName,
      employee: schedule.employee?._id || "",
      department: schedule.department?._id || "",
      isDefault: schedule.isDefault || false,
      workingDays: schedule.workingDays || [1, 2, 3, 4, 5],
      punchInHour: schedule.punchInTime?.hour ?? 9,
      punchInMinute: schedule.punchInTime?.minute ?? 0,
      punchOutHour: schedule.punchOutTime?.hour ?? 18,
      punchOutMinute: schedule.punchOutTime?.minute ?? 0,
      gracePeriodMinutes: schedule.gracePeriodMinutes ?? 15,
      standardHours: schedule.standardHours ?? 8,
    });
    setModal({ open: true, schedule });
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort(),
    }));
  };

  const handleSave = async () => {
    if (!form.shiftName.trim()) {
      toast.error("Shift name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shiftName: form.shiftName,
        employee: form.employee || null,
        department: form.department || null,
        isDefault: form.isDefault,
        workingDays: form.workingDays,
        punchInTime: {
          hour: Number(form.punchInHour),
          minute: Number(form.punchInMinute),
        },
        punchOutTime: {
          hour: Number(form.punchOutHour),
          minute: Number(form.punchOutMinute),
        },
        gracePeriodMinutes: Number(form.gracePeriodMinutes),
        standardHours: Number(form.standardHours),
      };

      if (modal.schedule) {
        await api.put(`/schedules/${modal.schedule._id}`, payload);
        toast.success("Schedule updated!");
      } else {
        await api.post("/schedules", payload);
        toast.success("Schedule created!");
      }

      setModal({ open: false, schedule: null });
      fetchSchedules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Schedule deleted");
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatTime = (hour, minute) => {
    const h = Number(hour);
    const m = String(minute).padStart(2, "0");
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${m} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Work Schedules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure punch-in/out timings and shift schedules
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Schedule
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No schedules configured yet
          </p>
          <Button className="mt-4" variant="secondary" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create First Schedule
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schedules.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {s.shiftName}
                    </h3>
                    {s.isDefault && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  {s.employee && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {s.employee.firstName} {s.employee.lastName} (
                      {s.employee.employeeId})
                    </p>
                  )}
                  {s.department && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {s.department.name}
                    </p>
                  )}
                  {!s.employee && !s.department && (
                    <p className="text-xs text-gray-400 mt-1">All employees</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Punch In</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400 mt-1">
                    {formatTime(s.punchInTime?.hour, s.punchInTime?.minute)}
                  </p>
                  <p className="text-xs text-green-600">
                    +{s.gracePeriodMinutes}m grace
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600 font-medium">Punch Out</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400 mt-1">
                    {formatTime(s.punchOutTime?.hour, s.punchOutTime?.minute)}
                  </p>
                  <p className="text-xs text-red-600">
                    {s.standardHours}h standard
                  </p>
                </div>
              </div>

              {/* Working Days */}
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((d, idx) => (
                  <span
                    key={d}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      s.workingDays?.includes(idx)
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, schedule: null })}
        title={modal.schedule ? "Edit Schedule" : "Create Work Schedule"}
        size="md"
      >
        <div className="space-y-5">
          <Input
            label="Shift Name"
            required
            placeholder="e.g. General Shift, Night Shift"
            value={form.shiftName}
            onChange={(e) =>
              setForm((f) => ({ ...f, shiftName: e.target.value }))
            }
          />

          {/* Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign to Employee
              </label>
              <select
                value={form.employee}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    employee: e.target.value,
                    department: "",
                    isDefault: false,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No specific employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId || emp.role}
                    )
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign to Department
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    department: e.target.value,
                    employee: "",
                    isDefault: false,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No specific department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Default toggle */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isDefault: e.target.checked,
                  employee: "",
                  department: "",
                }))
              }
              className="rounded"
            />
            <label
              htmlFor="isDefault"
              className="text-sm text-yellow-700 dark:text-yellow-300 font-medium"
            >
              Set as default schedule (applies to all employees without specific
              schedule)
            </label>
          </div>

          {/* Punch In */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Punch In Time
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Hour (0–23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.punchInHour}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, punchInHour: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Minute
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={form.punchInMinute}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, punchInMinute: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Grace (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.gracePeriodMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gracePeriodMinutes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Punch Out */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Punch Out Time
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Hour (0–23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.punchOutHour}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, punchOutHour: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Minute
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={form.punchOutMinute}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, punchOutMinute: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Standard Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={form.standardHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, standardHours: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Days
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d, idx) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.workingDays.includes(idx)
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Preview
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{form.shiftName}</span> —{" "}
              {formatTime(form.punchInHour, form.punchInMinute)} to{" "}
              {formatTime(form.punchOutHour, form.punchOutMinute)} (
              {form.standardHours}h) • {form.gracePeriodMinutes}min grace
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {modal.schedule ? "Update Schedule" : "Create Schedule"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal({ open: false, schedule: null })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkSchedule;
