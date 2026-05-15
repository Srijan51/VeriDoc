"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { queryDocuments, fetchDocuments } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";

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
  const [documentCount, setDocumentCount] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchContradictions = async () => {
      try {
        setIsLoading(true);

        // First fetch document count
        const docResponse = await fetchDocuments();
        setDocumentCount(docResponse.total);

        if (docResponse.total === 0) {
          setContradictions([]);
          addToast("No documents found. Upload documents to detect contradictions.", "info");
          return;
        }

        // Run multiple queries to find contradictions
        const queries = [
          "What are the key policies and their requirements?",
          "Are there any conflicting statements or policies?",
          "What are the differences in document recommendations?",
          "List all document recommendations and conflicts",
        ];

        const allContradictions: ContradictionCard[] = [];
        const seenTopics = new Set<string>();

        for (const query of queries) {
          try {
            const response = await queryDocuments(query, [], 10);

            if (response.contradictions && response.contradictions.length > 0) {
              response.contradictions.forEach((contradiction, idx) => {
                const topicKey = `${contradiction.topic}-${contradiction.source_a}-${contradiction.source_b}`;
                
                if (!seenTopics.has(topicKey)) {
                  seenTopics.add(topicKey);
                  
                  const severity = (
                    contradiction.severity.toUpperCase() === "CRITICAL"
                      ? "critical"
                      : contradiction.severity.toUpperCase() === "HIGH"
                      ? "high"
                      : contradiction.severity.toUpperCase() === "MEDIUM"
                      ? "medium"
                      : "low"
                  ) as "critical" | "high" | "medium" | "low";

                  allContradictions.push({
                    id: `contradiction-${allContradictions.length}`,
                    severity,
                    topic: contradiction.topic,
                    sourceA: contradiction.source_a,
                    claimA: contradiction.claim_a,
                    sourceB: contradiction.source_b,
                    claimB: contradiction.claim_b,
                    authoritySource: contradiction.authoritative_source,
                    reason: contradiction.reason,
                  });
                }
              });
            }
          } catch (error) {
            // Continue with next query
            console.warn("Query failed:", error);
          }
        }

        setContradictions(allContradictions);

        if (allContradictions.length === 0) {
          addToast("✅ No contradictions detected!", "success");
        } else {
          addToast(`Found ${allContradictions.length} contradiction(s)`, "warning");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch contradictions";
        addToast(errorMessage, "error");
        setContradictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContradictions();
  }, [addToast]);

  const filteredContradictions = contradictions.filter((c) => {
    if (activeSeverity === "All") return true;
    return c.severity === activeSeverity.toLowerCase();
  });

  const severityCounts = {
    Critical: contradictions.filter((c) => c.severity === "critical").length,
    High: contradictions.filter((c) => c.severity === "high").length,
    Medium: contradictions.filter((c) => c.severity === "medium").length,
    Low: contradictions.filter((c) => c.severity === "low").length,
  };

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
              onClick={() => window.location.reload()}
            >
              🔄 Rescan
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="mt-8">
          <LoadingSkeleton />
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      ) : contradictions.length === 0 ? (
        <EmptyState
          title="No Contradictions Found"
          description="Your documents are consistent and free of contradictions."
          icon="✅"
        />
      ) : (
        <>
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
                  {filter} {filter !== "All" && `(${severityCounts[filter as keyof typeof severityCounts]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Critical",
                count: severityCounts.Critical,
                color: "var(--severity-critical)",
              },
              {
                label: "High",
                count: severityCounts.High,
                color: "var(--severity-high)",
              },
              { label: "Medium", count: severityCounts.Medium, color: "#F5A623" },
              { label: "Low", count: severityCounts.Low, color: "#8E8E93" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-xl border border-white/60 p-4 flex flex-col justify-center shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  ></div>
                  <p className="text-[12px] text-text-muted">{stat.label}</p>
                </div>
                <p
                  className="text-[28px] font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.count}
                </p>
              </div>
            ))}
          </div>

          {/* Contradictions List */}
          <div className="space-y-4">
            {filteredContradictions.length === 0 ? (
              <EmptyState
                title={`No ${activeSeverity} Contradictions`}
                description={`There are no ${activeSeverity.toLowerCase()} severity contradictions found.`}
              />
            ) : (
              filteredContradictions.map((contradiction) => (
                <div
                  key={contradiction.id}
                  className="glass-card rounded-xl border border-white/60 p-6 shadow-sm hover:border-white/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            contradiction.severity === "critical"
                              ? "var(--severity-critical)"
                              : contradiction.severity === "high"
                              ? "var(--severity-high)"
                              : contradiction.severity === "medium"
                              ? "#F5A623"
                              : "#8E8E93",
                        }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[16px] font-bold text-text-primary">
                            {contradiction.topic}
                          </h3>
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                            style={{
                              backgroundColor:
                                contradiction.severity === "critical"
                                  ? "var(--severity-critical)"
                                  : contradiction.severity === "high"
                                  ? "var(--severity-high)"
                                  : contradiction.severity === "medium"
                                  ? "#F5A623"
                                  : "#8E8E93",
                            }}
                          >
                            {contradiction.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[13px] text-text-secondary mb-4">
                          {contradiction.reason}
                        </p>

                        {/* Source Claims */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-white/20 border border-white/40">
                            <p className="text-[11px] font-bold text-text-primary mb-1">
                              Source A
                            </p>
                            <p className="text-[12px] text-text-muted mb-2 font-medium">
                              {contradiction.sourceA}
                            </p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">
                              "{contradiction.claimA}"
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/20 border border-white/40">
                            <p className="text-[11px] font-bold text-text-primary mb-1">
                              Source B
                            </p>
                            <p className="text-[12px] text-text-muted mb-2 font-medium">
                              {contradiction.sourceB}
                            </p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">
                              "{contradiction.claimB}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Authority Source */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/40">
                    <div>
                      <p className="text-[11px] text-text-muted mb-1">Authoritative Source</p>
                      <p className="text-[12px] font-medium text-accent-mint">
                        {contradiction.authoritySource}
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-white/60 glass-panel text-[12px] font-medium text-text-primary hover:bg-white/40 transition-colors">
                      Review Sources
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
