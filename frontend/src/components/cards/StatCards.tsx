"use client";

import React from "react";

interface Stat {
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  icon: React.ReactNode;
  bars: number[];
}

const stats: Stat[] = [
  {
    label: "Documents Analyzed",
    value: "3,875",
    trend: "+12% vs last month",
    trendPositive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    bars: [40, 55, 35, 65, 50, 75, 60, 80],
  },
  {
    label: "Contradictions Detected",
    value: "128",
    trend: "+8% vs last month",
    trendPositive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    bars: [30, 45, 60, 40, 70, 55, 80, 65],
  },
  {
    label: "Outdated Documents",
    value: "312",
    trend: "+18% vs last month",
    trendPositive: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    bars: [50, 40, 60, 45, 70, 55, 65, 75],
  },
  {
    label: "Queries Answered",
    value: "1,245",
    trend: "+24% vs last month",
    trendPositive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    bars: [35, 50, 45, 60, 55, 70, 65, 85],
  },
  {
    label: "Time Saved",
    value: "240 hrs",
    trend: "+30% vs last month",
    trendPositive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    bars: [45, 55, 50, 65, 60, 75, 70, 90],
  },
];

export default function StatCards() {
  return (
    <div id="stat-cards" className="grid grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="card animate-slide-up"
          style={{
            opacity: 0,
            animationFillMode: "forwards",
            animationDelay: `${400 + i * 100}ms`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <p
              className="text-[12px] font-medium leading-tight"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </p>
            {stat.icon}
          </div>

          {/* Value */}
          <p
            className="text-[28px] font-bold leading-none mb-1"
            style={{
              fontFamily: "var(--font-heading), system-ui, sans-serif",
              color: "var(--text-primary)",
            }}
          >
            {stat.value}
          </p>

          {/* Trend */}
          <p
            className="text-[11px] font-medium mb-3"
            style={{
              color: stat.trendPositive ? "var(--accent-mint)" : "var(--severity-critical)",
            }}
          >
            {stat.trend}
          </p>

          {/* Sparkline */}
          <div className="flex items-end gap-[3px] h-[40px]">
            {stat.bars.map((h, j) => (
              <div
                key={j}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background:
                    j === stat.bars.length - 1
                      ? "var(--accent-mint)"
                      : "rgba(0,201,167,0.15)",
                  transformOrigin: "bottom",
                  animation: `sparklineGrow 0.6s ease-out ${j * 60}ms both`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
