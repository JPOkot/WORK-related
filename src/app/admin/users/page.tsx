"use client";

import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/lib/AppContext";
import type { User, UserRole } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ["initiator", "approver", "admin", "auditor"];

const DEPARTMENTS = [
  "Human Resources",
  "IT",
  "Finance",
  "Security",
  "Administration",
  "Compliance",
  "Operations",
  "Risk Management",
  "Legal",
  "Other",
];

const ROLE_COLORS: Record<UserRole, string> = {
  initiator: "bg-blue-100 text-blue-800",
  approver: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
  auditor: "bg-green-100 text-green-800",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = "add" | "edit" | null;

interface FormState {
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  role: "initiator",
  department: "Human Resources",
};

interface ImportRow {
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  _rowError?: string; // validation message
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseRole(raw: string): UserRole | null {
  const v = raw.trim().toLowerCase();
  if (ROLES.includes(v as UserRole)) return v as UserRole;
  return null;
}

function normaliseStatus(raw: string): "active" | "inactive" {
  return raw.trim().toLowerCase() === "inactive" ? "inactive" : "active";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { users, addUser, updateUser, toggleUserStatus, bulkImportUsers } = useApp();

  // ── Table filters ──
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // ── Add / Edit modal ──
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // ── Excel import ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === "" ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  // ── Modal helpers ──
  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditingUser(null);
    setModalMode("add");
  }

  function openEdit(user: User) {
    setForm({ fullName: user.fullName, email: user.email, role: user.role, department: user.department });
    setFormError("");
    setEditingUser(user);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingUser(null);
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { setFormError("Full name is required."); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("A valid email address is required.");
      return;
    }
    const duplicate = users.find(
      (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.userId !== editingUser?.userId
    );
    if (duplicate) { setFormError("A user with this email already exists."); return; }

    if (modalMode === "add") {
      addUser({ fullName: form.fullName.trim(), email: form.email.trim(), role: form.role, department: form.department });
    } else if (modalMode === "edit" && editingUser) {
      updateUser(editingUser.userId, { fullName: form.fullName.trim(), email: form.email.trim(), role: form.role, department: form.department });
    }
    closeModal();
  }

  // ── Excel upload ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSuccess(null);
    setImportError(null);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Convert to array of objects; header row is row 1
        const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (raw.length === 0) {
          setImportError("The spreadsheet appears to be empty.");
          setImportRows(null);
          return;
        }

        // Normalise column names (case-insensitive, trim whitespace)
        const rows: ImportRow[] = raw.map((r) => {
          // Find columns by fuzzy match
          const get = (keys: string[]) => {
            for (const k of Object.keys(r)) {
              if (keys.some((key) => k.trim().toLowerCase().includes(key))) return String(r[k]).trim();
            }
            return "";
          };

          const fullName = get(["user", "name", "full"]);
          const email = get(["email"]);
          const rawRole = get(["role"]);
          const department = get(["department", "dept"]);
          const rawStatus = get(["status"]);

          const role = normaliseRole(rawRole);
          const status = normaliseStatus(rawStatus);

          let _rowError: string | undefined;
          if (!fullName) _rowError = "Missing user name";
          else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) _rowError = "Invalid email";
          else if (!role) _rowError = `Unknown role "${rawRole}" — must be one of: ${ROLES.join(", ")}`;

          return {
            fullName,
            email,
            role: role ?? "initiator",
            department: department || "Other",
            status,
            _rowError,
          };
        });

        setImportRows(rows);
      } catch {
        setImportError("Could not read the file. Please upload a valid .xlsx or .xls file.");
        setImportRows(null);
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleImportConfirm() {
    if (!importRows) return;
    const validRows = importRows.filter((r) => !r._rowError);
    const count = bulkImportUsers(validRows);
    setImportSuccess(`${count} user${count !== 1 ? "s" : ""} imported successfully.`);
    setImportRows(null);
    setImportFileName("");
  }

  function handleImportCancel() {
    setImportRows(null);
    setImportFileName("");
    setImportError(null);
    setImportSuccess(null);
  }

  // ── Download template ──
  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["User", "Role", "Department", "Status"],
      ["Jane Smith", "initiator", "Human Resources", "active"],
      ["John Doe", "approver", "IT", "active"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "exitflow_users_template.xlsx");
  }

  const activeCount = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;
  const validImportCount = importRows?.filter((r) => !r._rowError).length ?? 0;
  const invalidImportCount = importRows?.filter((r) => !!r._rowError).length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCount} active · {inactiveCount} inactive · {users.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Upload Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Download template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            title="Download Excel template"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Template
          </button>
          {/* Add user */}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* ── Import success banner ── */}
      {importSuccess && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {importSuccess}
          <button onClick={() => setImportSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* ── Import error banner ── */}
      {importError && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {importError}
          <button onClick={() => setImportError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      {/* ── Excel Import Preview Panel ── */}
      {importRows && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Import Preview — <span className="text-slate-500 font-normal">{importFileName}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {validImportCount} valid row{validImportCount !== 1 ? "s" : ""} ready to import
                {invalidImportCount > 0 && (
                  <span className="text-red-600 ml-2">· {invalidImportCount} row{invalidImportCount !== 1 ? "s" : ""} with errors (will be skipped)</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImportCancel}
                className="text-sm border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={validImportCount === 0}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                Import {validImportCount} User{validImportCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">User</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Role</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Department</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importRows.map((row, i) => (
                  <tr key={i} className={row._rowError ? "bg-red-50" : "hover:bg-slate-50"}>
                    <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{row.fullName || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="px-4 py-2 text-slate-600">{row.email || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="px-4 py-2">
                      {row.role && !row._rowError?.includes("role") ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[row.role]}`}>
                          {row.role}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">{row.role || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{row.department || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${row.status === "active" ? "text-green-700" : "text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-green-500" : "bg-slate-400"}`} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row._rowError ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {row._rowError}
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Column mapping hint */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Expected columns:</span>{" "}
            <code className="bg-slate-200 px-1 rounded">User</code>{" "}
            <code className="bg-slate-200 px-1 rounded">Role</code>{" "}
            <code className="bg-slate-200 px-1 rounded">Department</code>{" "}
            <code className="bg-slate-200 px-1 rounded">Status</code>
            {" "}· Valid roles: {ROLES.join(", ")} · Status: active / inactive
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.userId}
                  className={`hover:bg-slate-50 transition-colors ${user.status === "inactive" ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${user.status === "active" ? "bg-blue-500" : "bg-slate-400"}`}>
                        {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "active" ? "text-green-700" : "text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-slate-400"}`} />
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.userId)}
                        className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                          user.status === "active"
                            ? "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                            : "text-green-600 hover:text-green-800 hover:bg-green-50"
                        }`}
                      >
                        {user.status === "active" ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {modalMode === "add" ? "Add New User" : "Edit User"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="e.g. Jane Smith"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. jane.smith@company.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700 mb-1">Role permissions:</p>
                <p><span className="font-medium text-blue-700">Initiator</span> – Can create exit requests</p>
                <p><span className="font-medium text-purple-700">Approver</span> – Can approve/reject at assigned level</p>
                <p><span className="font-medium text-red-700">Admin</span> – Final approval + full access</p>
                <p><span className="font-medium text-green-700">Auditor</span> – Read-only audit trail access</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {modalMode === "add" ? "Add User" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
