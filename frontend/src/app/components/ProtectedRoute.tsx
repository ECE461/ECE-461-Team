// app/components/ProtectedRoute.tsx

"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated ,authChecked,authToken} = useAuth();



  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/"); // Redirect to login only after auth check is complete
    }
  }, [isAuthenticated, authChecked, router]);

  console.log("authChecked", authChecked);
  console.log("isAuthenticated", isAuthenticated);
  console.log("authToken", authToken);
  if (!authChecked) return null;
  return <>{children}</>;
};

export default ProtectedRoute;
