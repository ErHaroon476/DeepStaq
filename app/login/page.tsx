"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

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
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl app-surface p-8 shadow-xl border app-border">
        <h1 className="text-2xl font-semibold mb-2">DeepStaq Login</h1>
        <p className="text-sm text-slate-500 mb-6">
          Sign in to manage your godowns, products, and stock.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="you@company.com"
              {...register("email")}
            />
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
            <input
              type="password"
              className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
              {...register("password")}
            />
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

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <Link href="/register" className="hover:text-slate-200">
            Create account
          </Link>
          <Link href="/reset-password" className="hover:text-slate-200">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}

