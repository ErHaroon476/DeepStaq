"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out");
      router.replace("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="sidebar-link flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </button>
  );
}

