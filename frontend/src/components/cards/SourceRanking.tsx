"use client";

import React from "react";

interface SourceDoc {
  rank: number;
  name: string;
  type: "pdf" | "docx";
  score: number;
}

// TODO: Replace this hardcoded ranking list and scores with real backend data.
const documents: SourceDoc[] = [
  { rank: 1, name: "HR Policy.pdf", type: "pdf", score: 98 },
  { rank: 2, name: "Employee Handbook.pdf", type: "pdf", score: 92 },
  { rank: 3, name: "Leave Policy.docx", type: "docx", score: 88 },
  { rank: 4, name: "Benefits Guide.pdf", type: "pdf", score: 76 },
  { rank: 5, name: "Company Guidelines.pdf", type: "pdf", score: 65 },
];

const typeColors: Record<string, string> = {
  pdf: "#FF3B3B",
  docx: "#38BDF8",
};

export default function SourceRanking() {
  return (
    <div id="source-ranking" className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-[16px] font-bold"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}
        >
          Source Authority Ranking
        </h3>
        <button
          className="text-[12px] font-medium flex items-center gap-1 hover:underline"
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
      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.rank} className="flex items-center gap-3">
            {/* Rank */}
            <span
              className="text-[12px] font-bold w-4 text-center flex-shrink-0"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                color: "var(--text-muted)",
              }}
            >
              {doc.rank}
            </span>

            {/* Doc icon */}
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: `${typeColors[doc.type]}15` }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={typeColors[doc.type]}
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>

            {/* Filename */}
            <span
              className="text-[13px] font-medium flex-shrink-0 w-[160px]"
              style={{ color: "var(--text-primary)" }}
            >
              {doc.name}
            </span>

            {/* Score bar */}
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${doc.score}%`,
                    background: "var(--accent-mint)",
                    animation: `barGrow 0.8s ease-out both`,
                  }}
                />
              </div>
              <span
                className="text-[12px] font-bold flex-shrink-0"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: "var(--text-primary)",
                }}
              >
                {doc.score}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
