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
} from "lucide-react";

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
    } catch (err: any) {
      toast.error(err?.message || "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-md rounded-2xl app-surface p-8 shadow-xl border app-border"
        style={{ animation: "fadeUp 520ms ease both" }}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Create account</h1>
            <p className="mt-1 text-sm text-subtle">
              Secure sign-up for your inventory workspace.
            </p>
          </div>
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="email"
                className="w-full rounded-lg border app-border app-surface pl-10 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="you@company.com"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="password"
                className="w-full rounded-lg border app-border app-surface pl-10 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Re-type password
            </label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="password"
                className="w-full rounded-lg border app-border app-surface pl-10 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border app-border app-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium">Password strength</div>
              <div className="text-[11px] text-subtle">{strengthLabel}</div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
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

            <div className="mt-3 grid gap-1 text-[11px] text-subtle">
              <div className="flex items-center gap-2">
                {rules.length ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>8+ characters</span>
              </div>
              <div className="flex items-center gap-2">
                {rules.upper ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>1 uppercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                {rules.number ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>1 number</span>
              </div>
              <div className="flex items-center gap-2">
                {rules.special ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>1 special character</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition active:scale-[0.99] hover:bg-indigo-600 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <Link href="/login" className="hover:text-slate-200">
            Already have an account? Login
          </Link>
        </div>
      </div>

      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl app-surface p-6 shadow-2xl border app-border">
            <h2 className="text-lg font-semibold">Verify your email</h2>
            <p className="mt-2 text-sm text-subtle">
              We’ve sent a verification link to
              {pendingEmail ? (
                <span className="font-medium"> {pendingEmail}</span>
              ) : (
                " your email"
              )}
              . Please check your inbox.
            </p>
            <p className="mt-2 text-xs text-subtle">
              The link expires in 24 hours.
            </p>

            <div className="mt-5 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setVerifyOpen(false);
                  localStorage.removeItem("deepstaq_verify_modal_open");
                }}
                className="rounded-lg border app-border app-surface px-3 py-2 hover:bg-slate-200/60"
              >
                Close
              </button>
              <Link
                href="/login"
                className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Go to login
              </Link>
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
  );
}

