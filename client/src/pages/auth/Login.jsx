import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { loginUser, clearError } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Orb = ({ className }) => (
  <div
    className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`}
  />
);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950" />

      {/* Floating orbs */}
      <Orb className="w-96 h-96 bg-indigo-500 top-[-10%] left-[-5%]" />
      <Orb className="w-80 h-80 bg-violet-600 bottom-[-5%] right-[-5%]" />
      <Orb className="w-64 h-64 bg-blue-500 top-[40%] right-[10%]" />
      <Orb className="w-48 h-48 bg-purple-500 bottom-[20%] left-[5%]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Logo */}
          <motion.div variants={item} className="text-center">
            <div className="relative inline-flex mb-5">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <Sparkles
                className="absolute -top-2 -right-2 w-5 h-5 text-indigo-300 animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                NexHR
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">
              Enterprise HR Management System
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={item}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-sm" />
            <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Sign in with your company credentials
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      {...register("email")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.08] border border-white/10
                        text-white placeholder:text-slate-500 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        hover:bg-white/[0.12] transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.08] border border-white/10
                        text-white placeholder:text-slate-500 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                        hover:bg-white/[0.12] transition-all"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4
                    bg-gradient-to-r from-indigo-600 to-violet-600
                    hover:from-indigo-500 hover:to-violet-500
                    text-white font-semibold text-sm rounded-xl
                    shadow-lg shadow-indigo-500/30 transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={item} className="text-center space-y-1">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} NexHR. All rights reserved.
            </p>
            <p className="text-xs font-medium">
              <span className="text-slate-600">Developed by </span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                Abhishek Wani &amp; Group
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
