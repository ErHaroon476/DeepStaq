import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function GetStartedPage() {
  return (
    <div className="app-shell">
      <div className="relative overflow-hidden">
        {/* Enhanced animated background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/30 to-cyan-600/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl animate-pulse" />
          <div className="absolute right-0 top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/20 to-orange-600/20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>

        {/* Enhanced top-right auth links */}
        <div className="absolute right-0 top-0 z-10 flex items-center gap-3 px-4 py-5 md:px-8">
          <Link
            href="/login"
            className="group relative bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/20 transition-all duration-300"
          >
            <span className="relative z-10">Login</span>
            <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link
            href="/register"
            className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Create account
              <ArrowRight className="h-4 w-4" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Enhanced Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-24 md:px-8 md:pb-20 md:pt-32">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                  <div className="relative bg-white rounded-full p-2">
                    <Logo size="lg" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-white">DeepStaq</div>
                  <div className="text-sm text-slate-300">Inventory & Godown Suite</div>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 px-4 py-2 text-[11px] text-emerald-300 backdrop-blur-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <ShieldCheck className="h-4 w-4" />
                <span className="font-medium">Audit-friendly. Multi-godown ready. Fast.</span>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                Get started with a cleaner, smarter inventory workflow.
              </h1>
              <p className="mt-4 max-w-xl text-slate-300 text-base sm:text-lg leading-relaxed">
                DeepStaq helps you manage godowns, companies, units, products, and
                daily stock movements with guardrails that prevent mistakes.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/dashboard"
                  className="group relative bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl px-8 py-4 font-semibold hover:bg-white/20 transition-all duration-300 text-lg"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Go to dashboard
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 px-3 py-1 text-[11px] text-blue-300 font-medium">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Setup path
                    </div>
                    <div className="mt-2 text-xl font-bold text-white">
                      Your first godown in 60 seconds
                    </div>
                    <div className="mt-1 text-slate-400 text-sm">
                      Follow this sequence for a perfect inventory setup.
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-75"></div>
                    <div className="relative bg-white/20 backdrop-blur rounded-2xl p-3 border border-white/30">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {["Create Godown", "Add Unit Types", "Add Companies", "Add Products", "Record Stock IN/OUT"].map(
                    (t, i) => (
                      <div
                        key={t}
                        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 p-4 transition-all hover:bg-gradient-to-r from-slate-800/70 to-slate-700/70 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1"
                        style={{
                          animation: `fadeUp 520ms ease ${(i + 1) * 90}ms both`,
                        }}
                      >
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-75"></div>
                          <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl h-8 w-8 flex items-center justify-center text-sm font-bold transition-all group-hover:scale-110">
                            {i + 1}
                          </div>
                        </div>
                        <div className="font-semibold text-white">{t}</div>
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced About */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 text-[11px] text-purple-300 backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Built for scale, simplicity, and audit safety</span>
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Why DeepStaq?
            </h2>
            <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              We built DeepStaq for teams that need clarity, guardrails, and speed.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <PackageCheck className="h-6 w-6" />,
                title: "Prevent wrong entries",
                description: "Product creation requires company and unit selection.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                iconBg: "from-blue-500 to-cyan-500",
                borderColor: "border-blue-500/30"
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Clear reporting",
                description: "Monthly/yearly reports with godown-level filtering.",
                gradient: "from-emerald-500/20 to-green-500/20",
                iconBg: "from-emerald-500 to-green-500",
                borderColor: "border-emerald-500/30"
              },
              {
                icon: <FileSpreadsheet className="h-6 w-6" />,
                title: "Export ready",
                description: "Download CSV, Excel and PDF exports in seconds.",
                gradient: "from-purple-500/20 to-pink-500/20",
                iconBg: "from-purple-500 to-pink-500",
                borderColor: "border-purple-500/30"
              },
              {
                icon: <Boxes className="h-6 w-6" />,
                title: "Organized by godown",
                description: "Units, companies, and products stay scoped to each godown.",
                gradient: "from-rose-500/20 to-orange-500/20",
                iconBg: "from-rose-500 to-orange-500",
                borderColor: "border-rose-500/30"
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Audit-friendly",
                description: "Every movement is logged with timestamps and user context.",
                gradient: "from-amber-500/20 to-yellow-500/20",
                iconBg: "from-amber-500 to-yellow-500",
                borderColor: "border-amber-500/30"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Fast",
                description: "Lightweight UI, instant search, and batch operations.",
                gradient: "from-red-500/20 to-pink-500/20",
                iconBg: "from-red-500 to-pink-500",
                borderColor: "border-red-500/30"
              },
            ].map(({ icon, title, description, gradient, iconBg, borderColor }, i) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl"
                style={{
                  animation: `fadeUp 520ms ease ${(i + 1) * 70}ms both`,
                }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-1000">
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
                
                <div className="relative">
                  <div className="mb-4">
                    <div className={`relative inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br ${iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                      <div className="relative text-white z-10">
                        {icon}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 text-lg font-bold text-white">{title}</div>
                  <div className="text-slate-300 text-sm leading-relaxed">{description}</div>
                </div>
                
                {/* Decorative corner elements */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{animationDelay: '0.2s'}}></div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Features showcase */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 px-4 py-2 text-[11px] text-emerald-300 backdrop-blur-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Features built for real workflows</span>
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              From multi-godown to audit trails, DeepStaq covers the essentials.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {[
              {
                title: "Multi-godown support",
                description: "Run multiple warehouses with isolated data and unified reporting.",
                icon: <Boxes className="h-5 w-5" />,
                bullets: ["Isolated units per godown", "Company-scoped products", "Unified dashboard"],
                gradient: "from-blue-500/20 to-cyan-500/20",
                iconBg: "from-blue-500 to-cyan-500",
                borderColor: "border-blue-500/30"
              },
              {
                title: "Audit-safe stock movements",
                description: "Every IN/OUT is logged with user, timestamp, and godown context.",
                icon: <ShieldCheck className="h-5 w-5" />,
                bullets: ["Immutable logs", "User attribution", "Exportable trails"],
                gradient: "from-emerald-500/20 to-green-500/20",
                iconBg: "from-emerald-500 to-green-500",
                borderColor: "border-emerald-500/30"
              },
              {
                title: "Bulk operations",
                description: "Add products, units, or companies in bulk via CSV/Excel.",
                icon: <FileSpreadsheet className="h-5 w-5" />,
                bullets: ["CSV import", "Excel import", "Template downloads"],
                gradient: "from-purple-500/20 to-pink-500/20",
                iconBg: "from-purple-500 to-pink-500",
                borderColor: "border-purple-500/30"
              },
              {
                title: "Role-aware access",
                description: "Admins, managers, and viewers with scoped permissions.",
                icon: <Users className="h-5 w-5" />,
                bullets: ["Role-based UI", "Godown-level access", "Read-only mode"],
                gradient: "from-amber-500/20 to-yellow-500/20",
                iconBg: "from-amber-500 to-yellow-500",
                borderColor: "border-amber-500/30"
              },
            ].map(({ title, description, icon, bullets, gradient, iconBg, borderColor }, i) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl"
                style={{
                  animation: `fadeUp 520ms ease ${(i + 1) * 80}ms both`,
                }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`relative inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br ${iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                      <div className="relative text-white z-10">
                        {icon}
                      </div>
                    </div>
                    <div className="font-bold text-white text-lg">{title}</div>
                  </div>
                  <div className="mb-4 text-slate-300 text-sm leading-relaxed">{description}</div>
                  <ul className="space-y-2">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur-sm"></div>
                          <div className="relative bg-emerald-500 rounded-full p-1">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <span className="text-slate-300 text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Decorative corner elements */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{animationDelay: '0.2s'}}></div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 p-8 text-center shadow-2xl backdrop-blur-xl">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl"></div>
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 px-4 py-2 text-[11px] text-rose-300 backdrop-blur-sm">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
                <Zap className="h-4 w-4" />
                <span className="font-medium">Ready to get started?</span>
              </div>
              <h2 className="mb-4 text-3xl sm:text-4xl font-black tracking-tight text-white">
                Set up your first godown in under a minute
              </h2>
              <p className="mb-8 text-slate-300 text-base sm:text-lg">
                No credit card required. Free for small teams.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/register"
                  className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/godowns"
                  className="group relative bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl px-8 py-4 font-semibold hover:bg-white/20 transition-all duration-300 text-lg"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Open Godowns
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
              <div className="text-slate-400 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 px-6 py-4 text-slate-300 backdrop-blur-sm">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>© {new Date().getFullYear()} DeepStaq</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/login" className="hover:text-blue-400 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  Create account
                </Link>
                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Developed by Haroon Nasim</span>
                </div>
                <a 
                  href="mailto:haroonnasim033@gmail.com" 
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  haroonnasim033@gmail.com
                </a>
                <a 
                  href="https://haroon-nasim.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  haroon-nasim.netlify.app
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
        }}
      />
    </div>
  );
}
