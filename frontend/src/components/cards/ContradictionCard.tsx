"use client";

import React from "react";
import SeverityBadge from "@/components/ui/SeverityBadge";

export default function ContradictionCard() {
  return (
    <div id="contradiction-card" className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3
          className="text-[16px] font-bold"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}
        >
          Contradiction Comparison
        </h3>
        <button
          className="text-[12px] font-medium flex items-center gap-1 hover:underline"
          style={{ color: "var(--accent-mint)" }}
        >
          View full comparison
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Source Headers */}
      <div className="flex px-6 pb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(255,59,59,0.1)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF3B3B" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Leave Policy.pdf
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Human Resources Department
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Updated: Jun 18, 2024
          </p>
        </div>
        <div className="flex-1 pl-6">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(56,189,248,0.1)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Employee Handbook.pdf
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            People Operations
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Updated: Mar 02, 2024
          </p>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="flex mx-6 mb-4 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {/* Source A */}
        <div className="flex-1 p-4" style={{ borderLeft: "3px solid #FF3B3B" }}>
          <p className="text-[10px] uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Policy Statement
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Employees are entitled to{" "}
            <span
              className="font-bold px-1 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: "var(--severity-critical)",
                background: "rgba(255,59,59,0.08)",
              }}
            >
              15 days
            </span>{" "}
            of paid leave per year.
          </p>
          {/* Authority bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Source Authority</span>
              <span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-primary)" }}>
                98/100
              </span>
            </div>
            <div className="w-full h-1 rounded-full" style={{ background: "var(--bg-secondary)" }}>
              <div className="h-full rounded-full" style={{ width: "98%", background: "var(--accent-mint)" }} />
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
          <span className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>VS</span>
        </div>

        {/* Source B */}
        <div className="flex-1 p-4" style={{ borderLeft: "3px solid #38BDF8" }}>
          <p className="text-[10px] uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Policy Statement
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Employees are entitled to{" "}
            <span
              className="font-bold px-1 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: "var(--severity-high)",
                background: "rgba(255,107,53,0.08)",
              }}
            >
              12 days
            </span>{" "}
            of paid leave per year.
          </p>
          {/* Authority bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Source Authority</span>
              <span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-primary)" }}>
                92/100
              </span>
            </div>
            <div className="w-full h-1 rounded-full" style={{ background: "var(--bg-secondary)" }}>
              <div className="h-full rounded-full" style={{ width: "92%", background: "var(--accent-mint)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Warning */}
      <div
        className="flex items-center gap-2 px-6 py-3"
        style={{
          background: "rgba(255,107,53,0.04)",
          borderTop: "1px solid rgba(255,107,53,0.1)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--severity-high)" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-[12px] italic" style={{ color: "var(--severity-high)" }}>
          This contradiction affects all full-time employees
        </p>
        <div className="ml-auto">
          <SeverityBadge severity="high" />
        </div>
      </div>
    </div>
  );
}
