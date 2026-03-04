"use client";

import { useState, useCallback } from "react";
import type {
  User,
  UserRole,
  ExitRequest,
  ChecklistResponse,
  ApprovalHistory,
  ApprovalLevel,
  Notification,
  RequestStatus,
  ApprovalDecision,
  ExitType,
} from "@/types";
import {
  MOCK_EXIT_REQUESTS,
  MOCK_CHECKLIST_RESPONSES,
  MOCK_APPROVAL_HISTORY,
  MOCK_NOTIFICATIONS,
  MOCK_USERS,
  CURRENT_USER,
  CHECKLIST_ITEMS,
  APPROVAL_LEVELS,
} from "./mockData";
import {
  generateRequestId,
  getApplicableChecklistItems,
  getNextStatus,
  shouldAdvanceLevel,
} from "./workflowEngine";

// ============================================================
// App State Hook - simulates a backend store
// ============================================================

export function useAppStore() {
  const [requests, setRequests] = useState<ExitRequest[]>(MOCK_EXIT_REQUESTS);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse[]>(MOCK_CHECKLIST_RESPONSES);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>(MOCK_APPROVAL_HISTORY);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>(APPROVAL_LEVELS);

  // ---- Create new exit request ----
  const createRequest = useCallback(
    (data: {
      employeeId: string;
      employeeName: string;
      department: string;
      exitType: ExitType;
      lastWorkingDate: string;
      notes?: string;
    }): ExitRequest => {
      const newRequest: ExitRequest = {
        requestId: generateRequestId(),
        ...data,
        initiatedBy: CURRENT_USER.userId,
        initiatedDate: new Date().toISOString(),
        status: "pending_level_1",
        currentLevel: 1,
      };

      // Auto-populate checklist responses
      const applicableItems = getApplicableChecklistItems(data.exitType);
      const newResponses: ChecklistResponse[] = applicableItems.map((item, idx) => ({
        responseId: `r_${newRequest.requestId}_${idx}`,
        requestId: newRequest.requestId,
        itemId: item.itemId,
        status: "pending",
      }));

      setRequests((prev) => [newRequest, ...prev]);
      setChecklistResponses((prev) => [...prev, ...newResponses]);

      // Add notification
      const notification: Notification = {
        notificationId: `n_${Date.now()}`,
        requestId: newRequest.requestId,
        recipientId: CURRENT_USER.userId,
        type: "request_created",
        message: `Exit request for ${data.employeeName} has been created and submitted for Level 1 approval.`,
        sentDate: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notification, ...prev]);

      return newRequest;
    },
    []
  );

  // ---- Update checklist item status ----
  const updateChecklistItem = useCallback(
    (responseId: string, status: ChecklistResponse["status"], comment?: string) => {
      setChecklistResponses((prev) =>
        prev.map((r) =>
          r.responseId === responseId
            ? {
                ...r,
                status,
                comment: comment || r.comment,
                updatedBy: CURRENT_USER.userId,
                updatedDate: new Date().toISOString(),
              }
            : r
        )
      );
    },
    []
  );

  // ---- Submit approval decision ----
  const submitApproval = useCallback(
    (requestId: string, decision: ApprovalDecision, comment: string) => {
      const request = requests.find((r) => r.requestId === requestId);
      if (!request) return;

      const levelId = `lvl${request.currentLevel}`;
      const currentLevelConfig = approvalLevels.find((l) => l.levelId === levelId);

      // Add to approval history
      const historyEntry: ApprovalHistory = {
        approvalId: `ah_${Date.now()}`,
        requestId,
        levelId,
        levelName: currentLevelConfig?.levelName ?? `Level ${request.currentLevel}`,
        approvedBy: CURRENT_USER.userId,
        approverName: CURRENT_USER.fullName,
        decision,
        comment,
        decisionDate: new Date().toISOString(),
        ipAddress: "192.168.1.100", // simulated
      };

      // We need the updated history (including this new entry) to evaluate
      // whether all approvers have acted (for requireAllApprovers mode).
      const updatedHistory = [...approvalHistory, historyEntry];
      setApprovalHistory(updatedHistory);

      // Determine whether the level should advance
      const advance = currentLevelConfig
        ? shouldAdvanceLevel(currentLevelConfig, decision, updatedHistory)
        : decision === "approved";

      // Update request status
      let newStatus: RequestStatus;
      let newLevel = request.currentLevel;

      if (decision === "rejected") {
        newStatus = "rejected";
      } else if (!advance) {
        // Consensus mode: more approvers still needed – keep at current level
        newStatus = request.status;
      } else if (request.currentLevel >= approvalLevels.length) {
        newStatus = "completed";
        newLevel = request.currentLevel;
      } else {
        newLevel = request.currentLevel + 1;
        newStatus = getNextStatus(request.currentLevel) as RequestStatus;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.requestId === requestId
            ? { ...r, status: newStatus, currentLevel: newLevel }
            : r
        )
      );

      // Add notification
      const notifType =
        decision === "rejected"
          ? "rejected"
          : newStatus === "completed"
          ? "final_completion"
          : "approval_completed";

      const message =
        decision === "rejected"
          ? `Exit request for ${request.employeeName} has been REJECTED at Level ${request.currentLevel}. Reason: ${comment}`
          : !advance
          ? `${CURRENT_USER.fullName} approved exit request for ${request.employeeName} at Level ${request.currentLevel}. Waiting for remaining approvers.`
          : newStatus === "completed"
          ? `Exit request for ${request.employeeName} has been fully approved and COMPLETED.`
          : `Exit request for ${request.employeeName} approved at Level ${request.currentLevel}. Now pending Level ${newLevel} review.`;

      const notification: Notification = {
        notificationId: `n_${Date.now()}`,
        requestId,
        recipientId: request.initiatedBy,
        type: notifType,
        message,
        sentDate: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    [requests, approvalHistory, approvalLevels]
  );

  // ---- Mark notification as read ----
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
  }, []);

  // ---- Mark all notifications as read ----
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  // ---- Get responses for a request ----
  const getResponsesForRequest = useCallback(
    (requestId: string) => checklistResponses.filter((r) => r.requestId === requestId),
    [checklistResponses]
  );

  // ---- Get history for a request ----
  const getHistoryForRequest = useCallback(
    (requestId: string) => approvalHistory.filter((h) => h.requestId === requestId),
    [approvalHistory]
  );

  // ---- Get checklist items for a request ----
  const getItemsForRequest = useCallback((exitType: ExitType) => {
    return getApplicableChecklistItems(exitType);
  }, []);

  // ---- Dashboard stats ----
  const getDashboardStats = useCallback(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const completedThisMonth = requests.filter((r) => {
      if (r.status !== "completed") return false;
      const d = new Date(r.initiatedDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const rejectedThisMonth = requests.filter((r) => {
      if (r.status !== "rejected") return false;
      const d = new Date(r.initiatedDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const pendingApprovals = requests.filter(
      (r) =>
        r.status !== "completed" &&
        r.status !== "rejected" &&
        r.status !== "draft"
    ).length;

    return {
      totalRequests: requests.length,
      pendingApprovals,
      completedThisMonth,
      rejectedThisMonth,
      overdueRequests: 0, // simplified
    };
  }, [requests]);

  // ---- Add new user ----
  const addUser = useCallback(
    (data: { fullName: string; email: string; role: UserRole; department: string }) => {
      const newUser: User = {
        userId: `u${Date.now()}`,
        ...data,
        status: "active",
      };
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    },
    []
  );

  // ---- Update existing user ----
  const updateUser = useCallback(
    (userId: string, data: Partial<Pick<User, "fullName" | "email" | "role" | "department">>) => {
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, ...data } : u))
      );
    },
    []
  );

  // ---- Toggle user active/inactive ----
  const toggleUserStatus = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
  }, []);

  // ---- Add approver to a level ----
  const addApproverToLevel = useCallback((levelId: string, userId: string) => {
    setApprovalLevels((prev) =>
      prev.map((lvl) =>
        lvl.levelId === levelId && !lvl.approverIds.includes(userId)
          ? { ...lvl, approverIds: [...lvl.approverIds, userId] }
          : lvl
      )
    );
  }, []);

  // ---- Remove approver from a level ----
  const removeApproverFromLevel = useCallback((levelId: string, userId: string) => {
    setApprovalLevels((prev) =>
      prev.map((lvl) =>
        lvl.levelId === levelId
          ? { ...lvl, approverIds: lvl.approverIds.filter((id) => id !== userId) }
          : lvl
      )
    );
  }, []);

  // ---- Toggle requireAllApprovers for a level ----
  const toggleRequireAllApprovers = useCallback((levelId: string) => {
    setApprovalLevels((prev) =>
      prev.map((lvl) =>
        lvl.levelId === levelId
          ? { ...lvl, requireAllApprovers: !lvl.requireAllApprovers }
          : lvl
      )
    );
  }, []);

  // ---- Bulk import users (from Excel upload) ----
  // Skips rows whose email already exists; returns count of imported rows.
  const bulkImportUsers = useCallback(
    (rows: Array<{ fullName: string; email: string; role: UserRole; department: string; status: "active" | "inactive" }>) => {
      let imported = 0;
      setUsers((prev) => {
        const existingEmails = new Set(prev.map((u) => u.email.toLowerCase()));
        const newUsers: User[] = [];
        rows.forEach((row) => {
          if (!existingEmails.has(row.email.toLowerCase())) {
            newUsers.push({
              userId: `u_import_${Date.now()}_${imported}`,
              fullName: row.fullName,
              email: row.email,
              role: row.role,
              department: row.department,
              status: row.status,
            });
            existingEmails.add(row.email.toLowerCase());
            imported++;
          }
        });
        return [...prev, ...newUsers];
      });
      return imported;
    },
    []
  );

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return {
    requests,
    checklistResponses,
    approvalHistory,
    notifications,
    unreadNotifications,
    users,
    approvalLevels,
    currentUser: CURRENT_USER,
    allChecklistItems: CHECKLIST_ITEMS,
    createRequest,
    updateChecklistItem,
    submitApproval,
    markNotificationRead,
    markAllNotificationsRead,
    getResponsesForRequest,
    getHistoryForRequest,
    getItemsForRequest,
    getDashboardStats,
    addUser,
    updateUser,
    toggleUserStatus,
    bulkImportUsers,
    addApproverToLevel,
    removeApproverFromLevel,
    toggleRequireAllApprovers,
  };
}
