"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { useApp } from "@/lib/AppContext";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApprovalLevelsPage() {
  const {
    approvalLevels,
    users,
    addApproverToLevel,
    removeApproverFromLevel,
    toggleRequireAllApprovers,
  } = useApp();

  // Track which level's "add approver" dropdown is open
  const [addingToLevel, setAddingToLevel] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Only users with role "approver" or "admin" can be assigned
  const eligibleUsers = users.filter(
    (u) => u.status === "active" && (u.role === "approver" || u.role === "admin")
  );

  const handleAddApprover = (levelId: string) => {
    if (!selectedUserId) return;
    addApproverToLevel(levelId, selectedUserId);
    setSelectedUserId("");
    setAddingToLevel(null);
  };

  const levelColors: Record<number, { bg: string; border: string; badge: string; dot: string }> = {
    1: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
    2: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
    3: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
    4: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
    5: { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Approval Level Configuration" />

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Approval Level Configuration</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Assign multiple approvers to each level. By default, <strong>any one approver</strong> can advance the workflow.
                Enable <em>Require All</em> to enforce consensus (all assigned approvers must approve).
              </p>
            </div>
          </div>
        </div>

        {/* Levels */}
        <div className="space-y-4">
          {approvalLevels.map((level) => {
            const colors = levelColors[level.sequenceNo] ?? levelColors[1];
            const assignedUsers = level.approverIds
              .map((id) => users.find((u) => u.userId === id))
              .filter(Boolean) as typeof users;

            // Users not yet assigned to this level
            const unassignedEligible = eligibleUsers.filter(
              (u) => !level.approverIds.includes(u.userId)
            );

            const isAddingHere = addingToLevel === level.levelId;

            return (
              <div
                key={level.levelId}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}
              >
                {/* Level header */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${colors.dot} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                      {level.sequenceNo}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{level.levelName}</h2>
                      <p className="text-xs text-gray-500">
                        SLA: {level.slaDays} day{level.slaDays !== 1 ? "s" : ""}
                        {level.department && level.department !== "Any" && ` · ${level.department}`}
                      </p>
                    </div>
                  </div>

                  {/* Require-all toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Require All Approvers</span>
                    <button
                      onClick={() => toggleRequireAllApprovers(level.levelId)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        level.requireAllApprovers ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      title={level.requireAllApprovers ? "All approvers must approve" : "Any approver can advance"}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          level.requireAllApprovers ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.requireAllApprovers ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {level.requireAllApprovers ? "Consensus" : "Any One"}
                    </span>
                  </div>
                </div>

                {/* Assigned approvers */}
                <div className="space-y-2 mb-3">
                  {assignedUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No approvers assigned yet.</p>
                  ) : (
                    assignedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-500">{user.department} · {user.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeApproverFromLevel(level.levelId, user.userId)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Remove from this level"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add approver */}
                {isAddingHere ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select approver —</option>
                      {unassignedEligible.map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {u.fullName} ({u.department})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddApprover(level.levelId)}
                      disabled={!selectedUserId}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingToLevel(null); setSelectedUserId(""); }}
                      className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingToLevel(level.levelId); setSelectedUserId(""); }}
                    disabled={unassignedEligible.length === 0}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {unassignedEligible.length === 0 ? "All eligible users assigned" : "Add Approver"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How multi-approver levels work</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
              <li><strong>Any One (default):</strong> The first assigned approver to act advances the workflow. Others are notified but no longer need to act.</li>
              <li><strong>Consensus:</strong> Every assigned approver must approve before the workflow advances. A single rejection still stops the workflow immediately.</li>
              <li>Only active users with the <em>approver</em> or <em>admin</em> role can be assigned.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
