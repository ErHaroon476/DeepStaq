import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  FileSpreadsheet,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

export default function GetStartedPage() {
  return (
    <div className="app-shell">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">DeepStaq</div>
              <div className="text-[11px] text-subtle">Inventory & Godown Suite</div>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs">
            <Link
              href="/login"
              className="rounded-lg border app-border app-surface px-3 py-2 hover:bg-slate-200/60"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Create account
            </Link>
          </nav>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-10 md:px-8 md:pb-20 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border app-border app-surface px-3 py-1 text-[11px] text-subtle">
                <ShieldCheck className="h-3.5 w-3.5" />
                Audit-friendly. Multi-godown ready. Fast.
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Get started with a cleaner, smarter inventory workflow.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-subtle md:text-base">
                DeepStaq helps you manage godowns, companies, units, products, and
                daily stock movements with guardrails that prevent mistakes.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border app-border app-surface px-5 py-3 text-sm font-medium hover:bg-slate-200/60"
                >
                  Go to dashboard
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border app-border app-surface p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <PackageCheck className="h-4 w-4 text-indigo-600" />
                    Prevent wrong entries
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Product creation requires company and unit selection.
                  </p>
                </div>
                <div className="rounded-2xl border app-border app-surface p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    Clear reporting
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Monthly/yearly reports with godown-level filtering.
                  </p>
                </div>
                <div className="rounded-2xl border app-border app-surface p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FileSpreadsheet className="h-4 w-4 text-fuchsia-600" />
                    Export ready
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Download CSV, Excel and PDF exports in seconds.
                  </p>
                </div>
                <div className="rounded-2xl border app-border app-surface p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Boxes className="h-4 w-4 text-slate-600" />
                    Organized by godown
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Units, companies, and products stay scoped to each godown.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border app-border app-surface p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase">
                      Setup path
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      Your first godown in 60 seconds
                    </div>
                    <div className="mt-1 text-xs text-subtle">
                      Follow this sequence for a perfect inventory setup.
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-indigo-600/10" />
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  {["Create Godown", "Add Unit Types", "Add Companies", "Add Products", "Record Stock IN/OUT"].map(
                    (t, i) => (
                      <div
                        key={t}
                        className="flex items-center gap-3 rounded-2xl border app-border app-surface p-4"
                        style={{
                          animation: `fadeUp 520ms ease ${(i + 1) * 90}ms both`,
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white">
                          {i + 1}
                        </div>
                        <div className="font-medium">{t}</div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-subtle">
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-600 hover:underline">
                      Login
                    </Link>
                  </div>
                  <Link
                    href="/godowns"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
                  >
                    Open Godowns
                    <ArrowRight className="h-4 w-4" />
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
        </main>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-8">
        <div className="flex flex-col gap-2 rounded-2xl border app-border app-surface px-5 py-4 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} DeepStaq</div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hover:underline">
              Login
            </Link>
            <Link href="/register" className="hover:underline">
              Create account
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
