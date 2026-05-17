"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { fetchDocuments, queryDocuments, Contradiction } from "@/lib/api";
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

function severityToCardLevel(severity: string): ContradictionCard["severity"] {
  const normalized = severity.toUpperCase();
  if (normalized === "CRITICAL") return "critical";
  if (normalized === "HIGH") return "high";
  if (normalized === "MEDIUM") return "medium";
  return "low";
}

function toCard(contradiction: Contradiction, index: number): ContradictionCard {
  return {
    id: `contradiction-${index}`,
    severity: severityToCardLevel(contradiction.severity),
    topic: contradiction.topic,
    sourceA: contradiction.source_a,
    claimA: contradiction.claim_a,
    sourceB: contradiction.source_b,
    claimB: contradiction.claim_b,
    authoritySource: contradiction.authoritative_source,
    reason: contradiction.reason,
  };
}

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<ContradictionCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState("All");
  const [documentCount, setDocumentCount] = useState(0);
  const [scanSource, setScanSource] = useState<"ai" | "manual" | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const loadCount = async () => {
      try {
        const docResponse = await fetchDocuments();
        setDocumentCount(docResponse.total);
      } catch {
        setDocumentCount(0);
      }
    };
    void loadCount();

    const transferred = sessionStorage.getItem("veridoc_detected_contradictions");
    if (transferred) {
      try {
        const rawContradictions: Contradiction[] = JSON.parse(transferred);
        if (rawContradictions.length > 0) {
          const cards = rawContradictions.map((c, i) => toCard(c, i));
          setContradictions(cards);
          setHasScanned(true);
          setScanSource("ai");
          addToast(`Loaded ${cards.length} contradiction(s) from AI analysis`, "warning");
        }
      } catch {
        console.warn("Failed to parse transferred contradictions");
      }
      sessionStorage.removeItem("veridoc_detected_contradictions");
    } else {
      const scanned = sessionStorage.getItem("veridoc_scanned_contradictions");
      if (scanned) {
        try {
          const cards: ContradictionCard[] = JSON.parse(scanned);
          if (cards.length > 0) {
            setContradictions(cards);
            setHasScanned(true);
            setScanSource("manual");
          }
        } catch {
          console.warn("Failed to parse scanned contradictions");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    try {
      setIsLoading(true);
      setHasScanned(true);
      setScanSource("manual");

      const docResponse = await fetchDocuments();
      setDocumentCount(docResponse.total);

      if (docResponse.total === 0) {
        setContradictions([]);
        addToast("No documents found. Upload documents to detect contradictions.", "info");
        return;
      }

      const queries = [
        "Compare all document policies and identify any conflicting statements or contradictions",
        "What are the key requirements across all documents? Are there any differences?",
      ];

      const seen = new Set<string>();
      const collected: ContradictionCard[] = [];

      // Normalize dedup key: lowercase topic + sorted source pair
      const makeKey = (topic: string, srcA: string, srcB: string) => {
        const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
        const sources = [srcA.toLowerCase(), srcB.toLowerCase()].sort().join('|');
        return `${normalizedTopic}::${sources}`;
      };

      for (const query of queries) {
        try {
          const response = await queryDocuments(query, [], 10);
          for (const contradiction of response.contradictions) {
            const key = makeKey(contradiction.topic, contradiction.source_a, contradiction.source_b);
            if (seen.has(key)) continue;
            seen.add(key);
            collected.push(toCard(contradiction, collected.length));
          }
        } catch (error) {
          console.warn("Query failed:", error);
        }
      }

      setContradictions(collected);
      try {
        sessionStorage.setItem("veridoc_scanned_contradictions", JSON.stringify(collected));
      } catch {}
      addToast(
        collected.length === 0 ? "✅ No contradictions detected!" : `Found ${collected.length} contradiction(s)`,
        collected.length === 0 ? "success" : "warning"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch contradictions";
      addToast(message, "error");
      setContradictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContradictions = useMemo(
    () => (activeSeverity === "All" ? contradictions : contradictions.filter((item) => item.severity === activeSeverity.toLowerCase())),
    [activeSeverity, contradictions]
  );

  const severityCounts = useMemo(
    () => ({
      Critical: contradictions.filter((item) => item.severity === "critical").length,
      High: contradictions.filter((item) => item.severity === "high").length,
      Medium: contradictions.filter((item) => item.severity === "medium").length,
      Low: contradictions.filter((item) => item.severity === "low").length,
    }),
    [contradictions]
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-8 animate-fade-in">
      <PageHeader
        title="Contradictions"
        badge={<span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ backgroundColor: "#FFF4EF", color: "#FF6B35" }}>{contradictions.length} detected</span>}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => addToast("Export coming soon!", "info")}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold border border-white/60 glass-panel text-text-primary hover:bg-white/40 transition-all"
            >
              Export Report
            </button>
            <button
              onClick={runScan}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-mint)" }}
            >
              {isLoading ? "Scanning..." : "Scan for Contradictions"}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="mt-8">
          <div className="text-center mb-4">
            <p className="text-[13px] text-text-muted animate-pulse">Scanning {documentCount} document{documentCount !== 1 ? "s" : ""} for contradictions...</p>
          </div>
          <LoadingSkeleton variant="card" rows={3} />
        </div>
      ) : !hasScanned ? (
        <EmptyState
          title="Ready to Scan"
          description={`Click "Scan for Contradictions" to analyze ${documentCount} document${documentCount !== 1 ? "s" : ""} for conflicts and inconsistencies.`}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          action={{ label: "Scan Now", onClick: runScan }}
        />
      ) : contradictions.length === 0 ? (
        <EmptyState
          title="No Contradictions Found"
          description="Your documents are consistent and free of contradictions."
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
          }
        />
      ) : (
        <>
          {/* Source Banner */}
          {scanSource === "ai" && (
            <div className="mb-6 p-4 rounded-xl glass-card border border-accent-mint/30 flex items-center justify-between" style={{ backgroundColor: "rgba(0, 201, 167, 0.05)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-mint/15 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">Detected by AI Assistant</p>
                  <p className="text-[11px] text-text-muted">These contradictions were found during your AI conversation</p>
                </div>
              </div>
              <button
                onClick={runScan}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-[12px] font-medium border border-accent-mint/40 text-accent-mint hover:bg-accent-mint/10 transition-all disabled:opacity-50"
              >
                Run Full Scan
              </button>
            </div>
          )}
          {scanSource === "manual" && (
            <div className="mb-6 p-3 rounded-xl glass-card border border-white/60 flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-[12px] text-text-muted">Full document scan completed across {documentCount} document{documentCount !== 1 ? "s" : ""}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Critical", "High", "Medium", "Low"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveSeverity(filter)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${activeSeverity === filter ? "bg-text-primary text-white" : "glass-panel border-white/60 text-text-primary hover:bg-white/40"}`}
                >
                  {filter}
                  {filter !== "All" && <span className="ml-2">({severityCounts[filter]})</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Critical", count: severityCounts.Critical, color: "var(--severity-critical)" },
              { label: "High", count: severityCounts.High, color: "var(--severity-high)" },
              { label: "Medium", count: severityCounts.Medium, color: "#F5A623" },
              { label: "Low", count: severityCounts.Low, color: "#8E8E93" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl border border-white/60 p-4 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <p className="text-[12px] text-text-muted">{stat.label}</p>
                </div>
                <p className="text-[28px] font-bold" style={{ color: stat.color }}>{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {filteredContradictions.length === 0 ? (
              <EmptyState
                title={`No ${activeSeverity} Contradictions`}
                description={`There are no ${activeSeverity.toLowerCase()} severity contradictions found.`}
                icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>}
              />
            ) : (
              filteredContradictions.map((contradiction) => (
                <div key={contradiction.id} className="glass-card rounded-xl border border-white/60 p-6 shadow-sm hover:border-white/80 transition-colors" style={{ borderLeftWidth: "4px", borderLeftColor: contradiction.severity === "critical" ? "var(--severity-critical)" : contradiction.severity === "high" ? "var(--severity-high)" : contradiction.severity === "medium" ? "#F5A623" : "#8E8E93" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: contradiction.severity === "critical" ? "var(--severity-critical)" : contradiction.severity === "high" ? "var(--severity-high)" : contradiction.severity === "medium" ? "#F5A623" : "#8E8E93" }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[16px] font-bold text-text-primary">{contradiction.topic}</h3>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: contradiction.severity === "critical" ? "var(--severity-critical)" : contradiction.severity === "high" ? "var(--severity-high)" : contradiction.severity === "medium" ? "#F5A623" : "#8E8E93" }}>
                            {contradiction.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[13px] text-text-secondary mb-4">{contradiction.reason}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-white/20 border border-white/40">
                            <p className="text-[11px] font-bold text-text-primary mb-1">Source A</p>
                            <p className="text-[12px] text-text-muted mb-2 font-medium">{contradiction.sourceA}</p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">"{contradiction.claimA}"</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/20 border border-white/40">
                            <p className="text-[11px] font-bold text-text-primary mb-1">Source B</p>
                            <p className="text-[12px] text-text-muted mb-2 font-medium">{contradiction.sourceB}</p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">"{contradiction.claimB}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/40">
                    <div>
                      <p className="text-[11px] text-text-muted mb-1">Authoritative Source</p>
                      <p className="text-[12px] font-medium text-accent-mint">{contradiction.authoritySource}</p>
                    </div>
                    <button
                      onClick={() => addToast("Opening source comparison...", "info")}
                      className="px-4 py-2 rounded-lg border border-white/60 glass-panel text-[12px] font-medium text-text-primary hover:bg-white/40 transition-colors"
                    >
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