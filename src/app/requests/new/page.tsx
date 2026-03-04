"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import TopBar from "@/components/layout/TopBar";
import { getApplicableChecklistItems } from "@/lib/workflowEngine";
import type { ExitType } from "@/types";

const EXIT_TYPES: { value: ExitType; label: string; description: string; icon: string }[] = [
  {
    value: "staff_exit",
    label: "Staff Exit",
    description: "Employee resignation, retirement, or termination",
    icon: "👤",
  },
  {
    value: "vendor_offboarding",
    label: "Vendor Offboarding",
    description: "Contractor or vendor contract termination",
    icon: "🤝",
  },
  {
    value: "project_closure",
    label: "Project Closure",
    description: "Formal closure of a completed or cancelled project",
    icon: "📁",
  },
  {
    value: "change_closure",
    label: "Change Closure",
    description: "Closing a change request after implementation",
    icon: "🔄",
  },
];

export default function NewRequestPage() {
  const router = useRouter();
  const { createRequest } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newRequestId, setNewRequestId] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    exitType: "" as ExitType | "",
    lastWorkingDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.employeeId.trim()) newErrors.employeeId = "Employee/Entity ID is required";
    if (!form.employeeName.trim()) newErrors.employeeName = "Name is required";
    if (!form.department.trim()) newErrors.department = "Department is required";
    if (!form.exitType) newErrors.exitType = "Exit type is required";
    if (!form.lastWorkingDate) newErrors.lastWorkingDate = "Last working date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.exitType) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API call
    const req = createRequest({
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      department: form.department,
      exitType: form.exitType,
      lastWorkingDate: form.lastWorkingDate,
      notes: form.notes,
    });
    setNewRequestId(req.requestId);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const previewItems = form.exitType ? getApplicableChecklistItems(form.exitType) : [];

  if (submitted) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="New Exit Request" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 text-sm mb-1">
              Exit request for <strong>{form.employeeName}</strong> has been created.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Request ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{newRequestId}</code>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              The checklist has been auto-populated with {previewItems.length} items. Level 1 approver has been notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/requests/${newRequestId}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                View Request
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  setForm({ employeeId: "", employeeName: "", department: "", exitType: "", lastWorkingDate: "", notes: "" });
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                New Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="New Exit Request" />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { num: 1, label: "Request Details" },
              { num: 2, label: "Review & Submit" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= s.num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > s.num ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.num ? "text-blue-700" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 1 && <div className="flex-1 h-px bg-gray-200 w-8" />}
              </div>
            ))}
          </div>

          {/* Step 1: Request Details */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Exit Request Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the details for the exit request</p>
              </div>

              {/* Exit Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {EXIT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, exitType: type.value }))}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        form.exitType === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-xl mb-1">{type.icon}</div>
                      <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                    </button>
                  ))}
                </div>
                {errors.exitType && <p className="text-xs text-red-500 mt-1">{errors.exitType}</p>}
              </div>

              {/* Employee/Entity ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.exitType === "vendor_offboarding" ? "Vendor ID" : form.exitType === "project_closure" || form.exitType === "change_closure" ? "Project/CR ID" : "Employee ID"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.employeeId}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    placeholder={form.exitType === "vendor_offboarding" ? "VND-001" : form.exitType === "project_closure" ? "PRJ-001" : "EMP-001"}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.employeeId ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.exitType === "vendor_offboarding" ? "Vendor Name" : form.exitType === "project_closure" || form.exitType === "change_closure" ? "Project/CR Name" : "Full Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.employeeName}
                    onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
                    placeholder="Enter name"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.employeeName ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.employeeName && <p className="text-xs text-red-500 mt-1">{errors.employeeName}</p>}
                </div>
              </div>

              {/* Department & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.department ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select department</option>
                    {["IT", "Finance", "Human Resources", "Operations", "Security", "Risk Management", "Compliance", "Administration"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Working Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.lastWorkingDate}
                    onChange={(e) => setForm((f) => ({ ...f, lastWorkingDate: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastWorkingDate ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.lastWorkingDate && <p className="text-xs text-red-500 mt-1">{errors.lastWorkingDate}</p>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Reason</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Optional: Add any relevant notes or context..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Checklist Preview */}
              {form.exitType && previewItems.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-2">
                    📋 Auto-populated checklist ({previewItems.length} items)
                  </p>
                  <div className="space-y-1">
                    {previewItems.slice(0, 5).map((item) => (
                      <div key={item.itemId} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-xs text-blue-700">{item.itemName}</span>
                        {item.isMandatory && (
                          <span className="text-xs text-red-500 font-medium">*</span>
                        )}
                      </div>
                    ))}
                    {previewItems.length > 5 && (
                      <p className="text-xs text-blue-600 pl-3.5">+{previewItems.length - 5} more items</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Review & Submit →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Review Request</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Exit Type</p>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {EXIT_TYPES.find((t) => t.value === form.exitType)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">ID</p>
                    <p className="font-medium text-gray-900 mt-0.5">{form.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Name</p>
                    <p className="font-medium text-gray-900 mt-0.5">{form.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Department</p>
                    <p className="font-medium text-gray-900 mt-0.5">{form.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Last Working Date</p>
                    <p className="font-medium text-gray-900 mt-0.5">{form.lastWorkingDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Initiated By</p>
                    <p className="font-medium text-gray-900 mt-0.5">Sarah Johnson (You)</p>
                  </div>
                </div>

                {form.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-500 text-xs">Notes</p>
                    <p className="text-sm text-gray-700 mt-0.5">{form.notes}</p>
                  </div>
                )}
              </div>

              {/* Checklist Preview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Checklist Items ({previewItems.length})
                </h3>
                <div className="space-y-2">
                  {previewItems.map((item) => (
                    <div key={item.itemId} className="flex items-center gap-3 py-1.5">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item.itemName}</span>
                        {item.isMandatory && (
                          <span className="ml-1.5 text-xs text-red-500 font-medium">Required</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {item.departmentOwner}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Flow */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Approval Flow</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Line Manager", "HR", "IT", "Finance", "Final Admin"].map((level, idx) => (
                    <div key={level} className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${idx === 0 ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600"}`}>
                        {idx + 1}. {level}
                      </div>
                      {idx < 4 && (
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
