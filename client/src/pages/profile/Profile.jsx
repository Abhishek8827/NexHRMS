import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Bell,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Save,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
// import { updateProfile, changePassword } from "../../features/auth/authSlice";
import { getCurrentUser } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import { formatDate, getInitials } from "../../utils/helpers";

const roleColors = {
  admin: "from-violet-500 to-indigo-600",
  hr: "from-blue-500 to-cyan-600",
  manager: "from-emerald-500 to-teal-600",
  employee: "from-orange-500 to-amber-600",
};

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile",
  );
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const gradient = roleColors[user?.role] || roleColors.employee;

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth?.split("T")[0] || "",
      gender: user?.gender || "",
      "address.street": user?.address?.street || "",
      "address.city": user?.address?.city || "",
      "address.state": user?.address?.state || "",
      "address.country": user?.address?.country || "",
      "emergencyContact.name": user?.emergencyContact?.name || "",
      "emergencyContact.phone": user?.emergencyContact?.phone || "",
      "emergencyContact.relationship":
        user?.emergencyContact?.relationship || "",
    },
  });

  const pwdForm = useForm();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
        gender: user.gender || "",
        "address.street": user.address?.street || "",
        "address.city": user.address?.city || "",
        "address.state": user.address?.state || "",
        "address.country": user.address?.country || "",
        "emergencyContact.name": user.emergencyContact?.name || "",
        "emergencyContact.phone": user.emergencyContact?.phone || "",
        "emergencyContact.relationship":
          user.emergencyContact?.relationship || "",
      });
    }
  }, [user]);

  const onSaveProfile = async (data) => {
    const payload = {
      ...data,
      address: {
        street: data["address.street"],
        city: data["address.city"],
        state: data["address.state"],
        country: data["address.country"],
      },
      emergencyContact: {
        name: data["emergencyContact.name"],
        phone: data["emergencyContact.phone"],
        relationship: data["emergencyContact.relationship"],
      },
    };
    [
      "address.street",
      "address.city",
      "address.state",
      "address.country",
      "emergencyContact.name",
      "emergencyContact.phone",
      "emergencyContact.relationship",
    ].forEach((k) => delete payload[k]);

    const res = await dispatch(updateProfile(payload));
    if (!res.error) toast.success("Profile updated!");
    else toast.error(res.payload || "Failed to update");
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const res = await dispatch(
      changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    );
    if (!res.error) {
      toast.success("Password changed successfully!");
      pwdForm.reset();
    } else toast.error(res.payload || "Failed to change password");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* ── Profile Hero ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-r ${gradient} rounded-2xl p-5 sm:p-8 overflow-hidden`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                getInitials(user?.firstName, user?.lastName)
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-0.5">
              {user?.designation || user?.role}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full capitalize font-medium">
                {user?.role}
              </span>
              {user?.employeeId && (
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-mono">
                  {user.employeeId}
                </span>
              )}
              <Badge color={user?.status === "active" ? "green" : "red"}>
                {user?.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Email", value: user?.email, icon: Mail },
            {
              label: "Department",
              value: user?.department?.name || "—",
              icon: Building2,
            },
            {
              label: "Joined",
              value: formatDate(user?.joiningDate),
              icon: Calendar,
            },
            { label: "Phone", value: user?.phone || "Not added", icon: Phone },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 min-w-0">
              <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white/60 text-[10px] sm:text-xs">
                  {item.label}
                </p>
                <p className="text-white text-xs sm:text-sm font-medium truncate">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {/* ── Profile Tab ─────────────────────────────── */}
          {activeTab === "profile" && (
            <form
              onSubmit={profileForm.handleSubmit(onSaveProfile)}
              className="space-y-6"
            >
              {/* Personal info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="First Name *"
                    {...profileForm.register("firstName", { required: true })}
                  />
                  <Input
                    label="Last Name *"
                    {...profileForm.register("lastName", { required: true })}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...profileForm.register("phone")}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    {...profileForm.register("dateOfBirth")}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      {...profileForm.register("gender")}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                  <Input
                    label="Email (read-only)"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Street Address"
                      placeholder="House/Flat no, Street, Area"
                      {...profileForm.register("address.street")}
                    />
                  </div>
                  <Input
                    label="City"
                    {...profileForm.register("address.city")}
                  />
                  <Input
                    label="State"
                    {...profileForm.register("address.state")}
                  />
                  <Input
                    label="Country"
                    {...profileForm.register("address.country")}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Input
                    label="Contact Name"
                    placeholder="Full name"
                    {...profileForm.register("emergencyContact.name")}
                  />
                  <Input
                    label="Phone"
                    placeholder="+91 98765 43210"
                    {...profileForm.register("emergencyContact.phone")}
                  />
                  <Input
                    label="Relationship"
                    placeholder="e.g. Spouse, Parent"
                    {...profileForm.register("emergencyContact.relationship")}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={loading}>
                  <Save className="w-4 h-4" /> Save Profile
                </Button>
              </div>
            </form>
          )}

          {/* ── Security Tab ─────────────────────────────── */}
          {activeTab === "security" && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Change Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use a strong password with at least 8 characters, including
                  uppercase, lowercase, numbers and symbols.
                </p>
              </div>

              <form
                onSubmit={pwdForm.handleSubmit(onChangePassword)}
                className="space-y-4"
              >
                {/* Current password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      placeholder="••••••••"
                      {...pwdForm.register("currentPassword", {
                        required: "Required",
                      })}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {pwdForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {pwdForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      placeholder="Min 8 characters"
                      {...pwdForm.register("newPassword", {
                        required: "Required",
                        minLength: { value: 8, message: "Min 8 characters" },
                      })}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {pwdForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {pwdForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      placeholder="Repeat new password"
                      {...pwdForm.register("confirmPassword", {
                        required: "Required",
                      })}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={pwdForm.formState.isSubmitting}
                  className="w-full"
                >
                  <Lock className="w-4 h-4" /> Update Password
                </Button>
              </form>

              {/* Security info */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Account Security
                </h4>
                {[
                  { label: "Employee ID", value: user?.employeeId || "—" },
                  { label: "Role", value: user?.role, badge: true },
                  { label: "Status", value: user?.status, badge: true },
                  {
                    label: "Last Login",
                    value: user?.lastLogin ? formatDate(user.lastLogin) : "—",
                  },
                  { label: "Member Since", value: formatDate(user?.createdAt) },
                ].map(({ label, value, badge }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                    {badge ? (
                      <Badge
                        color={
                          value === "active"
                            ? "green"
                            : value === "admin"
                              ? "purple"
                              : "blue"
                        }
                      >
                        {value}
                      </Badge>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">
                        {value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
