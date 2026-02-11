"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import {
  Mail,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function RegisterPage() {

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

          {/* Admin contact information */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <Mail className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Account Registration
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                To create an account, please contact our administrator at:
              </p>
              <a
                href="mailto:haroonnasim033@gmail.com"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Mail className="h-4 w-4" />
                Email Admin: haroonnasim033@gmail.com
              </a>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-3">
                We'll set up your account and send you login credentials
              </p>
            </div>
          </div>

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

