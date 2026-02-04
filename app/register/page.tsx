"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseSendEmailVerification } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

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

      toast.success("Account created. Check your email to verify.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl app-surface p-8 shadow-xl border app-border">
        <h1 className="text-2xl font-semibold mb-2">
          Create DeepStaq Account
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Start managing godowns, products, and stock with audit-safe tracking.
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
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <Link href="/login" className="hover:text-slate-200">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}

