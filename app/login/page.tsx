"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Lock, LogIn, Mail, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setSubmitting(true);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast.success("Logged in");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to login");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/20 to-orange-600/20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Main login container */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
          style={{ animation: "fadeUp 520ms ease both" }}
        >
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-white rounded-full p-3 border border-white/20 shadow-xl">
                  <Logo size="lg" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base">
                Sign in to your inventory workspace
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 to-cyan-500/10 border border-blue-500/30 dark:border-blue-500/20 px-4 py-2 text-[11px] text-blue-600 dark:text-blue-300 font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Secure authentication</span>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 transition-all duration-200"
                  placeholder="you@company.com"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 transition-all duration-200"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <Link 
              href="/register" 
              className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Create account
            </Link>
            <button
              onClick={() => {
                toast.success("Please contact admin at haroonnasim033@gmail.com for password reset");
                window.location.href = "mailto:haroonnasim033@gmail.com?subject=Password Reset Request";
              }}
              className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Admin contact info */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
              <Mail className="h-4 w-4" />
              <span>Need help? Contact admin at </span>
              <a
                href="mailto:haroonnasim033@gmail.com"
                className="font-medium hover:underline"
              >
                haroonnasim033@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
        }}
      />
    </div>
  );
}

