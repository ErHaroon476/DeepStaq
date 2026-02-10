"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/logo";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setTimeout(() => setStatus("error"), 0);
      return;
    }

    async function verify() {
      try {
        const code = oobCode as string;
        await checkActionCode(auth, code);
        await applyActionCode(auth, code);
        try {
          localStorage.setItem("deepstaq_email_verified", "1");
          localStorage.removeItem("deepstaq_verify_modal_open");
          localStorage.removeItem("deepstaq_verify_pending_email");
        } catch {}
        setStatus("success");
        toast.success("Email verified. You can now sign in.");
        setTimeout(() => router.replace("/login"), 1500);
      } catch {
        setStatus("error");
        toast.error("Verification link is invalid or expired.");
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-amber-600/20 to-orange-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/20 to-pink-600/20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Main verification container */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className="relative bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/90 rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
          style={{ animation: "fadeUp 520ms ease both" }}
        >
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-white rounded-full p-3 border border-white/20 shadow-xl">
                  <Logo size="lg" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Email Verification
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base">
                {status === "verifying" && "Verifying your email address"}
                {status === "success" && "Email successfully verified"}
                {status === "error" && "Verification failed"}
              </p>
            </div>
          </div>

          {/* Status content */}
          <div className="text-center space-y-6">
            {status === "verifying" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                    <div className="relative bg-white rounded-full p-4 border border-white/20 shadow-xl">
                      <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 px-4 py-2 text-[11px] text-emerald-600 dark:text-emerald-300 font-medium backdrop-blur-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Verifying email...</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Please wait while we confirm your email address
                  </p>
                  <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">What&apos;s happening?</h3>
                    <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                      <li>Validating verification link</li>
                      <li>Confirming email address</li>
                      <li>Activating your account</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                    <div className="relative bg-white rounded-full p-4 border border-white/20 shadow-xl">
                      <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 px-4 py-2 text-[11px] text-emerald-600 dark:text-emerald-300 font-medium backdrop-blur-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Verification successful</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Your email has been successfully verified
                  </p>
                  <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">What&apos;s next?</h3>
                    <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                      <li>✓ Email verified successfully</li>
                      <li>✓ Account activated</li>
                      <li>✓ Redirecting to login...</li>
                    </ul>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="text-sm font-medium">Redirecting to login...</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-rose-400 rounded-full blur-lg opacity-75"></div>
                    <div className="relative bg-white rounded-full p-4 border border-white/20 shadow-xl">
                      <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 dark:bg-red-500/10 border border-red-500/30 dark:border-red-500/20 px-4 py-2 text-[11px] text-red-600 dark:text-red-300 font-medium backdrop-blur-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Verification failed</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    The verification link is invalid or has expired
                  </p>
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">What went wrong?</h3>
                    <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                      <li>✗ Verification link expired</li>
                      <li>✗ Link already used</li>
                      <li>✗ Invalid verification code</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Solution</h3>
                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                      <li>Request a new verification email</li>
                      <li>Check your spam folder</li>
                      <li>Contact support if issues persist</li>
                    </ul>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => router.replace("/register")}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Back to register
                    </button>
                    <button
                      onClick={() => router.replace("/login")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                    >
                      Go to login
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
