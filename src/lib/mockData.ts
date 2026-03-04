import type {
  User,
  ExitRequest,
  ChecklistItem,
  ChecklistResponse,
  ApprovalLevel,
  ApprovalHistory,
  Notification,
} from "@/types";

// ============================================================
// Mock Users
// ============================================================
export const MOCK_USERS: User[] = [
  {
    userId: "u001",
    fullName: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "initiator",
    department: "Human Resources",
    status: "active",
  },
  {
    userId: "u002",
    fullName: "Michael Chen",
    email: "michael.chen@company.com",
    role: "approver",
    department: "IT",
    status: "active",
  },
  {
    userId: "u003",
    fullName: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "approver",
    department: "Finance",
    status: "active",
  },
  {
    userId: "u004",
    fullName: "James Okafor",
    email: "james.okafor@company.com",
    role: "approver",
    department: "Security",
    status: "active",
  },
  {
    userId: "u005",
    fullName: "Linda Patel",
    email: "linda.patel@company.com",
    role: "admin",
    department: "Administration",
    status: "active",
  },
  {
    userId: "u006",
    fullName: "David Kim",
    email: "david.kim@company.com",
    role: "auditor",
    department: "Compliance",
    status: "active",
  },
  {
    userId: "u007",
    fullName: "Anna Williams",
    email: "anna.williams@company.com",
    role: "approver",
    department: "Human Resources",
    status: "active",
  },
];

// Current logged-in user (simulated)
export const CURRENT_USER: User = MOCK_USERS[0]; // Sarah Johnson (initiator)

// ============================================================
// Approval Levels
// ============================================================
export const APPROVAL_LEVELS: ApprovalLevel[] = [
  {
    levelId: "lvl1",
    levelName: "Line Manager 1-on-1",
    sequenceNo: 1,
    roleRequired: "approver",
    department: "Any",
    slaDays: 2,
    // Line manager conducts 1-on-1 meeting
    approverIds: ["u007", "u002"],
    requireAllApprovers: false,
  },
  {
    levelId: "lvl2",
    levelName: "Human Resources",
    sequenceNo: 2,
    roleRequired: "approver",
    department: "Human Resources",
    slaDays: 3,
    approverIds: ["u007"],
    requireAllApprovers: false,
  },
  {
    levelId: "lvl3",
    levelName: "IT Department",
    sequenceNo: 3,
    roleRequired: "approver",
    department: "IT",
    slaDays: 2,
    approverIds: ["u002"],
    requireAllApprovers: false,
  },
  {
    levelId: "lvl4",
    levelName: "Finance Department",
    sequenceNo: 4,
    roleRequired: "approver",
    department: "Finance",
    slaDays: 3,
    approverIds: ["u003"],
    requireAllApprovers: false,
  },
  {
    levelId: "lvl5",
    levelName: "Final Admin Approval",
    sequenceNo: 5,
    roleRequired: "admin",
    department: "Administration",
    slaDays: 1,
    approverIds: ["u005"],
    requireAllApprovers: false,
  },
];

// ============================================================
// Checklist Items Template
// ============================================================
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // IT Items
  {
    itemId: "ci001",
    itemName: "Return Laptop / Equipment",
    departmentOwner: "IT",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "All company-issued hardware must be returned and inventoried",
  },
  {
    itemId: "ci002",
    itemName: "Disable Active Directory Account",
    departmentOwner: "IT",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Disable AD account and revoke all system access",
  },
  {
    itemId: "ci003",
    itemName: "Revoke VPN / Remote Access",
    departmentOwner: "IT",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Remove VPN certificates and remote access credentials",
  },
  {
    itemId: "ci004",
    itemName: "Transfer / Archive Email",
    departmentOwner: "IT",
    isMandatory: false,
    exitTypes: ["staff_exit"],
    description: "Set up email forwarding or archive mailbox per policy",
  },
  // Finance Items
  {
    itemId: "ci006",
    itemName: "Clear Salary Advances",
    departmentOwner: "Finance",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Recover any outstanding salary advances or loans",
  },
  {
    itemId: "ci007",
    itemName: "Final Payroll Processing",
    departmentOwner: "Finance",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Process final salary, leave encashment, and gratuity",
  },
  // Security Items
  {
    itemId: "ci010",
    itemName: "Return Access Card / Badge",
    departmentOwner: "Security",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Collect physical access cards and update access control system",
  },
  {
    itemId: "ci011",
    itemName: "Revoke Building Access",
    departmentOwner: "Security",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Remove biometric data and deactivate access permissions",
  },
  // HR Items
  {
    itemId: "ci012",
    itemName: "Exit Interview Completed",
    departmentOwner: "Human Resources",
    isMandatory: false,
    exitTypes: ["staff_exit"],
    description: "Conduct and document exit interview",
  },
  {
    itemId: "ci013",
    itemName: "Knowledge Transfer Completed",
    departmentOwner: "Human Resources",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Ensure proper handover of responsibilities and documentation",
  },
  {
    itemId: "ci014",
    itemName: "NDA / Confidentiality Reminder",
    departmentOwner: "Human Resources",
    isMandatory: true,
    exitTypes: ["staff_exit"],
    description: "Remind employee of ongoing NDA obligations",
  },
];

// ============================================================
// Mock Exit Requests
// ============================================================
export const MOCK_EXIT_REQUESTS: ExitRequest[] = [
  {
    requestId: "req001",
    employeeId: "emp101",
    employeeName: "Robert Thompson",
    department: "Operations",
    exitType: "staff_exit",
    lastWorkingDate: "2026-03-15",
    initiatedBy: "u001",
    initiatedDate: "2026-02-28T09:30:00Z",
    status: "pending_level_3",
    currentLevel: 3,
    notes: "Voluntary resignation. 30 days notice served.",
  },
  {
    requestId: "req002",
    employeeId: "emp102",
    employeeName: "Maria Santos",
    department: "Finance",
    exitType: "staff_exit",
    lastWorkingDate: "2026-03-10",
    initiatedBy: "u001",
    initiatedDate: "2026-02-25T10:00:00Z",
    status: "pending_manager_interview",
    currentLevel: 0,
    notes: "Pending 1-on-1 meeting with line manager.",
  },
  {
    requestId: "req003",
    employeeId: "emp103",
    employeeName: "Ahmed Al-Rashid",
    department: "Risk Management",
    exitType: "staff_exit",
    lastWorkingDate: "2026-03-20",
    initiatedBy: "u001",
    initiatedDate: "2026-03-03T08:00:00Z",
    status: "pending_level_1",
    currentLevel: 1,
    notes: "Transfer to subsidiary company.",
  },
  {
    requestId: "req004",
    employeeId: "emp104",
    employeeName: "Jennifer Lee",
    department: "Marketing",
    exitType: "staff_exit",
    lastWorkingDate: "2026-03-25",
    initiatedBy: "u001",
    initiatedDate: "2026-03-01T09:00:00Z",
    status: "completed",
    currentLevel: 5,
    notes: "Voluntary resignation. All clearances completed.",
  },
  {
    requestId: "req005",
    employeeId: "emp105",
    employeeName: "David Wilson",
    department: "IT",
    exitType: "staff_exit",
    lastWorkingDate: "2026-03-12",
    initiatedBy: "u001",
    initiatedDate: "2026-02-20T11:00:00Z",
    status: "overturned",
    currentLevel: 0,
    lineManagerId: "u007",
    managerMeetingDate: "2026-02-25T14:00:00Z",
    managerDecision: "overturned",
    notes: "After 1-on-1 meeting, employee decided to stay. Exit overturned.",
  },
];

// ============================================================
// Mock Checklist Responses
// ============================================================
export const MOCK_CHECKLIST_RESPONSES: ChecklistResponse[] = [
  // req001 - Robert Thompson (staff_exit, pending_level_3)
  { responseId: "r001", requestId: "req001", itemId: "ci001", status: "cleared", comment: "Laptop returned and wiped", updatedBy: "u002", updatedDate: "2026-03-01T10:00:00Z" },
  { responseId: "r002", requestId: "req001", itemId: "ci002", status: "pending", updatedBy: undefined, updatedDate: undefined },
  { responseId: "r003", requestId: "req001", itemId: "ci003", status: "cleared", comment: "VPN access revoked", updatedBy: "u002", updatedDate: "2026-03-01T10:30:00Z" },
  { responseId: "r004", requestId: "req001", itemId: "ci004", status: "pending", updatedBy: undefined, updatedDate: undefined },
  { responseId: "r005", requestId: "req001", itemId: "ci006", status: "cleared", comment: "No outstanding advances", updatedBy: "u003", updatedDate: "2026-03-02T09:00:00Z" },
  { responseId: "r006", requestId: "req001", itemId: "ci007", status: "pending", updatedBy: undefined, updatedDate: undefined },
  { responseId: "r007", requestId: "req001", itemId: "ci010", status: "cleared", comment: "Badge returned", updatedBy: "u004", updatedDate: "2026-03-01T14:00:00Z" },
  { responseId: "r008", requestId: "req001", itemId: "ci011", status: "cleared", comment: "Biometric removed", updatedBy: "u004", updatedDate: "2026-03-01T14:15:00Z" },
  { responseId: "r009", requestId: "req001", itemId: "ci012", status: "cleared", comment: "Exit interview done", updatedBy: "u007", updatedDate: "2026-03-02T11:00:00Z" },
  { responseId: "r010", requestId: "req001", itemId: "ci013", status: "pending", updatedBy: undefined, updatedDate: undefined },
  { responseId: "r011", requestId: "req001", itemId: "ci014", status: "cleared", comment: "NDA reminder sent and acknowledged", updatedBy: "u007", updatedDate: "2026-03-02T11:30:00Z" },

  // req003 - Project Closure (completed)
  { responseId: "r020", requestId: "req003", itemId: "ci002", status: "cleared", comment: "All project accounts disabled", updatedBy: "u002", updatedDate: "2026-02-25T10:00:00Z" },
  { responseId: "r021", requestId: "req003", itemId: "ci005", status: "cleared", comment: "All servers decommissioned", updatedBy: "u002", updatedDate: "2026-02-25T10:30:00Z" },
  { responseId: "r022", requestId: "req003", itemId: "ci009", status: "cleared", comment: "Budget reconciled, surplus returned", updatedBy: "u003", updatedDate: "2026-02-26T09:00:00Z" },
  { responseId: "r023", requestId: "req003", itemId: "ci013", status: "cleared", comment: "Full documentation handed over", updatedBy: "u007", updatedDate: "2026-02-26T14:00:00Z" },
];

// ============================================================
// Mock Approval History
// ============================================================
export const MOCK_APPROVAL_HISTORY: ApprovalHistory[] = [
  // req001 - Robert Thompson
  {
    approvalId: "ah001",
    requestId: "req001",
    levelId: "lvl1",
    levelName: "Line Manager",
    approvedBy: "u007",
    approverName: "Anna Williams",
    decision: "approved",
    comment: "Approved. Notice period served.",
    decisionDate: "2026-03-01T09:00:00Z",
    ipAddress: "192.168.1.45",
  },
  {
    approvalId: "ah002",
    requestId: "req001",
    levelId: "lvl2",
    levelName: "Human Resources",
    approvedBy: "u007",
    approverName: "Anna Williams",
    decision: "approved",
    comment: "HR clearance confirmed.",
    decisionDate: "2026-03-02T10:00:00Z",
    ipAddress: "192.168.1.45",
  },

  // req003 - Project Closure (completed)
  {
    approvalId: "ah010",
    requestId: "req003",
    levelId: "lvl1",
    levelName: "Line Manager",
    approvedBy: "u007",
    approverName: "Anna Williams",
    decision: "approved",
    comment: "Project closure confirmed.",
    decisionDate: "2026-02-22T09:00:00Z",
    ipAddress: "192.168.1.45",
  },
  {
    approvalId: "ah011",
    requestId: "req003",
    levelId: "lvl2",
    levelName: "Human Resources",
    approvedBy: "u007",
    approverName: "Anna Williams",
    decision: "approved",
    comment: "HR sign-off complete.",
    decisionDate: "2026-02-23T10:00:00Z",
    ipAddress: "192.168.1.45",
  },
  {
    approvalId: "ah012",
    requestId: "req003",
    levelId: "lvl3",
    levelName: "IT Department",
    approvedBy: "u002",
    approverName: "Michael Chen",
    decision: "approved",
    comment: "All IT resources decommissioned.",
    decisionDate: "2026-02-24T11:00:00Z",
    ipAddress: "192.168.1.22",
  },
  {
    approvalId: "ah013",
    requestId: "req003",
    levelId: "lvl4",
    levelName: "Finance Department",
    approvedBy: "u003",
    approverName: "Emily Rodriguez",
    decision: "approved",
    comment: "Budget closed.",
    decisionDate: "2026-02-25T14:00:00Z",
    ipAddress: "192.168.1.33",
  },
  {
    approvalId: "ah014",
    requestId: "req003",
    levelId: "lvl5",
    levelName: "Final Admin Approval",
    approvedBy: "u005",
    approverName: "Linda Patel",
    decision: "approved",
    comment: "Final approval granted. Project officially closed.",
    decisionDate: "2026-02-26T16:00:00Z",
    ipAddress: "192.168.1.10",
  },

  // req004 - Maria Santos (rejected)
  {
    approvalId: "ah020",
    requestId: "req004",
    levelId: "lvl1",
    levelName: "Line Manager",
    approvedBy: "u007",
    approverName: "Anna Williams",
    decision: "approved",
    comment: "Approved at manager level.",
    decisionDate: "2026-02-26T09:00:00Z",
    ipAddress: "192.168.1.45",
  },
  {
    approvalId: "ah021",
    requestId: "req004",
    levelId: "lvl2",
    levelName: "Human Resources",
    approvedBy: "u003",
    approverName: "Emily Rodriguez",
    decision: "rejected",
    comment: "REJECTED: Outstanding loan of $5,000 not cleared. Cannot proceed until resolved.",
    decisionDate: "2026-02-27T11:00:00Z",
    ipAddress: "192.168.1.33",
  },
];

// ============================================================
// Mock Notifications
// ============================================================
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    notificationId: "n001",
    requestId: "req001",
    recipientId: "u001",
    type: "approval_completed",
    message: "Exit request for Robert Thompson has been approved at Level 2 (HR). Now pending IT review.",
    sentDate: "2026-03-02T10:05:00Z",
    isRead: false,
  },
  {
    notificationId: "n002",
    requestId: "req003",
    recipientId: "u001",
    type: "final_completion",
    message: "Project closure for Core Banking Upgrade has been fully approved and completed.",
    sentDate: "2026-02-26T16:05:00Z",
    isRead: true,
  },
  {
    notificationId: "n003",
    requestId: "req004",
    recipientId: "u001",
    type: "rejected",
    message: "Exit request for Maria Santos has been REJECTED at Level 2 (HR). Reason: Outstanding loan not cleared.",
    sentDate: "2026-02-27T11:05:00Z",
    isRead: false,
  },
  {
    notificationId: "n004",
    requestId: "req005",
    recipientId: "u007",
    type: "request_created",
    message: "New exit request created for Ahmed Al-Rashid. Your approval is required at Level 1.",
    sentDate: "2026-03-03T08:05:00Z",
    isRead: false,
  },
];
