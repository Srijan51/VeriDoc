"use client";

import React from "react";

type Severity = "critical" | "high" | "medium" | "low";

interface SeverityBadgeProps {
  severity: Severity;
  label?: string;
}

const severityConfig: Record<Severity, { bg: string; text: string; border: string; glow?: boolean }> = {
  critical: { bg: "#FFF0F0", text: "#FF3B3B", border: "#FFB3B3", glow: true },
  high: { bg: "#FFF4EF", text: "#FF6B35", border: "#FFCDB8" },
  medium: { bg: "#FFFBF0", text: "#F5A623", border: "#FFE8A3" },
  low: { bg: "#F5F5F5", text: "#8E8E93", border: "#DEDEDE" },
};

export default function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const displayLabel = label || severity.toUpperCase();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
        config.glow ? "animate-pulse-glow" : ""
      }`}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      {displayLabel}
    </span>
  );
}
