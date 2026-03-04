import type {
  ExitRequest,
  RequestStatus,
  ChecklistResponse,
  ApprovalHistory,
  ApprovalLevel,
  ChecklistItem,
  ExitType,
} from "@/types";
import { APPROVAL_LEVELS, CHECKLIST_ITEMS } from "./mockData";

// ============================================================
// Workflow Engine - Core Logic
// ============================================================

/**
 * Get the status label for display
 */
export function getStatusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    draft: "Draft",
    pending_level_1: "Pending – Line Manager",
    pending_level_2: "Pending – HR",
    pending_level_3: "Pending – IT",
    pending_level_4: "Pending – Finance",
    pending_level_5: "Pending – Final Admin",
    completed: "Completed",
    rejected: "Rejected",
  };
  return labels[status] || status;
}

/**
 * Get status color classes for badges
 */
export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    pending_level_1: "bg-yellow-50 text-yellow-800 border-yellow-200",
    pending_level_2: "bg-orange-50 text-orange-800 border-orange-200",
    pending_level_3: "bg-blue-50 text-blue-800 border-blue-200",
    pending_level_4: "bg-purple-50 text-purple-800 border-purple-200",
    pending_level_5: "bg-indigo-50 text-indigo-800 border-indigo-200",
    completed: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

/**
 * Get exit type label
 */
export function getExitTypeLabel(exitType: ExitType): string {
  const labels: Record<ExitType, string> = {
    staff_exit: "Staff Exit",
    vendor_offboarding: "Vendor Offboarding",
    project_closure: "Project Closure",
    change_closure: "Change Closure",
  };
  return labels[exitType] || exitType;
}

/**
 * Get exit type color
 */
export function getExitTypeColor(exitType: ExitType): string {
  const colors: Record<ExitType, string> = {
    staff_exit: "bg-blue-100 text-blue-800",
    vendor_offboarding: "bg-purple-100 text-purple-800",
    project_closure: "bg-teal-100 text-teal-800",
    change_closure: "bg-orange-100 text-orange-800",
  };
  return colors[exitType] || "bg-gray-100 text-gray-800";
}

/**
 * Get next status after approval
 */
export function getNextStatus(currentLevel: number): RequestStatus {
  const nextLevel = currentLevel + 1;
  if (nextLevel > APPROVAL_LEVELS.length) return "completed";
  const statusMap: Record<number, RequestStatus> = {
    1: "pending_level_1",
    2: "pending_level_2",
    3: "pending_level_3",
    4: "pending_level_4",
    5: "pending_level_5",
  };
  return statusMap[nextLevel] || "completed";
}

/**
 * Get checklist items applicable for an exit type
 */
export function getApplicableChecklistItems(exitType: ExitType): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => item.exitTypes.includes(exitType));
}

/**
 * Calculate checklist completion percentage
 */
export function getChecklistProgress(
  responses: ChecklistResponse[],
  items: ChecklistItem[]
): { cleared: number; total: number; percentage: number } {
  const total = items.length;
  const cleared = responses.filter(
    (r) => r.status === "cleared" || r.status === "not_applicable"
  ).length;
  const percentage = total > 0 ? Math.round((cleared / total) * 100) : 0;
  return { cleared, total, percentage };
}

/**
 * Check if all mandatory items are cleared
 */
export function areMandatoryItemsCleared(
  responses: ChecklistResponse[],
  items: ChecklistItem[]
): boolean {
  const mandatoryItems = items.filter((item) => item.isMandatory);
  return mandatoryItems.every((item) => {
    const response = responses.find((r) => r.itemId === item.itemId);
    return response?.status === "cleared" || response?.status === "not_applicable";
  });
}

/**
 * Get current approval level details
 */
export function getCurrentApprovalLevel(currentLevel: number): ApprovalLevel | undefined {
  return APPROVAL_LEVELS.find((lvl) => lvl.sequenceNo === currentLevel);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate days since a date
 */
export function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if request is overdue based on SLA
 */
export function isOverdue(request: ExitRequest): boolean {
  if (request.status === "completed" || request.status === "rejected" || request.status === "draft") {
    return false;
  }
  const level = getCurrentApprovalLevel(request.currentLevel);
  if (!level) return false;
  const days = daysSince(request.initiatedDate);
  return days > level.slaDays;
}

/**
 * Get approval progress steps for timeline display
 */
export function getApprovalTimeline(
  history: ApprovalHistory[],
  currentLevel: number,
  status: RequestStatus
): Array<{
  level: ApprovalLevel;
  history?: ApprovalHistory;
  state: "completed" | "current" | "pending" | "rejected";
}> {
  return APPROVAL_LEVELS.map((level) => {
    const historyEntry = history.find((h) => h.levelId === level.levelId);
    let state: "completed" | "current" | "pending" | "rejected" = "pending";

    if (historyEntry) {
      state = historyEntry.decision === "approved" ? "completed" : "rejected";
    } else if (level.sequenceNo === currentLevel && status !== "completed" && status !== "rejected") {
      state = "current";
    }

    return { level, history: historyEntry, state };
  });
}

/**
 * Generate a new request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${timestamp}-${random}`;
}

/**
 * Get department icon
 */
export function getDepartmentIcon(department: string): string {
  const icons: Record<string, string> = {
    IT: "💻",
    Finance: "💰",
    Security: "🔒",
    "Human Resources": "👥",
    Administration: "🏛️",
    Compliance: "📋",
    Operations: "⚙️",
    "Risk Management": "⚠️",
  };
  return icons[department] || "🏢";
}
