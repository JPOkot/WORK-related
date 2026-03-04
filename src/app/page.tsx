"use client";

import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import TopBar from "@/components/layout/TopBar";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  getExitTypeLabel,
  getExitTypeColor,
  formatDate,
  formatDateTime,
  isOverdue,
} from "@/lib/workflowEngine";

export default function DashboardPage() {
  const { requests, getDashboardStats, currentUser } = useApp();
  const stats = getDashboardStats();

  const recentRequests = requests.slice(0, 5);
  const pendingRequests = requests.filter(
    (r) => r.status !== "completed" && r.status !== "rejected" && r.status !== "draft"
  );

  const statCards = [
    {
      label: "Total Requests",
      value: stats.totalRequests,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      label: "Completed (This Month)",
      value: stats.completedThisMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
    },
    {
      label: "Rejected (This Month)",
      value: stats.rejectedThisMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Dashboard" />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Welcome back, {currentUser.fullName.split(" ")[0]} 👋
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                {pendingRequests.length > 0
                  ? `You have ${pendingRequests.length} request${pendingRequests.length !== 1 ? "s" : ""} awaiting approval.`
                  : "All requests are up to date."}
              </p>
            </div>
            <Link
              href="/requests/new"
              className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <span className={card.text}>{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Requests</h3>
              <Link href="/requests" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentRequests.map((req) => (
                <Link
                  key={req.requestId}
                  href={`/requests/${req.requestId}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {req.employeeName}
                      </p>
                      {isOverdue(req) && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getExitTypeColor(req.exitType)}`}>
                        {getExitTypeLabel(req.exitType)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(req.initiatedDate)}</span>
                    </div>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </Link>
              ))}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Pending Actions</h3>
              <Link href="/approvals" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingRequests.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">All caught up!</p>
                </div>
              ) : (
                pendingRequests.slice(0, 5).map((req) => (
                  <Link
                    key={req.requestId}
                    href={`/requests/${req.requestId}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{req.employeeName}</p>
                      <p className="text-xs text-gray-500">Level {req.currentLevel} approval needed</p>
                      <p className="text-xs text-gray-400">{formatDate(req.lastWorkingDate)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Request Status Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Draft", count: requests.filter((r) => r.status === "draft").length, color: "bg-gray-100 text-gray-700" },
              { label: "Level 1", count: requests.filter((r) => r.status === "pending_level_1").length, color: "bg-yellow-100 text-yellow-700" },
              { label: "Level 2", count: requests.filter((r) => r.status === "pending_level_2").length, color: "bg-orange-100 text-orange-700" },
              { label: "Level 3", count: requests.filter((r) => r.status === "pending_level_3").length, color: "bg-blue-100 text-blue-700" },
              { label: "Completed", count: requests.filter((r) => r.status === "completed").length, color: "bg-green-100 text-green-700" },
              { label: "Rejected", count: requests.filter((r) => r.status === "rejected").length, color: "bg-red-100 text-red-700" },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg p-3 text-center ${item.color}`}>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs font-medium mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
