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
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    icon: Shield,
    email: "admin@nexhr.com",
    password: "Admin@123456",
    desc: "Full access",
    color:
      "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40",
  },
  {
    role: "HR",
    icon: Users,
    email: "hr@nexhr.com",
    password: "Hr@123456",
    desc: "HR management",
    color:
      "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
  },
  {
    role: "Manager",
    icon: Briefcase,
    email: "manager@nexhr.com",
    password: "Manager@123456",
    desc: "Team management",
    color:
      "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/40",
  },
  {
    role: "Employee",
    icon: User,
    email: "employee@nexhr.com",
    password: "Employee@123456",
    desc: "Self-service",
    color:
      "border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/40",
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

  const onSubmit = (data) => dispatch(loginUser(data));

  const fillDemo = (email, password) => {
    setValue("email", email);
    setValue("password", password);
    toast.success("Credentials filled — click Sign In", { duration: 1500 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex items-start gap-8 py-8">
        {/* ── Left: Login Form ─────────────────────────────── */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              NexHR
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Enterprise HR Management System
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Sign in to continue to NexHR
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
                Sign In to NexHR
              </Button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            © {new Date().getFullYear()} NexHR. All rights reserved.
          </p>
        </div>

        {/* ── Right: Demo Credentials ──────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 max-w-xs">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="text-white font-semibold text-base">
                Demo Accounts
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Click any account to auto-fill credentials
              </p>
            </div>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${acc.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 ${acc.iconBg}`}
                    >
                      <acc.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${acc.badge}`}
                        >
                          {acc.role}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {acc.desc}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {acc.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4 pt-4 border-t border-white/10">
              ⓘ All demo accounts are pre-configured
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
