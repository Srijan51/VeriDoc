"use client";

import React, { useEffect, useRef } from "react";

export default function ConfidenceScore() {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    if (circle) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference - (92 / 100) * circumference;
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = `${circumference}`;
      // Trigger animation
      requestAnimationFrame(() => {
        circle.style.transition = "stroke-dashoffset 1s ease-in-out";
        circle.style.strokeDashoffset = `${offset}`;
      });
    }
  }, []);

  return (
    <div id="confidence-score" className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <h3
          className="text-[16px] font-bold leading-tight flex-1 min-w-0"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}
        >
          AI Confidence Score
        </h3>
        <button
          className="text-[12px] font-medium flex items-center gap-1 hover:underline flex-shrink-0 mt-0.5"
          style={{ color: "var(--accent-mint)" }}
        >
          View details
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Donut Chart */}
        <div className="relative w-[130px] h-[130px] flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--bg-secondary)"
              strokeWidth="8"
            />
            {/* Value arc */}
            <circle
              ref={circleRef}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#mintGradient)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="mintGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-mint)" />
                <stop offset="100%" stopColor="var(--accent-teal)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[36px] font-bold leading-none"
              style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-primary)" }}
            >
              92%
            </span>
            <span
              className="text-[12px] font-medium mt-1"
              style={{ color: "var(--accent-mint)" }}
            >
              Very High Confidence
            </span>
          </div>
        </div>

        {/* Legend — 3 rows as per spec */}
        <div className="w-full mt-2 space-y-2.5">
          <LegendItem color="var(--accent-mint)" label="High Confidence" count={23} />
          <LegendItem color="var(--severity-medium)" label="Medium Confidence" count={5} />
          <LegendItem color="var(--severity-low)" label="Low Confidence" count={2} />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[13px] flex-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span
        className="text-[13px] font-bold"
        style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-primary)" }}
      >
        {count}
      </span>
    </div>
  );
}
