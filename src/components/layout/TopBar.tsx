"use client";

import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { formatDateTime } from "@/lib/workflowEngine";

export default function TopBar({ title }: { title?: string }) {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                {unreadNotifications > 0 && (
                  <button
                    onClick={() => {
                      markAllNotificationsRead();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.notificationId}
                      onClick={() => markNotificationRead(n.notificationId)}
                      className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !n.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.type === "rejected"
                              ? "bg-red-500"
                              : n.type === "final_completion"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.sentDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Date */}
        <div className="text-xs text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}
