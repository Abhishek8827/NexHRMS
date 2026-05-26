import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft, User, Briefcase, DollarSign, Phone } from "lucide-react";
import {
  createEmployee,
  updateEmployee,
  fetchEmployeeById,
  fetchDepartments,
  clearSelected,
} from "../../features/employees/employeeSlice";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";

// Validation schemas
const createSchema = z.object({
  firstName: z.string().min(2, "Min 2 characters"),
  lastName: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Min 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "hr", "manager", "employee"]),
  designation: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  gender: z.string().optional(),
});

const editSchema = z.object({
  firstName: z.string().min(2, "Min 2 characters"),
  lastName: z.string().min(2, "Min 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "hr", "manager", "employee"]),
  designation: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  gender: z.string().optional(),
  status: z.string().optional(),
});

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 mb-5">
    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  </div>
);

const SelectField = ({ label, required, error, children, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, departments, formLoading } = useSelector(
    (s) => s.employees,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { role: "employee" },
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    if (isEdit) {
      dispatch(fetchEmployeeById(id));
    }
    return () => dispatch(clearSelected());
  }, [dispatch, id, isEdit]);

  // Prefill form for edit
  useEffect(() => {
    if (isEdit && selected) {
      reset({
        firstName: selected.firstName || "",
        lastName: selected.lastName || "",
        phone: selected.phone || "",
        role: selected.role || "employee",
        designation: selected.designation || "",
        department: selected.department?._id || selected.department || "",
        joiningDate: selected.joiningDate
          ? new Date(selected.joiningDate).toISOString().split("T")[0]
          : "",
        basicSalary: selected.basicSalary || 0,
        gender: selected.gender || "",
        status: selected.status || "active",
      });
    }
  }, [selected, isEdit, reset]);

  const onSubmit = async (data) => {
    // Clean empty strings
    Object.keys(data).forEach((k) => {
      if (data[k] === "") delete data[k];
    });

    if (isEdit) {
      const res = await dispatch(updateEmployee({ id, data }));
      if (!res.error) {
        toast.success("Employee updated successfully!");
        navigate("/employees");
      } else {
        toast.error(res.payload || "Update failed");
      }
    } else {
      const res = await dispatch(createEmployee(data));
      if (!res.error) {
        toast.success("Employee created successfully!");
        navigate("/employees");
      } else {
        toast.error(res.payload || "Failed to create employee");
      }
    }
  };

  if (isEdit && formLoading && !selected) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/employees")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Employee" : "Add New Employee"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit
              ? `Updating profile for ${selected?.firstName || ""} ${selected?.lastName || ""}`
              : "Fill in the details to create a new employee account"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <SectionHeader
            icon={User}
            title="Personal Information"
            subtitle="Basic employee details"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="First Name"
              required
              placeholder="John"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last Name"
              required
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
            {!isEdit && (
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="john.doe@company.com"
                error={errors.email?.message}
                {...register("email")}
              />
            )}
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <SelectField
              label="Gender"
              error={errors.gender?.message}
              {...register("gender")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </SelectField>

            {!isEdit && (
              <Input
                label="Password"
                type="password"
                required
                placeholder="Min 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
            )}
          </div>
        </motion.div>

        {/* Work Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <SectionHeader
            icon={Briefcase}
            title="Work Information"
            subtitle="Role, department and designation"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SelectField
              label="Role"
              required
              error={errors.role?.message}
              {...register("role")}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Manager</option>
              <option value="admin">Admin</option>
            </SelectField>

            <SelectField
              label="Department"
              error={errors.department?.message}
              {...register("department")}
            >
              <option value="">No Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </SelectField>

            <Input
              label="Designation"
              placeholder="e.g. Software Engineer"
              error={errors.designation?.message}
              {...register("designation")}
            />

            <Input
              label="Joining Date"
              type="date"
              error={errors.joiningDate?.message}
              {...register("joiningDate")}
            />

            {isEdit && (
              <SelectField
                label="Status"
                error={errors.status?.message}
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-notice">On Notice Period</option>
              </SelectField>
            )}
          </div>
        </motion.div>

        {/* Salary Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <SectionHeader
            icon={DollarSign}
            title="Compensation"
            subtitle="Salary details"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Input
                label="Basic Salary (₹ per month)"
                type="number"
                placeholder="30000"
                error={errors.basicSalary?.message}
                {...register("basicSalary")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                CTC components (HRA, EPF, ESIC) are auto-calculated from basic
                salary
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 pb-6"
        >
          <Button
            type="submit"
            loading={isSubmitting || formLoading}
            className="flex-1 sm:flex-none sm:min-w-[160px]"
          >
            {isEdit ? "Save Changes" : "Create Employee"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/employees")}
          >
            Cancel
          </Button>
        </motion.div>
      </form>
    </div>
  );
};

export default EmployeeForm;
