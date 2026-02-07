"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Lock, LogIn, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
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
    } catch (err: any) {
      toast.error(err?.message || "Failed to login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setSubmitting(true);
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in with Google");
    } catch (err: any) {
      toast.error(err?.message || "Google login failed");
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
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-subtle">
              Sign in to your inventory workspace.
            </p>
          </div>
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <LogIn className="h-5 w-5" />
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

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center rounded-lg border app-border app-surface px-4 py-2 text-sm font-medium hover:bg-slate-100/50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-subtle">
          <Link href="/register" className="hover:underline">
            Create account
          </Link>
          <Link href="/reset-password" className="hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}

