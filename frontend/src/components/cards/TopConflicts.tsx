"use client";

import React from "react";
import SeverityBadge from "@/components/ui/SeverityBadge";

interface ConflictCategory {
  name: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
}

const categories: ConflictCategory[] = [
  { name: "HR Policies", count: 23, severity: "high" },
  { name: "Leave & Attendance", count: 17, severity: "high" },
  { name: "Compensation", count: 14, severity: "medium" },
  { name: "IT & Security", count: 11, severity: "medium" },
  { name: "Remote Work", count: 9, severity: "low" },
];

export default function TopConflicts() {
  return (
    <div id="top-conflicts" className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <h3
          className="text-[16px] font-bold leading-tight flex-1 min-w-0"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}
        >
          Top Conflict Categories
        </h3>
        <button
          className="text-[12px] font-medium flex items-center gap-1 hover:underline flex-shrink-0 mt-0.5"
          style={{ color: "var(--accent-mint)" }}
        >
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-bg-primary gap-3"
          >
            <div className="flex-1 min-w-0">
              <span
                className="text-[13px] font-medium leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-[12px] font-bold"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: "var(--text-muted)",
                }}
              >
                {cat.count}
              </span>
              <SeverityBadge severity={cat.severity} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
