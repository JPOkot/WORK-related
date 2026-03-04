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
  getChecklistProgress,
} from "@/lib/workflowEngine";
import { APPROVAL_LEVELS } from "@/lib/mockData";

export default function ApprovalsPage() {
  const { requests, getResponsesForRequest, getItemsForRequest } = useApp();

  const pendingRequests = requests.filter(
    (r) =>
      r.status !== "completed" &&
      r.status !== "rejected" &&
      r.status !== "draft"
  );

  const completedRequests = requests.filter((r) => r.status === "completed");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Pending Approvals" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{pendingRequests.length}</p>
                <p className="text-xs text-orange-600">Awaiting Approval</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{completedRequests.length}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{rejectedRequests.length}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            Pending Approvals ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No pending approvals</p>
              <p className="text-gray-400 text-xs mt-1">All requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const responses = getResponsesForRequest(req.requestId);
                const items = getItemsForRequest(req.exitType);
                const progress = getChecklistProgress(responses, items);
                const currentLevelInfo = APPROVAL_LEVELS.find((l) => l.sequenceNo === req.currentLevel);
                const overdue = isOverdue(req);

                return (
                  <div
                    key={req.requestId}
                    className={`bg-white rounded-xl border ${overdue ? "border-red-200" : "border-gray-200"} p-5`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">{req.employeeName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                            {getExitTypeLabel(req.exitType)}
                          </span>
                          {overdue && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              ⚠️ Overdue
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                          <span>
                            <span className="font-medium text-gray-700">Dept:</span> {req.department}
                          </span>
                          <span>
                            <span className="font-medium text-gray-700">Last Date:</span> {formatDate(req.lastWorkingDate)}
                          </span>
                          <span>
                            <span className="font-medium text-gray-700">Initiated:</span> {formatDateTime(req.initiatedDate)}
                          </span>
                          <span>
                            <span className="font-medium text-gray-700">ID:</span>{" "}
                            <code className="bg-gray-100 px-1 rounded">{req.requestId}</code>
                          </span>
                        </div>

                        {/* Approval Level Progress */}
                        <div className="flex items-center gap-2">
                          {APPROVAL_LEVELS.map((level) => (
                            <div key={level.levelId} className="flex items-center gap-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  level.sequenceNo < req.currentLevel
                                    ? "bg-green-500 text-white"
                                    : level.sequenceNo === req.currentLevel
                                    ? "bg-blue-500 text-white ring-2 ring-blue-200"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                                title={level.levelName}
                              >
                                {level.sequenceNo < req.currentLevel ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  level.sequenceNo
                                )}
                              </div>
                              {level.sequenceNo < APPROVAL_LEVELS.length && (
                                <div className={`w-4 h-0.5 ${level.sequenceNo < req.currentLevel ? "bg-green-300" : "bg-gray-200"}`} />
                              )}
                            </div>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {currentLevelInfo?.levelName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={req.status} />

                        {/* Checklist Progress */}
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Checklist</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${progress.percentage === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{progress.percentage}%</span>
                          </div>
                        </div>

                        <Link
                          href={`/requests/${req.requestId}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          Review & Approve →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Completed ({completedRequests.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Department</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Completed</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{req.employeeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{req.requestId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                          {getExitTypeLabel(req.exitType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.department}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(req.initiatedDate)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/requests/${req.requestId}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Rejected ({rejectedRequests.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Rejected At</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rejectedRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{req.employeeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{req.requestId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                          {getExitTypeLabel(req.exitType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">Level {req.currentLevel}</td>
                      <td className="px-4 py-3">
                        <Link href={`/requests/${req.requestId}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
