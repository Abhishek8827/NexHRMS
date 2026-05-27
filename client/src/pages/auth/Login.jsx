import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import {
  Building2,
  Mail,
  Lock,
  Shield,
  Users,
  Briefcase,
  User,
} from "lucide-react";
import { loginUser, clearError } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Demo credentials for the side panel
const DEMO_USERS = [
  {
    role: "Admin",
    icon: Shield,
    email: "admin@nexhr.com",
    password: "Admin@123456",
    color:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600 bg-purple-100 dark:bg-purple-900/40",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    desc: "Full system access",
  },
  {
    role: "HR Manager",
    icon: Users,
    email: "hr@nexhr.com",
    password: "Hr@123456",
    color:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/40",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    desc: "HR & payroll access",
  },
  {
    role: "Manager",
    icon: Briefcase,
    email: "manager@nexhr.com",
    password: "Manager@123456",
    color:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    iconColor: "text-green-600 bg-green-100 dark:bg-green-900/40",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    desc: "Team management",
  },
  {
    role: "Employee",
    icon: User,
    email: "employee@nexhr.com",
    password: "Employee@123456",
    color:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 bg-orange-100 dark:bg-orange-900/40",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    desc: "Self-service access",
  },
];

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  // Quick fill from demo panel
  const fillCredentials = (email, password) => {
    setValue("email", email);
    setValue("password", password);
    toast.success("Credentials filled — click Sign In", { duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex items-center gap-8">
        {/* Left — Login Form */}
        <div className="flex-1 max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">NexHR</h1>
            <p className="text-slate-300 mt-1 text-sm">
              Enterprise HR Management System
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Sign in to your account to continue
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                required
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                required
                error={errors.password?.message}
                {...register("password")}
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            © 2025 NexHR. All rights reserved.
          </p>
        </div>

        {/* Right — Demo Credentials Panel */}
        <div className="hidden lg:block flex-1 max-w-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="text-center mb-5">
              <p className="text-white font-semibold text-base">
                Demo Credentials
              </p>
              <p className="text-slate-300 text-xs mt-1">
                Click any card to auto-fill login
              </p>
            </div>

            <div className="space-y-3">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.role}
                  onClick={() => fillCredentials(u.email, u.password)}
                  className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg ${u.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${u.iconColor}`}
                    >
                      <u.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.badge}`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                        {u.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        {u.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-xs text-slate-300 text-center">
                ⓘ Password for all demo accounts:
                <span className="font-mono text-white ml-1">
                  see above cards
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
