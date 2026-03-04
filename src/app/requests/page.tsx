"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import TopBar from "@/components/layout/TopBar";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  getExitTypeLabel,
  getExitTypeColor,
  formatDate,
  isOverdue,
} from "@/lib/workflowEngine";
import type { RequestStatus, ExitType } from "@/types";

export default function RequestsPage() {
  const { requests } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ExitType | "all">("all");

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestId.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType = typeFilter === "all" || r.exitType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="My Requests" />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, ID, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "all")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_level_1">Pending – Level 1</option>
              <option value="pending_level_2">Pending – Level 2</option>
              <option value="pending_level_3">Pending – Level 3</option>
              <option value="pending_level_4">Pending – Level 4</option>
              <option value="pending_level_5">Pending – Level 5</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExitType | "all")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="staff_exit">Staff Exit</option>
              <option value="vendor_offboarding">Vendor Offboarding</option>
              <option value="project_closure">Project Closure</option>
              <option value="change_closure">Change Closure</option>
            </select>

            <Link
              href="/requests/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </Link>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <strong>{filtered.length}</strong> of <strong>{requests.length}</strong> requests
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No requests found</p>
              <Link href="/requests/new" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                Create a new request
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    Request
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Department
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Last Working Date
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Initiated
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((req) => (
                  <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{req.employeeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{req.requestId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                        {getExitTypeLabel(req.exitType)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">{req.department}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">{formatDate(req.lastWorkingDate)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} size="sm" />
                        {isOverdue(req) && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500">{formatDate(req.initiatedDate)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/requests/${req.requestId}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
