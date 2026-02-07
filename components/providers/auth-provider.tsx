"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

const publicRoutes = [
  "/login",
  "/register",
  "/verify-email",
  "/reset-password",
  "/get-started",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (!firebaseUser && !publicRoutes.includes(pathname)) {
        router.replace("/login");
      }

      if (
        firebaseUser &&
        !firebaseUser.emailVerified &&
        !publicRoutes.includes(pathname) &&
        pathname !== "/verify-email"
      ) {
        router.replace("/verify-email");
      }

      if (firebaseUser && publicRoutes.includes(pathname) && pathname !== "/get-started") {
        router.replace("/dashboard");
      }
    });

    return () => unsub();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

