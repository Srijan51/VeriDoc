"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import React, { useEffect } from "react";

const AUTH_ROUTES = ["/login", "/register"];

export default function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    // Not logged in and not on an auth page → redirect to login
    if (!user && !isAuthPage) {
      router.replace("/login");
    }

    // Logged in and on an auth page → redirect to home
    if (user && isAuthPage) {
      router.replace("/");
    }
  }, [user, isLoading, isAuthPage, router]);

  // Loading state — show a subtle loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="auth-spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--accent-mint)" }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Auth pages (login/register) — no sidebar, full screen
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Not authenticated and not on auth page — will redirect, show nothing
  if (!user) {
    return null;
  }

  // Authenticated — show full layout with sidebar
  return (
    <div className="flex min-h-screen w-full">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col ml-[240px] relative">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
