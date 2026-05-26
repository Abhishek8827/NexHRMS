import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  User,
  Shield,
  Camera,
  Building2,
  Phone,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "../../features/auth/authSlice";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import api from "../../services/api";
import { getInitials, formatDate } from "../../utils/helpers";

const profileSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  "address.street": z.string().optional(),
  "address.city": z.string().optional(),
  "address.state": z.string().optional(),
  "address.pincode": z.string().optional(),
  "emergencyContact.name": z.string().optional(),
  "emergencyContact.relationship": z.string().optional(),
  "emergencyContact.phone": z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "security", label: "Security", icon: Shield },
];

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "personal",
  );
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        "address.street": user.address?.street || "",
        "address.city": user.address?.city || "",
        "address.state": user.address?.state || "",
        "address.pincode": user.address?.pincode || "",
        "emergencyContact.name": user.emergencyContact?.name || "",
        "emergencyContact.relationship":
          user.emergencyContact?.relationship || "",
        "emergencyContact.phone": user.emergencyContact?.phone || "",
      });
    }
  }, [user, reset]);

  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      // Unflatten address/emergencyContact
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        address: {
          street: data["address.street"],
          city: data["address.city"],
          state: data["address.state"],
          pincode: data["address.pincode"],
        },
        emergencyContact: {
          name: data["emergencyContact.name"],
          relationship: data["emergencyContact.relationship"],
          phone: data["emergencyContact.phone"],
        },
      };
      await api.put(`/employees/${user._id}`, payload);
      dispatch(getCurrentUser()); // Refresh auth state
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully!");
      resetPwd();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">
                  {getInitials(user.firstName, user.lastName)}
                </span>
              </div>
            </div>
            <div className="mb-2">
              <span className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {user.designation || "No designation set"} ·{" "}
            {user.employeeId || "—"}
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {user.department?.name || "No department"}
            </span>
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> {user.phone}
              </span>
            )}
            {user.address?.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {user.address.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    required
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <Input
                    label="Last Name"
                    required
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Contact HR to change email
                    </p>
                  </div>
                  <Input
                    label="Phone"
                    placeholder="+91 98765 43210"
                    {...register("phone")}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      {...register("gender")}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Street Address"
                    placeholder="123 Main Street"
                    {...register("address.street")}
                  />
                  <Input
                    label="City"
                    placeholder="Mumbai"
                    {...register("address.city")}
                  />
                  <Input
                    label="State"
                    placeholder="Maharashtra"
                    {...register("address.state")}
                  />
                  <Input
                    label="Pincode"
                    placeholder="400001"
                    {...register("address.pincode")}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Name"
                    placeholder="Contact name"
                    {...register("emergencyContact.name")}
                  />
                  <Input
                    label="Relationship"
                    placeholder="e.g. Spouse"
                    {...register("emergencyContact.relationship")}
                  />
                  <Input
                    label="Phone"
                    placeholder="+91 98765 43210"
                    {...register("emergencyContact.phone")}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                >
                  Discard
                </Button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Change Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Use a strong password with at least 8 characters
                </p>
                <form
                  onSubmit={handlePwdSubmit(onChangePassword)}
                  className="space-y-4 max-w-md"
                >
                  <Input
                    label="Current Password"
                    type="password"
                    required
                    error={pwdErrors.currentPassword?.message}
                    {...regPwd("currentPassword")}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    required
                    error={pwdErrors.newPassword?.message}
                    {...regPwd("newPassword")}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    error={pwdErrors.confirmPassword?.message}
                    {...regPwd("confirmPassword")}
                  />
                  <Button type="submit" loading={pwdSubmitting}>
                    Update Password
                  </Button>
                </form>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Account Information
                </h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Employee ID:{" "}
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {user.employeeId || "—"}
                    </span>
                  </p>
                  <p>
                    Account Status:{" "}
                    <span className="text-green-600 font-medium capitalize">
                      {user.status}
                    </span>
                  </p>
                  <p>
                    Last Login:{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(user.lastLogin)}
                    </span>
                  </p>
                  <p>
                    Joined:{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(user.joiningDate)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
