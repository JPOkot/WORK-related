"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";

interface LDAPUser {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: "initiator" | "approver" | "admin" | "auditor";
  department: string;
}

// Dummy LDAP users for simulation
const LDAP_USERS: LDAPUser[] = [
  { userId: "u001", username: "sarah.johnson", fullName: "Sarah Johnson", email: "sarah.johnson@company.com", role: "initiator", department: "Human Resources" },
  { userId: "u002", username: "michael.chen", fullName: "Michael Chen", email: "michael.chen@company.com", role: "approver", department: "IT" },
  { userId: "u003", username: "emily.rodriguez", fullName: "Emily Rodriguez", email: "emily.rodriguez@company.com", role: "approver", department: "Finance" },
  { userId: "u004", username: "james.okafor", fullName: "James Okafor", email: "james.okafor@company.com", role: "approver", department: "Security" },
  { userId: "u005", username: "linda.patel", fullName: "Linda Patel", email: "linda.patel@company.com", role: "admin", department: "Administration" },
  { userId: "u006", username: "david.kim", fullName: "David Kim", email: "david.kim@company.com", role: "auditor", department: "Compliance" },
  { userId: "u007", username: "anna.williams", fullName: "Anna Williams", email: "anna.williams@company.com", role: "approver", department: "Human Resources" },
  { userId: "u008", username: "john.doe", fullName: "John Doe", email: "john.doe@company.com", role: "initiator", department: "Engineering" },
  { userId: "u009", username: "jane.smith", fullName: "Jane Smith", email: "jane.smith@company.com", role: "initiator", department: "Marketing" },
  { userId: "u010", username: "admin", fullName: "System Admin", email: "admin@company.com", role: "admin", department: "IT" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate LDAP authentication delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // LDAP simulation - find user by username
    const ldapUser = LDAP_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!ldapUser) {
      setError("Invalid username or password. User not found in LDAP.");
      setIsLoading(false);
      return;
    }

    // For simulation, accept any password or use "password" as default
    if (!password || password.length < 1) {
      setError("Please enter a password.");
      setIsLoading(false);
      return;
    }

    // Simulate successful LDAP authentication
    login(ldapUser);
    setIsLoading(false);
    router.push("/");
  };

  // If already logged in, redirect to home
  if (isAuthenticated && currentUser) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00aDJ2MmgtMnYtMnptLTQgNHYyaC0ydi0yaDJ6bTQtOGgydjJoLTJ2LTJ6bS04IDhoMnYyaC0ydi0yek0zMiAzNnYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
      
      <div className="relative w-full max-w-md px-6 py-12">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">ExitFlow</h1>
            <p className="text-slate-400 mt-2">Sign in with LDAP credentials</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="e.g., john.doe"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 1.135 3.042 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* LDAP Info */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center mb-3">Demo LDAP Users (any password works)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/30 rounded-lg p-2">
                <span className="text-blue-400 font-medium">sarah.johnson</span>
                <p className="text-slate-500">Initiator (HR)</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-2">
                <span className="text-blue-400 font-medium">michael.chen</span>
                <p className="text-slate-500">Approver (IT)</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-2">
                <span className="text-blue-400 font-medium">linda.patel</span>
                <p className="text-slate-500">Admin</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-2">
                <span className="text-blue-400 font-medium">david.kim</span>
                <p className="text-slate-500">Auditor</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-2 col-span-2">
                <span className="text-blue-400 font-medium">john.doe / jane.smith</span>
                <p className="text-slate-500">Initiator (Employee)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
