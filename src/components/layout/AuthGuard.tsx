"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Sidebar from "./Sidebar";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const pathname = usePathname();

  // Allow access to login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // If not authenticated, show a simple loading state
  // The login page should be used
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  // Authenticated - show the app with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
