"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import TopBar from "@/components/layout/TopBar";
import {
  getExitTypeLabel,
  getExitTypeColor,
  formatDateTime,
  formatDate,
} from "@/lib/workflowEngine";

export default function AuditPage() {
  const { approvalHistory, requests, checklistResponses, allChecklistItems } = useApp();
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<"all" | "approved" | "rejected">("all");

  // Enrich history with request info
  const enrichedHistory = approvalHistory
    .map((h) => {
      const req = requests.find((r) => r.requestId === h.requestId);
      return { ...h, request: req };
    })
    .filter((h) => {
      const matchSearch =
        !search ||
        h.approverName.toLowerCase().includes(search.toLowerCase()) ||
        h.request?.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        h.requestId.toLowerCase().includes(search.toLowerCase()) ||
        h.levelName.toLowerCase().includes(search.toLowerCase());
      const matchDecision = decisionFilter === "all" || h.decision === decisionFilter;
      return matchSearch && matchDecision;
    })
    .sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime());

  // Checklist audit entries
  const checklistAudit = checklistResponses
    .filter((r) => r.updatedBy && r.updatedDate)
    .map((r) => {
      const req = requests.find((req) => req.requestId === r.requestId);
      const item = allChecklistItems.find((i) => i.itemId === r.itemId);
      return { ...r, request: req, item };
    })
    .filter((r) => {
      if (!search) return true;
      return (
        r.request?.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        r.item?.itemName.toLowerCase().includes(search.toLowerCase()) ||
        r.requestId.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => new Date(b.updatedDate!).getTime() - new Date(a.updatedDate!).getTime());

  const [activeTab, setActiveTab] = useState<"approvals" | "checklist">("approvals");

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Audit Trail" />

      <div className="flex-1 p-6 space-y-5">
        {/* Header Info */}
        <div className="bg-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-sm">Immutable Audit Log</h2>
              <p className="text-slate-400 text-xs">All actions are permanently recorded with timestamp and IP address</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-2xl font-bold">{approvalHistory.length}</p>
              <p className="text-xs text-slate-400">Approval Actions</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-2xl font-bold">{checklistAudit.length}</p>
              <p className="text-xs text-slate-400">Checklist Updates</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-2xl font-bold">{approvalHistory.filter((h) => h.decision === "rejected").length}</p>
              <p className="text-xs text-slate-400">Rejections</p>
            </div>
          </div>
        </div>

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
                  placeholder="Search by name, request ID, approver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {activeTab === "approvals" && (
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value as typeof decisionFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Decisions</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "approvals" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Approval Decisions ({enrichedHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "checklist" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Checklist Updates ({checklistAudit.length})
          </button>
        </div>

        {/* Approval Audit Table */}
        {activeTab === "approvals" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {enrichedHistory.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No audit records found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Request</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Level</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Approver</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Decision</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Comment</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrichedHistory.map((entry) => (
                    <tr key={entry.approvalId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-mono text-gray-600">{formatDateTime(entry.decisionDate)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <Link
                            href={`/requests/${entry.requestId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {entry.request?.employeeName || entry.requestId}
                          </Link>
                          {entry.request && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getExitTypeColor(entry.request.exitType)}`}>
                                {getExitTypeLabel(entry.request.exitType)}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 font-mono">{entry.requestId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                          {entry.levelName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {entry.approverName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">{entry.approverName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            entry.decision === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {entry.decision === "approved" ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {entry.decision === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-600 max-w-xs truncate" title={entry.comment}>
                          {entry.comment || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {entry.ipAddress || "—"}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Checklist Audit Table */}
        {activeTab === "checklist" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {checklistAudit.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No checklist updates found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Request</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Checklist Item</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checklistAudit.map((entry) => (
                    <tr key={entry.responseId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-mono text-gray-600">{formatDateTime(entry.updatedDate!)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/requests/${entry.requestId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {entry.request?.employeeName || entry.requestId}
                        </Link>
                        <p className="text-xs text-gray-400 font-mono">{entry.requestId}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm text-gray-900">{entry.item?.itemName || entry.itemId}</p>
                          <p className="text-xs text-gray-400">{entry.item?.departmentOwner}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            entry.status === "cleared"
                              ? "bg-green-100 text-green-700"
                              : entry.status === "not_applicable"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {entry.status === "cleared" ? "✓ Cleared" : entry.status === "not_applicable" ? "N/A" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-600">{entry.comment || "—"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Export Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">Compliance Note</p>
            <p className="text-xs text-blue-700 mt-0.5">
              All audit records are immutable and cannot be deleted. Each entry includes the approver identity, timestamp, IP address, and decision rationale. This log is available for regulatory review and internal audit purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
