"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { auth, firebaseSendPasswordResetEmail } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const resetSchema = z.object({
  email: z.string().email(),
});

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (values: ResetValues) => {
    try {
      setSubmitting(true);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await firebaseSendPasswordResetEmail(auth, values.email, {
        url: `${appUrl}/login`,
        handleCodeInApp: true,
      });
      
      setPendingEmail(values.email);
      setEmailSent(true);
      toast.success("Password reset email sent successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-600/20 to-orange-600/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/20 to-pink-600/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Main reset password container */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
          style={{ animation: "fadeUp 520ms ease both" }}
        >
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-white rounded-full p-3 border border-white/20 shadow-xl">
                  <Logo size="lg" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Reset password
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base">
                Enter your email and we&apos;ll send you a password reset link
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 to-orange-500/10 border border-amber-500/30 dark:border-amber-500/20 px-4 py-2 text-[11px] text-amber-600 dark:text-amber-300 font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span>Secure recovery</span>
            </div>
          </div>

          {!emailSent ? (
            <>
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
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/10 transition-all duration-200"
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:transform-none"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send reset link
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
                <Link 
                  href="/login" 
                  className="font-medium hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                  <div className="relative bg-white rounded-full p-4 border border-white/20 shadow-xl">
                    <Mail className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Check your email
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-base">
                  We&apos;ve sent a password reset link to
                  <span className="font-medium text-slate-900 dark:text-white"> {pendingEmail}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Click the link in the email to reset your password
                </p>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">What&apos;s next?</h4>
                <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                  <li>Open your email inbox</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important</h4>
                <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                  <li>Reset link expires in 1 hour</li>
                  <li>Check spam folder if needed</li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  Go to login
                </Link>
              </div>
            </div>
          )}
        </div>

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
