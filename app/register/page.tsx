"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseSendEmailVerification } from "@/lib/firebase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least 1 uppercase letter")
      .regex(/[0-9]/, "At least 1 number")
      .regex(/[^A-Za-z0-9]/, "At least 1 special character"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password") ?? "";
  const rules = {
    length: passwordValue.length >= 8,
    upper: /[A-Z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
  };
  const strengthScore = Object.values(rules).filter(Boolean).length;
  const strengthPct = (strengthScore / 4) * 100;
  const strengthLabel =
    strengthScore <= 1
      ? "Weak"
      : strengthScore === 2
        ? "Fair"
        : strengthScore === 3
          ? "Good"
          : "Strong";

  useEffect(() => {
    const open = localStorage.getItem("deepstaq_verify_modal_open") === "1";
    const email = localStorage.getItem("deepstaq_verify_pending_email") || "";
    if (open) {
      setVerifyOpen(true);
      setPendingEmail(email);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "deepstaq_email_verified" && e.newValue === "1") {
        localStorage.removeItem("deepstaq_email_verified");
        localStorage.removeItem("deepstaq_verify_modal_open");
        localStorage.removeItem("deepstaq_verify_pending_email");
        setVerifyOpen(false);
        setPendingEmail("");
        router.replace("/login");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const onSubmit = async (values: RegisterValues) => {
    try {
      setSubmitting(true);
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await firebaseSendEmailVerification(cred.user, {
        url: `${appUrl}/verify-email`,
        handleCodeInApp: true,
      });

      localStorage.setItem("deepstaq_verify_modal_open", "1");
      localStorage.setItem("deepstaq_verify_pending_email", values.email);
      setPendingEmail(values.email);
      setVerifyOpen(true);

      await auth.signOut();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/20 to-orange-600/20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Main register container */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
          style={{ animation: "fadeUp 520ms ease both" }}
        >
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-white rounded-full p-3 border border-white/20 shadow-xl">
                  <Logo size="lg" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Create account
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base">
                Join DeepStaq and manage your inventory efficiently
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 to-pink-500/10 border border-purple-500/30 dark:border-purple-500/20 px-4 py-2 text-[11px] text-purple-600 dark:text-purple-300 font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Secure registration</span>
            </div>
          </div>

          {/* Registration form */}
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/10 transition-all duration-200"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/10 transition-all duration-200"
                  placeholder="•••••••••"
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/10 transition-all duration-200"
                  placeholder="•••••••••"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Password strength indicator */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password strength</div>
                <div className={`text-xs font-medium ${
                  strengthScore <= 1
                    ? "text-red-500"
                    : strengthScore === 2
                      ? "text-orange-500"
                      : strengthScore === 3
                        ? "text-indigo-500"
                        : "text-emerald-500"
                }`}>
                  {strengthLabel}
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    strengthScore <= 1
                      ? "bg-red-500"
                      : strengthScore === 2
                        ? "bg-orange-500"
                        : strengthScore === 3
                          ? "bg-indigo-500"
                          : "bg-emerald-500"
                  }`}
                  style={{ width: `${strengthPct}%` }}
                />
              </div>

              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {rules.length ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-slate-600 dark:text-slate-400">8+ characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {rules.upper ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-slate-600 dark:text-slate-400">1 uppercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {rules.number ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-slate-600 dark:text-slate-400">1 number</span>
                </div>
                <div className="flex items-center gap-2">
                  {rules.special ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-slate-600 dark:text-slate-400">1 special character</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
            <span className="text-slate-500 dark:text-slate-400">Already have an account?</span>
            <Link 
              href="/login" 
              className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Email verification modal */}
        {verifyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md">
              <div className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
                {/* Close button */}
                <button
                  onClick={() => {
                    setVerifyOpen(false);
                    localStorage.removeItem("deepstaq_verify_modal_open");
                    localStorage.removeItem("deepstaq_verify_pending_email");
                  }}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Logo and header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                      <div className="relative bg-white rounded-full p-2 border border-white/20 shadow-xl">
                        <Mail className="h-6 w-6 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      Verify your email
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-base">
                      We&apos;ve sent a verification link to
                      {pendingEmail ? (
                        <span className="font-medium text-slate-900 dark:text-white"> {pendingEmail}</span>
                      ) : (
                        " your email"
                      )}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Please check your inbox and click the verification link to continue.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 px-4 py-2 text-[11px] text-emerald-600 dark:text-emerald-300 font-medium backdrop-blur-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Check your email</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What&apos;s next?</h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></div>
                        <span>Open your email inbox</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></div>
                        <span>Click the verification link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></div>
                        <span>Return here to continue</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important</h3>
                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5"></div>
                        <span>Verification link expires in 24 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5"></div>
                        <span>Check your spam folder if needed</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setVerifyOpen(false);
                      localStorage.removeItem("deepstaq_verify_modal_open");
                      localStorage.removeItem("deepstaq_verify_pending_email");
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  >
                    Go to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html:
              "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
          }}
        />
      </div>
    </div>
  );
}

