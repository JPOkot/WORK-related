import type { RequestStatus } from "@/types";
import { getStatusLabel, getStatusColor } from "@/lib/workflowEngine";

interface StatusBadgeProps {
  status: RequestStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClass} ${sizeClass}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "completed"
            ? "bg-green-500"
            : status === "rejected"
            ? "bg-red-500"
            : status === "draft"
            ? "bg-gray-400"
            : "bg-orange-400"
        }`}
      />
      {label}
    </span>
  );
}
