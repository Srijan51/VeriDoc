"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { queryDocuments } from "@/lib/api";

interface ContradictionCard {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  topic: string;
  sourceA: string;
  claimA: string;
  sourceB: string;
  claimB: string;
  authoritySource: string;
  reason: string;
}

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<ContradictionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeverity, setActiveSeverity] = useState("All");

  useEffect(() => {
    const fetchContradictions = async () => {
      try {
        setIsLoading(true);
        const response = await queryDocuments(
          "List all contradictions in the documents",
          [],
          20
        );

        // Map the contradictions from the response
        const mapped = response.contradictions.map((contradiction, idx) => ({
          id: `contradiction-${idx}`,
          severity: (contradiction.severity.toUpperCase() === "CRITICAL"
            ? "critical"
            : contradiction.severity.toUpperCase() === "HIGH"
            ? "high"
            : contradiction.severity.toUpperCase() === "MEDIUM"
            ? "medium"
            : "low") as "critical" | "high" | "medium" | "low",
          topic: contradiction.topic,
          sourceA: contradiction.source_a,
          claimA: contradiction.claim_a,
          sourceB: contradiction.source_b,
          claimB: contradiction.claim_b,
          authoritySource: contradiction.authoritative_source,
          reason: contradiction.reason,
        }));

        setContradictions(mapped);
      } catch (error) {
        console.error("Failed to fetch contradictions", error);
      } finally {
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
            {contradictions.map((contradiction) => (
              <div
                key={contradiction.id}
                className="glass-card rounded-xl border border-white/60 p-6 shadow-sm"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor:
                    contradiction.severity === "critical"
                      ? "var(--severity-critical)"
                      : contradiction.severity === "high"
                      ? "var(--severity-high)"
                      : contradiction.severity === "medium"
                      ? "#F5A623"
                      : "#8E8E93",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3
                      className="text-[15px] font-bold mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {contradiction.topic}
                    </h3>
                    <p className="text-[12px] text-text-muted">
                      Detected in {contradiction.sourceA} and{" "}
                      {contradiction.sourceB}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold text-white ${
                      contradiction.severity === "critical"
                        ? "bg-severity-critical"
                        : contradiction.severity === "high"
                        ? "bg-severity-high"
                        : contradiction.severity === "medium"
                        ? "bg-amber-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {contradiction.severity.toUpperCase()}
                  </span>
                </div>

                {/* Contradiction Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-white/20 border border-border/50">
                    <p className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-wider">
                      {contradiction.sourceA}
                    </p>
                    <p className="text-[12px] text-text-primary leading-relaxed">
                      {contradiction.claimA}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/20 border border-border/50">
                    <p className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-wider">
                      {contradiction.sourceB}
                    </p>
                    <p className="text-[12px] text-text-primary leading-relaxed">
                      {contradiction.claimB}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-start justify-between pt-3 border-t border-border/50">
                  <div>
                    <p className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                      Authoritative Source
                    </p>
                    <p className="text-[12px] text-text-primary font-medium">
                      {contradiction.authoritySource}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-2">
                      {contradiction.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
