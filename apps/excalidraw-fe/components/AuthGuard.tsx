"use client";

import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Check if we should redirect the user
    if (!isLoading) {
      const publicRoute = isPublicRoute(pathname);
      
      if (!isAuthenticated && !publicRoute) {
        // Redirect unauthenticated users away from protected routes
        router.push("/signin");
      } else {
        // Otherwise, render the content
        setShouldRender(true);
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading...</h1>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show nothing until we've decided whether to redirect or render
  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

// List of routes that don't require authentication
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ["/", "/signin", "/signup"];
  return publicRoutes.includes(pathname);
} 