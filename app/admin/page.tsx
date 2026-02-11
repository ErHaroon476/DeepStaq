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
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
});

type UserValues = z.infer<typeof userSchema>;

interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
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
        body: JSON.stringify(values),
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
          ...values,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You need admin privileges to access this page.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Admin Access Required:</strong>
            </p>
            <p className="text-sm text-blue-700">
              Please log in with your admin account to access this page.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {editingUser ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {editingUser ? "Edit User" : "Create User"}
              </h2>

              <form
                onSubmit={handleSubmit(editingUser ? handleUpdateUser : handleCreateUser)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      defaultValue={editingUser?.email}
                      {...register("email")}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser && "(leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({filteredUsers.length})
                  </h2>
                  <button
                    onClick={fetchUsers}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search users..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          {users.length === 0 ? "No users found" : "No users match your search"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.emailVerified
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {user.emailVerified ? "Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.metadata.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString()
                              : "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                reset({ email: user.email });
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.uid)}
                              className="text-red-600 hover:text-red-900"
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
