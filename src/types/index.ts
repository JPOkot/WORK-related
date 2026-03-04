// ============================================================
// Core Data Types for Exit Checklist Approval Workflow MVP
// ============================================================

export type UserRole = "initiator" | "approver" | "admin" | "auditor";

export type RequestStatus =
  | "draft"
  | "pending_level_1"
  | "pending_level_2"
  | "pending_level_3"
  | "pending_level_4"
  | "pending_level_5"
  | "completed"
  | "rejected";

export type ChecklistItemStatus = "pending" | "cleared" | "not_applicable";

export type ApprovalDecision = "approved" | "rejected";

export type ExitType = "staff_exit" | "vendor_offboarding" | "project_closure" | "change_closure";

// ============================================================
// Users
// ============================================================
export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
}

// ============================================================
// Exit Request
// ============================================================
export interface ExitRequest {
  requestId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  exitType: ExitType;
  lastWorkingDate: string; // ISO date string
  initiatedBy: string; // userId
  initiatedDate: string; // ISO datetime string
  status: RequestStatus;
  currentLevel: number;
  notes?: string;
  /** User ID of the approver who has claimed this request.
   *  When set, other approvers at the same level cannot see or act on it. */
  claimedBy?: string | null;
  /** Timestamp when the request was claimed */
  claimedAt?: string | null;
}

// ============================================================
// Checklist Items (Template)
// ============================================================
export interface ChecklistItem {
  itemId: string;
  itemName: string;
  departmentOwner: string;
  isMandatory: boolean;
  exitTypes: ExitType[]; // which exit types this applies to
  description?: string;
}

// ============================================================
// Exit Checklist Response (per request)
// ============================================================
export interface ChecklistResponse {
  responseId: string;
  requestId: string;
  itemId: string;
  status: ChecklistItemStatus;
  comment?: string;
  updatedBy?: string; // userId
  updatedDate?: string; // ISO datetime string
}

// ============================================================
// Approval Levels
// ============================================================
export interface ApprovalLevel {
  levelId: string;
  levelName: string;
  sequenceNo: number;
  roleRequired: string;
  department?: string;
  slaDays: number;
  /** User IDs of all approvers assigned to this level.
   *  Any one of them can approve to advance the workflow. */
  approverIds: string[];
  /** When true, ALL approvers must approve before advancing (consensus mode).
   *  When false (default), any single approver can advance the workflow. */
  requireAllApprovers?: boolean;
}

// ============================================================
// Approval History
// ============================================================
export interface ApprovalHistory {
  approvalId: string;
  requestId: string;
  levelId: string;
  levelName: string;
  approvedBy: string; // userId
  approverName: string;
  decision: ApprovalDecision;
  comment?: string;
  decisionDate: string; // ISO datetime string
  ipAddress?: string;
}

// ============================================================
// Notification
// ============================================================
export interface Notification {
  notificationId: string;
  requestId: string;
  recipientId: string;
  type: "request_created" | "approval_completed" | "rejected" | "final_completion" | "escalation";
  message: string;
  sentDate: string;
  isRead: boolean;
}

// ============================================================
// Dashboard Stats
// ============================================================
export interface DashboardStats {
  totalRequests: number;
  pendingApprovals: number;
  completedThisMonth: number;
  rejectedThisMonth: number;
  overdueRequests: number;
}

// ============================================================
// Combined view for display
// ============================================================
export interface ExitRequestWithDetails extends ExitRequest {
  checklistResponses: ChecklistResponse[];
  approvalHistory: ApprovalHistory[];
  checklistItems: ChecklistItem[];
}
