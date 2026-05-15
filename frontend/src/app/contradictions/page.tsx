"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface Contradiction {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  detectedAt: string;
  docA: {
    name: string;
    department: string;
    updatedAt: string;
    statement: string;
    authorityScore: number;
  };
  docB: {
    name: string;
    department: string;
    updatedAt: string;
    statement: string;
    authorityScore: number;
  };
  impact: string;
  recommendation: string;
  resolved: boolean;
}

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeverity, setActiveSeverity] = useState("All");

  useEffect(() => {
    // Backend-ready fetch implementation
    const fetchContradictions = async () => {
      try {
        setIsLoading(true);
        // FIXME: Connect to real backend
        // const response = await fetch('/api/contradictions');
        // const data = await response.json();
        // setContradictions(data);

        // Simulating a backend that returns an empty array initially
        setTimeout(() => {
          setContradictions([]);
          setIsLoading(false);
        }, 600);
      } catch (error) {
        console.error("Failed to fetch contradictions", error);
        setIsLoading(false);
      }
    };

    fetchContradictions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-8 animate-fade-in">
      <PageHeader
        title="Contradictions"
        badge={
          <span
            className="px-3 py-1 rounded-full text-[12px] font-bold"
            style={{ backgroundColor: "#FFF4EF", color: "#FF6B35" }}
          >
            {contradictions.length} detected
          </span>
        }
        actions={
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-[13px] font-semibold border border-white/60 glass-panel text-text-primary hover:bg-white/40 transition-all">
              ↓ Export Report
            </button>
            <button
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "var(--accent-mint)" }}
            >
              Run Full Scan
            </button>
          </div>
        }
      />

      {/* Filter Strip */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          {["All", "Critical", "High", "Medium", "Low"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveSeverity(filter)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                activeSeverity === filter
                  ? "bg-text-primary text-white"
                  : "glass-panel border-white/60 text-text-primary hover:bg-white/40"
              }`}
            >
              {filter !== "All" && (
                <span
                  className="mr-2 inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      filter === "Critical"
                        ? "var(--severity-critical)"
                        : filter === "High"
                        ? "var(--severity-high)"
                        : filter === "Medium"
                        ? "#F5A623"
                        : "#8E8E93",
                  }}
                ></span>
              )}
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 rounded-lg border border-border glass-panel text-[13px] font-medium outline-none focus:border-accent-mint">
            <option>All Categories ▾</option>
            <option>HR Policies</option>
            <option>IT Security</option>
            <option>Finance</option>
            <option>Compliance</option>
          </select>
          <select className="px-3 py-1.5 rounded-lg border border-border glass-panel text-[13px] font-medium outline-none focus:border-accent-mint">
            <option>Most Severe ▾</option>
            <option>Newest ▾</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Critical", count: 0, color: "var(--severity-critical)" },
          { label: "High", count: 0, color: "var(--severity-high)" },
          { label: "Medium", count: 0, color: "#F5A623" },
          { label: "Low", count: 0, color: "#8E8E93" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl border border-white/60 p-4 flex flex-col justify-center shadow-sm"
            style={{ borderLeft: `3px solid ${stat.color}` }}
          >
            <span
              className="text-[24px] font-bold"
              style={{
                fontFamily: "var(--font-body), system-ui, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              {stat.count}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Contradiction Cards / States */}
      <div>
        {isLoading ? (
          <LoadingSkeleton variant="card" rows={3} />
        ) : contradictions.length === 0 ? (
          <EmptyState
            icon={
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            title="All clear — no contradictions found"
            description="Your documents are fully consistent."
          />
        ) : (
          <div className="space-y-6">
            {/* Contradiction Cards will map here once backend provides data */}
          </div>
        )}
      </div>
    </div>
  );
}
