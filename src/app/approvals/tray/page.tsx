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
  getChecklistProgress,
  getLevelApproverNames,
} from "@/lib/workflowEngine";

export default function ApprovalTrayPage() {
  const {
    requests,
    currentUser,
    approvalLevels,
    users,
    claimRequest,
    releaseClaim,
    getResponsesForRequest,
    getItemsForRequest,
  } = useApp();

  // Find the current user's level(s) based on approvalLevels
  const myLevels = approvalLevels.filter((lvl) =>
    lvl.approverIds.includes(currentUser.userId)
  );

  // Filter pending requests at my levels
  const pendingRequests = requests.filter((r) => {
    // Must be pending (not completed/rejected/draft)
    if (r.status === "completed" || r.status === "rejected" || r.status === "draft") {
      return false;
    }
    // Must be at a level I can approve
    const currentLevelInfo = approvalLevels.find(
      (l) => l.levelId === `lvl${r.currentLevel}`
    );
    if (!currentLevelInfo || !currentLevelInfo.approverIds.includes(currentUser.userId)) {
      return false;
    }
    return true;
  });

  // Split into department queue (unclaimed) and my queue (claimed by me)
  const departmentQueue = pendingRequests.filter(
    (r) => !r.claimedBy || r.claimedBy === currentUser.userId
  );
  const myQueue = pendingRequests.filter(
    (r) => r.claimedBy === currentUser.userId
  );
  const availableQueue = departmentQueue.filter((r) => !r.claimedBy);

  const levelColors: Record<number, { bg: string; border: string; badge: string; dot: string }> = {
    1: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
    2: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
    3: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
    4: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
    5: { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  };

  const handleClaim = (requestId: string) => {
    claimRequest(requestId, currentUser.userId);
  };

  const handleRelease = (requestId: string) => {
    releaseClaim(requestId);
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Approval Tray" />

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">My Approval Tray</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                <strong>Department Queue:</strong> Requests waiting to be claimed by any approver in your department.
                <br />
                <strong>My Queue:</strong> Requests you have claimed and are working on.
              </p>
            </div>
          </div>

          {/* My Levels */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">You are an approver for:</p>
            <div className="flex flex-wrap gap-2">
              {myLevels.map((lvl) => (
                <span
                  key={lvl.levelId}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium"
                >
                  Level {lvl.sequenceNo}: {lvl.levelName}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* My Queue (Claimed by me) */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            My Queue ({myQueue.length})
          </h2>

          {myQueue.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No requests in your queue</p>
              <p className="text-gray-400 text-xs mt-1">Claim requests from the department queue below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myQueue.map((req) => {
                const responses = getResponsesForRequest(req.requestId);
                const items = getItemsForRequest(req.exitType);
                const progress = getChecklistProgress(responses, items);
                const levelInfo = approvalLevels.find((l) => l.levelId === `lvl${req.currentLevel}`);
                const colors = levelColors[req.currentLevel] || levelColors[1];
                const isClaimedByMe = req.claimedBy === currentUser.userId;

                return (
                  <div
                    key={req.requestId}
                    className="bg-white rounded-xl border border-blue-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">{req.employeeName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                            {getExitTypeLabel(req.exitType)}
                          </span>
                          {isClaimedByMe && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              🔒 Claimed by you
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

                        {/* Level progress */}
                        <div className="flex items-center gap-2">
                          {approvalLevels.map((level) => (
                            <div key={level.levelId} className="flex items-center gap-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  level.sequenceNo < req.currentLevel
                                    ? "bg-green-500 text-white"
                                    : level.sequenceNo === req.currentLevel
                                    ? `${colors.dot} text-white`
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {level.sequenceNo < req.currentLevel ? (
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  level.sequenceNo
                                )}
                              </div>
                              {level.sequenceNo < approvalLevels.length && (
                                <div className={`w-3 h-0.5 ${level.sequenceNo < req.currentLevel ? "bg-green-300" : "bg-gray-200"}`} />
                              )}
                            </div>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {levelInfo?.levelName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={req.status} />

                        <div className="text-right">
                          <p className="text-xs text-gray-500">Checklist</p>
                          <p className="text-xs font-medium text-gray-700">{progress.percentage}% complete</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRelease(req.requestId)}
                            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Release
                          </button>
                          <Link
                            href={`/requests/${req.requestId}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                          >
                            Review & Approve →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Queue (Available to claim) */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            Department Queue — Available to Claim ({availableQueue.length})
          </h2>

          {availableQueue.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">All caught up!</p>
              <p className="text-gray-400 text-xs mt-1">No pending requests to claim</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableQueue.map((req) => {
                const responses = getResponsesForRequest(req.requestId);
                const items = getItemsForRequest(req.exitType);
                const progress = getChecklistProgress(responses, items);
                const levelInfo = approvalLevels.find((l) => l.levelId === `lvl${req.currentLevel}`);
                const approverNames = levelInfo ? getLevelApproverNames(levelInfo, users) : [];
                const colors = levelColors[req.currentLevel] || levelColors[1];

                return (
                  <div
                    key={req.requestId}
                    className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">{req.employeeName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExitTypeColor(req.exitType)}`}>
                            {getExitTypeLabel(req.exitType)}
                          </span>
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
                        </div>

                        {/* Level info with approvers */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {approvalLevels.map((level) => (
                              <div key={level.levelId} className="flex items-center gap-1">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                    level.sequenceNo < req.currentLevel
                                      ? "bg-green-500 text-white"
                                      : level.sequenceNo === req.currentLevel
                                      ? `${colors.dot} text-white`
                                      : "bg-gray-200 text-gray-500"
                                  }`}
                                >
                                  {level.sequenceNo < req.currentLevel ? (
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    level.sequenceNo
                                  )}
                                </div>
                                {level.sequenceNo < approvalLevels.length && (
                                  <div className={`w-3 h-0.5 ${level.sequenceNo < req.currentLevel ? "bg-green-300" : "bg-gray-200"}`} />
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-1">
                            {levelInfo?.levelName}
                          </span>
                        </div>

                        {/* Approvers for this level */}
                        {approverNames.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500">Approvers:</span>
                            {approverNames.map((name) => (
                              <span
                                key={name}
                                className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={req.status} />

                        <div className="text-right">
                          <p className="text-xs text-gray-500">Checklist</p>
                          <p className="text-xs font-medium text-gray-700">{progress.percentage}% complete</p>
                        </div>

                        <button
                          onClick={() => handleClaim(req.requestId)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          Claim for My Queue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
