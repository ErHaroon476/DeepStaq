"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Search,
  RefreshCw,
  Crown,
  UserCheck,
  Activity,
  TrendingUp,
  AlertCircle,
  Database,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).default('user'),
});

type UserValues = z.infer<typeof userSchema>;

interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role?: 'admin' | 'user';
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
  });

  // Check admin authentication
  useEffect(() => {
    const checkAuth = () => {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (!adminEmail) {
        toast.error("Admin credentials not configured");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check if current user is authenticated and is admin
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user && user.email === adminEmail) {
          setIsAuthenticated(true);
          fetchUsers();
        } else {
          setIsAuthenticated(false);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = checkAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        toast.error("Admin credentials not configured");
        return;
      }

      const credentials = Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        toast.success("Users loaded successfully");
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const handleCreateUser = async (values: UserValues) => {
    if (!values.password) {
      toast.error("Password is required for new users");
      return;
    }

    setSubmitting(true);
    try {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        toast.error("Admin credentials not configured");
        return;
      }

      const credentials = Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          role: values.role
        }),
      });

      if (response.ok) {
        toast.success("User created successfully");
        reset();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (values: UserValues) => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        toast.error("Admin credentials not configured");
        return;
      }

      const credentials = Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          uid: editingUser.uid,
          email: values.email,
          password: values.password,
          role: values.role
        }),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setEditingUser(null);
        reset();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        toast.error("Admin credentials not configured");
        return;
      }

      const credentials = Buffer.from(`${adminEmail}:${adminPassword}`).toString('base64');
      const response = await fetch(`/api/admin/users?uid=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate KPIs
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const recentUsers = users.filter(u => {
    if (!u.metadata.creationTime) return false;
    const creationDate = new Date(u.metadata.creationTime);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return creationDate > thirtyDaysAgo;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 mb-6 inline-block">
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
            <Shield className="h-16 w-16 text-red-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-slate-300 mb-6 text-lg">
            You need admin privileges to access this page.
          </p>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
            <p className="text-sm text-blue-300 mb-3 font-semibold">
              <Shield className="h-4 w-4 inline mr-2" />
              Admin Access Required
            </p>
            <p className="text-sm text-slate-400">
              Please log in with your admin account to access this page.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-emerald-600/10 rounded-3xl"></div>
        <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-b border-slate-700/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 shadow-lg shadow-violet-500/25">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                  <Crown className="h-8 w-8 text-violet-400 relative z-10" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    Admin Command Center
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base lg:text-lg mt-1">
                    Complete system control and user management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl px-4 py-2 border border-violet-500/30">
                  <span className="text-violet-300 text-sm font-medium">Super Admin</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-700/50 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards Section */}
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            {
              label: "Total Accounts",
              value: totalUsers,
              accent: "from-violet-500/20 via-violet-500/0 to-transparent",
              icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-violet-500 to-purple-600",
              iconColor: "text-white",
              glow: "shadow-violet-500/25",
              change: "+12%",
              changeType: "positive"
            },
            {
              label: "Verified Users",
              value: verifiedUsers,
              accent: "from-emerald-500/20 via-emerald-500/0 to-transparent",
              icon: <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-emerald-500 to-green-600",
              iconColor: "text-white",
              glow: "shadow-emerald-500/25",
              change: "+8%",
              changeType: "positive"
            },
            {
              label: "Admin Users",
              value: adminUsers,
              accent: "from-amber-500/20 via-amber-500/0 to-transparent",
              icon: <Crown className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-amber-500 to-orange-600",
              iconColor: "text-white",
              glow: "shadow-amber-500/25",
              change: "0%",
              changeType: "neutral"
            },
            {
              label: "New Users (30d)",
              value: recentUsers,
              accent: "from-blue-500/20 via-blue-500/0 to-transparent",
              icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-blue-500 to-cyan-600",
              iconColor: "text-white",
              glow: "shadow-blue-500/25",
              change: "+25%",
              changeType: "positive"
            },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-4 sm:p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-30 transition-opacity duration-1000">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${kpi.iconBg} shadow-lg ${kpi.glow} group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl animate-pulse"></div>
                      <div className={`relative ${kpi.iconColor} z-10`}>
                        {kpi.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 font-medium tracking-wide text-xs sm:text-sm uppercase truncate">{kpi.label}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] sm:text-[11px] text-slate-500">Live Data</span>
                      </div>
                    </div>
                  </div>
                  <p className="relative text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {kpi.value.toLocaleString()}
                  </p>
                  
                  {/* Trend indicator */}
                  <div className="mt-3 sm:mt-4 flex items-center gap-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                      kpi.changeType === 'positive' ? 'bg-emerald-500/20 border-emerald-500/30' :
                      kpi.changeType === 'negative' ? 'bg-red-500/20 border-red-500/30' :
                      'bg-slate-500/20 border-slate-500/30'
                    } border`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        kpi.changeType === 'positive' ? 'bg-emerald-400' :
                        kpi.changeType === 'negative' ? 'bg-red-400' :
                        'bg-slate-400'
                      } animate-pulse`}></div>
                      <span className={`text-[10px] font-medium ${
                        kpi.changeType === 'positive' ? 'text-emerald-400' :
                        kpi.changeType === 'negative' ? 'text-red-400' :
                        'text-slate-400'
                      }`}>{kpi.change}</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-slate-600 to-transparent flex-1"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Add fadeInUp animation */}
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Form */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                  {editingUser ? <Edit className="h-5 w-5 text-blue-400 relative z-10" /> : <UserPlus className="h-5 w-5 text-blue-400 relative z-10" />}
                </div>
                {editingUser ? "Edit User" : "Create User"}
              </h2>

              <form
                onSubmit={handleSubmit(editingUser ? handleUpdateUser : handleCreateUser)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      defaultValue={editingUser?.email}
                      {...register("email")}
                      className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/70 transition-all duration-200"
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password {editingUser && "(leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/70 transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    User Role
                  </label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      defaultValue={editingUser?.role || 'user'}
                      {...register("role")}
                      className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/70 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="user" className="bg-slate-800">Regular User</option>
                      <option value="admin" className="bg-slate-800">Administrator</option>
                    </select>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02]"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Saving..." : editingUser ? "Update" : "Create"}
                  </button>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        reset();
                      }}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700/70 transition-all duration-200"
                    >
                      <X className="h-4 w-4 text-slate-300" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="relative p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                      <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                      <Users className="h-5 w-5 text-emerald-400 relative z-10" />
                    </div>
                    Users ({filteredUsers.length})
                  </h2>
                  <button
                    onClick={fetchUsers}
                    className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/70 transition-all duration-200"
                    placeholder="Search users..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          {users.length === 0 ? "No users found" : "No users match your search"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-slate-700/30 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                user.role === 'admin'
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              }`}
                            >
                              {user.role === 'admin' ? (
                                <div className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" />
                                  Admin
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  User
                                </div>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                user.emailVerified
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  user.emailVerified ? 'bg-emerald-400' : 'bg-yellow-400'
                                } animate-pulse`}></div>
                                {user.emailVerified ? "Verified" : "Pending"}
                              </div>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {user.metadata.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString()
                              : "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                reset({ email: user.email, role: user.role || 'user' });
                              }}
                              className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.uid)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
