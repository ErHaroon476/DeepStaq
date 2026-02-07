"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setStatus("error");
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
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl app-surface p-8 shadow-xl border app-border text-center">
        {status === "verifying" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">
              Verifying your email
            </h1>
            <p className="text-sm text-slate-400">
              Please wait while we confirm your email address.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-emerald-400 mb-2">
              Email verified
            </h1>
            <p className="text-sm text-slate-400">
              Redirecting you to your dashboard...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-red-400 mb-2">
              Verification failed
            </h1>
            <p className="text-sm text-slate-400">
              The verification link is invalid or has expired. Request a new
              link from your account.
            </p>
          </>
        )}
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
