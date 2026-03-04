import type { ApprovalHistory, ApprovalLevel, User } from "@/types";
import { formatDateTime } from "@/lib/workflowEngine";

interface ApprovalTimelineProps {
  history: ApprovalHistory[];
  currentLevel: number;
  status: string;
  /** Live approval levels (with approverIds). Falls back to static data if not provided. */
  approvalLevels?: ApprovalLevel[];
  /** User list for resolving approver names. */
  users?: User[];
}

export default function ApprovalTimeline({
  history,
  currentLevel,
  status,
  approvalLevels,
  users = [],
}: ApprovalTimelineProps) {
  // Lazy-load static levels only when the prop is not provided
  // (avoids a hard import cycle in tests / Storybook)
  const levels: ApprovalLevel[] = approvalLevels ?? [];

  return (
    <div className="space-y-0">
      {levels.map((level, idx) => {
        // All history entries for this level
        const levelHistory = history.filter((h) => h.levelId === level.levelId);
        const approvedEntries = levelHistory.filter((h) => h.decision === "approved");
        const rejectedEntry = levelHistory.find((h) => h.decision === "rejected");

        const isCompleted =
          approvedEntries.length > 0 &&
          (!level.requireAllApprovers ||
            level.approverIds.every((id) =>
              approvedEntries.some((h) => h.approvedBy === id)
            ));
        const isRejected = !!rejectedEntry;
        const isCurrent =
          level.sequenceNo === currentLevel &&
          status !== "completed" &&
          status !== "rejected";
        const isLast = idx === levels.length - 1;

        // For consensus mode: show partial progress
        const isPartialConsensus =
          !isCompleted &&
          !isRejected &&
          level.requireAllApprovers &&
          approvedEntries.length > 0;

        return (
          <div key={level.levelId} className="flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isRejected
                    ? "bg-red-500 border-red-500 text-white"
                    : isPartialConsensus
                    ? "bg-yellow-400 border-yellow-400 text-white"
                    : isCurrent
                    ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isRejected ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : isCurrent || isPartialConsensus ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{level.sequenceNo}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 my-1 ${
                    isCompleted ? "bg-green-300" : "bg-gray-200"
                  }`}
                  style={{ minHeight: "24px" }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 flex-1 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? "text-green-700"
                        : isRejected
                        ? "text-red-700"
                        : isPartialConsensus
                        ? "text-yellow-700"
                        : isCurrent
                        ? "text-blue-700"
                        : "text-gray-500"
                    }`}
                  >
                    {level.levelName}
                  </p>
                  <p className="text-xs text-gray-400">
                    SLA: {level.slaDays} day{level.slaDays !== 1 ? "s" : ""}
                    {level.approverIds.length > 1 && (
                      <span className="ml-1.5 text-gray-400">
                        · {level.requireAllApprovers ? "Consensus" : "Any One"} ({level.approverIds.length} approvers)
                      </span>
                    )}
                  </p>

                  {/* Assigned approvers chips */}
                  {level.approverIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {level.approverIds.map((id) => {
                        const user = users.find((u) => u.userId === id);
                        const name = user ? user.fullName : id;
                        const hasActed = levelHistory.some((h) => h.approvedBy === id);
                        const wasApproved = approvedEntries.some((h) => h.approvedBy === id);
                        const wasRejected = levelHistory.some(
                          (h) => h.approvedBy === id && h.decision === "rejected"
                        );
                        return (
                          <span
                            key={id}
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              wasApproved
                                ? "bg-green-100 text-green-700"
                                : wasRejected
                                ? "bg-red-100 text-red-700"
                                : hasActed
                                ? "bg-gray-100 text-gray-600"
                                : "bg-gray-50 text-gray-400 border border-gray-200"
                            }`}
                          >
                            {wasApproved ? "✓" : wasRejected ? "✗" : "⏳"} {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-100 text-green-700"
                      : isRejected
                      ? "bg-red-100 text-red-700"
                      : isPartialConsensus
                      ? "bg-yellow-100 text-yellow-700"
                      : isCurrent
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isCompleted
                    ? "Approved"
                    : isRejected
                    ? "Rejected"
                    : isPartialConsensus
                    ? `${approvedEntries.length}/${level.approverIds.length} Approved`
                    : isCurrent
                    ? "In Progress"
                    : "Pending"}
                </span>
              </div>

              {/* History entries (one per approver who acted) */}
              {levelHistory.length > 0 && (
                <div className="mt-2 space-y-2">
                  {levelHistory.map((entry) => (
                    <div
                      key={entry.approvalId}
                      className={`rounded-lg p-3 border ${
                        entry.decision === "approved"
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {entry.approverName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{entry.approverName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{formatDateTime(entry.decisionDate)}</span>
                        <span
                          className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            entry.decision === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {entry.decision === "approved" ? "✓ Approved" : "✗ Rejected"}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="text-xs text-gray-600 italic">&ldquo;{entry.comment}&rdquo;</p>
                      )}
                      {entry.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">IP: {entry.ipAddress}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
