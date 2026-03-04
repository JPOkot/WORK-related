import type { ApprovalHistory } from "@/types";
import { APPROVAL_LEVELS } from "@/lib/mockData";
import { formatDateTime } from "@/lib/workflowEngine";

interface ApprovalTimelineProps {
  history: ApprovalHistory[];
  currentLevel: number;
  status: string;
}

export default function ApprovalTimeline({ history, currentLevel, status }: ApprovalTimelineProps) {
  return (
    <div className="space-y-0">
      {APPROVAL_LEVELS.map((level, idx) => {
        const historyEntry = history.find((h) => h.levelId === level.levelId);
        const isCompleted = !!historyEntry && historyEntry.decision === "approved";
        const isRejected = !!historyEntry && historyEntry.decision === "rejected";
        const isCurrent =
          level.sequenceNo === currentLevel &&
          status !== "completed" &&
          status !== "rejected";
        const isPending = !historyEntry && !isCurrent;
        const isLast = idx === APPROVAL_LEVELS.length - 1;

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
                ) : isCurrent ? (
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
                        : isCurrent
                        ? "text-blue-700"
                        : "text-gray-500"
                    }`}
                  >
                    {level.levelName}
                  </p>
                  <p className="text-xs text-gray-400">SLA: {level.slaDays} day{level.slaDays !== 1 ? "s" : ""}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? "bg-green-100 text-green-700"
                      : isRejected
                      ? "bg-red-100 text-red-700"
                      : isCurrent
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isCompleted ? "Approved" : isRejected ? "Rejected" : isCurrent ? "In Progress" : "Pending"}
                </span>
              </div>

              {historyEntry && (
                <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {historyEntry.approverName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{historyEntry.approverName}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{formatDateTime(historyEntry.decisionDate)}</span>
                  </div>
                  {historyEntry.comment && (
                    <p className="text-xs text-gray-600 italic">&ldquo;{historyEntry.comment}&rdquo;</p>
                  )}
                  {historyEntry.ipAddress && (
                    <p className="text-xs text-gray-400 mt-1">IP: {historyEntry.ipAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
