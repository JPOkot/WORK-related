"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import TopBar from "@/components/layout/TopBar";
import StatusBadge from "@/components/ui/StatusBadge";
import ApprovalTimeline from "@/components/ui/ApprovalTimeline";
import {
  getExitTypeLabel,
  getExitTypeColor,
  formatDate,
  formatDateTime,
  getChecklistProgress,
  areMandatoryItemsCleared,
  getDepartmentIcon,
  getLevelApproverNames,
  getPendingApprovers,
} from "@/lib/workflowEngine";
import type { ApprovalDecision } from "@/types";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const {
    requests,
    getResponsesForRequest,
    getHistoryForRequest,
    getItemsForRequest,
    updateChecklistItem,
    submitApproval,
    currentUser,
    approvalLevels,
    users,
    claimRequest,
    releaseClaim,
  } = useApp();

  const request = requests.find((r) => r.requestId === requestId);
  const responses = getResponsesForRequest(requestId);
  const history = getHistoryForRequest(requestId);
  const items = request ? getItemsForRequest(request.exitType) : [];

  const [activeTab, setActiveTab] = useState<"checklist" | "approval" | "timeline">("checklist");
  const [approvalDecision, setApprovalDecision] = useState<ApprovalDecision>("approved");
  const [approvalComment, setApprovalComment] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);

  if (!request) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Request Not Found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Request not found</p>
            <Link href="/requests" className="text-blue-600 hover:underline text-sm">
              ← Back to Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = getChecklistProgress(responses, items);
  const mandatoryCleared = areMandatoryItemsCleared(responses, items);

  // Claim status (must be defined before canApprove uses it)
  const isClaimed = !!request.claimedBy;
  const isClaimedByMe = request.claimedBy === currentUser.userId;
  const currentLevelConfig = approvalLevels.find(
    (l) => l.levelId === `lvl${request.currentLevel}`
  );
  const canClaim =
    !isClaimed &&
    currentLevelConfig?.approverIds.includes(currentUser.userId);

  const canApprove =
    request.status !== "completed" &&
    request.status !== "rejected" &&
    request.status !== "draft" &&
    (isClaimedByMe || !isClaimed);

  // Multi-approver: assigned approvers for this level
  const assignedApproverNames = currentLevelConfig
    ? getLevelApproverNames(currentLevelConfig, users)
    : [];
  const pendingApproverIds = currentLevelConfig
    ? getPendingApprovers(currentLevelConfig, history)
    : [];
  const pendingApproverNames = pendingApproverIds.map((id) => {
    const u = users.find((usr) => usr.userId === id);
    return u ? u.fullName : id;
  });

  const handleApprovalSubmit = async () => {
    if (!approvalComment.trim()) return;
    setIsSubmittingApproval(true);
    await new Promise((r) => setTimeout(r, 800));
    submitApproval(requestId, approvalDecision, approvalComment);
    setIsSubmittingApproval(false);
    setApprovalSubmitted(true);
    setApprovalComment("");
    setTimeout(() => {
      setApprovalSubmitted(false);
      setActiveTab("timeline");
    }, 1500);
  };

  // Group checklist items by department
  const itemsByDept = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.departmentOwner]) acc[item.departmentOwner] = [];
    acc[item.departmentOwner].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1">
      <TopBar />

      <div className="flex-1 p-6 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/requests" className="hover:text-blue-600">Requests</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{request.employeeName}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{request.employeeName}</h1>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getExitTypeColor(request.exitType)}`}>
                  {getExitTypeLabel(request.exitType)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>
                  <span className="font-medium text-gray-700">ID:</span>{" "}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{request.requestId}</code>
                </span>
                <span>
                  <span className="font-medium text-gray-700">Employee ID:</span> {request.employeeId}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Department:</span> {request.department}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Last Date:</span> {formatDate(request.lastWorkingDate)}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Initiated:</span> {formatDateTime(request.initiatedDate)}
                </span>
              </div>
              {request.notes && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  📝 {request.notes}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={request.status} />
              
              {/* Claim status */}
              {isClaimed && (
                <div className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  isClaimedByMe
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {isClaimedByMe ? "🔒 You have claimed this" : `🔒 Claimed by another approver`}
                </div>
              )}

              {/* Claim/Release buttons */}
              {canApprove && !isClaimed && (
                <button
                  onClick={() => claimRequest(requestId, currentUser.userId)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  📥 Claim for My Queue
                </button>
              )}
              {isClaimedByMe && (
                <button
                  onClick={() => releaseClaim(requestId)}
                  className="text-gray-500 hover:text-gray-700 text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Release Claim
                </button>
              )}

              <div className="text-right">
                <p className="text-xs text-gray-500">Checklist Progress</p>
                <p className="text-sm font-bold text-gray-900">
                  {progress.cleared}/{progress.total} ({progress.percentage}%)
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Checklist Completion</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progress.percentage === 100 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {!mandatoryCleared && progress.total > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Some mandatory items are still pending
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: "checklist", label: "Checklist", count: `${progress.cleared}/${progress.total}` },
            { key: "approval", label: "Approve / Reject", disabled: !canApprove },
            { key: "timeline", label: "Approval Timeline", count: history.length > 0 ? String(history.length) : undefined },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key as typeof activeTab)}
              disabled={tab.disabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : tab.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Checklist Tab */}
        {activeTab === "checklist" && (
          <div className="space-y-4">
            {Object.entries(itemsByDept).map(([dept, deptItems]) => (
              <div key={dept} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="text-lg">{getDepartmentIcon(dept)}</span>
                  <h3 className="text-sm font-semibold text-gray-900">{dept}</h3>
                  <span className="text-xs text-gray-500">
                    {deptItems.filter((item) => {
                      const r = responses.find((res) => res.itemId === item.itemId);
                      return r?.status === "cleared" || r?.status === "not_applicable";
                    }).length}/{deptItems.length} cleared
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {deptItems.map((item) => {
                    const response = responses.find((r) => r.itemId === item.itemId);
                    const status = response?.status || "pending";

                    return (
                      <div key={item.itemId} className="px-5 py-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                              {item.isMandatory && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                  Required
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                            {response?.comment && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                💬 {response.comment}
                              </p>
                            )}
                            {response?.updatedBy && response?.updatedDate && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Updated {formatDateTime(response.updatedDate)}
                              </p>
                            )}
                          </div>

                          {/* Status Controls */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {(["pending", "cleared", "not_applicable"] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  if (response) {
                                    updateChecklistItem(response.responseId, s);
                                  }
                                }}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                                  status === s
                                    ? s === "cleared"
                                      ? "bg-green-500 text-white border-green-500"
                                      : s === "not_applicable"
                                      ? "bg-gray-500 text-white border-gray-500"
                                      : "bg-orange-500 text-white border-orange-500"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                {s === "pending" ? "Pending" : s === "cleared" ? "✓ Cleared" : "N/A"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Tab */}
        {activeTab === "approval" && (
          <div className="max-w-xl">
            {approvalSubmitted ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">Decision Recorded!</p>
                <p className="text-sm text-gray-500 mt-1">Redirecting to timeline...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Submit Approval Decision</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Level {request.currentLevel} approval for {request.employeeName}
                  </p>
                </div>

                {/* Checklist Warning */}
                {!mandatoryCleared && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-orange-700">
                      <strong>Warning:</strong> Some mandatory checklist items are still pending. You can still approve, but this will be noted.
                    </p>
                  </div>
                )}

                {/* Decision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setApprovalDecision("approved")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        approvalDecision === "approved"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approvalDecision === "approved" ? "bg-green-500" : "bg-gray-200"}`}>
                        <svg className={`w-4 h-4 ${approvalDecision === "approved" ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${approvalDecision === "approved" ? "text-green-700" : "text-gray-700"}`}>Approve</p>
                        <p className="text-xs text-gray-500">Move to next level</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setApprovalDecision("rejected")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        approvalDecision === "rejected"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approvalDecision === "rejected" ? "bg-red-500" : "bg-gray-200"}`}>
                        <svg className={`w-4 h-4 ${approvalDecision === "rejected" ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${approvalDecision === "rejected" ? "text-red-700" : "text-gray-700"}`}>Reject</p>
                        <p className="text-xs text-gray-500">Stop the workflow</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={4}
                    placeholder={
                      approvalDecision === "rejected"
                        ? "Required: Explain the reason for rejection..."
                        : "Add any notes or conditions for this approval..."
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {!approvalComment.trim() && (
                    <p className="text-xs text-gray-400 mt-1">Comment is required for audit trail</p>
                  )}
                </div>

                {/* Assigned Approvers for this level */}
                {assignedApproverNames.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1.5">
                      {currentLevelConfig?.requireAllApprovers
                        ? "🔐 Consensus required – all approvers must approve"
                        : "👥 Any one approver can advance this level"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedApproverNames.map((name) => {
                        const isPending = pendingApproverNames.includes(name);
                        return (
                          <span
                            key={name}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isPending
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isPending ? "⏳" : "✓"} {name}
                          </span>
                        );
                      })}
                    </div>
                    {currentLevelConfig?.requireAllApprovers && pendingApproverNames.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1.5">
                        Waiting for {pendingApproverNames.length} more approver{pendingApproverNames.length > 1 ? "s" : ""} to act.
                      </p>
                    )}
                  </div>
                )}

                {/* Approver Info */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Approving as:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {currentUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{currentUser.fullName}</p>
                      <p className="text-xs text-gray-500">{currentUser.department} · {currentUser.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    🔒 This action will be logged with timestamp and IP address for audit purposes.
                  </p>
                </div>

                <button
                  onClick={handleApprovalSubmit}
                  disabled={!approvalComment.trim() || isSubmittingApproval}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    approvalDecision === "approved"
                      ? "bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
                      : "bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
                  }`}
                >
                  {isSubmittingApproval ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : approvalDecision === "approved" ? (
                    "✓ Confirm Approval"
                  ) : (
                    "✗ Confirm Rejection"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="max-w-xl">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Approval Timeline</h2>
              <ApprovalTimeline
                history={history}
                currentLevel={request.currentLevel}
                status={request.status}
                approvalLevels={approvalLevels}
                users={users}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
