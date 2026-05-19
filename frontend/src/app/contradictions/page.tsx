"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { fetchDocuments, queryDocuments, Contradiction } from "@/lib/api";
import { useToastContext as useToast } from "@/lib/context/ToastContext";

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

function createContradictionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `contradiction-${crypto.randomUUID()}`;
  }

  return `contradiction-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function severityToCardLevel(severity: string): ContradictionCard["severity"] {
  const normalized = severity.toUpperCase();
  if (normalized === "CRITICAL") return "critical";
  if (normalized === "HIGH") return "high";
  if (normalized === "MEDIUM") return "medium";
  return "low";
}

function toCard(contradiction: Contradiction): ContradictionCard {
  return {
    id: createContradictionId(),
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

function normalizeCardIds(cards: ContradictionCard[]): ContradictionCard[] {
  const seen = new Set<string>();

  return cards.map((card) => {
    if (seen.has(card.id)) {
      return { ...card, id: createContradictionId() };
    }

    seen.add(card.id);
    return card;
  });
}

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<ContradictionCard[]>([]);
  const [resolvedContradictions, setResolvedContradictions] = useState<ContradictionCard[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [showTargetedModal, setShowTargetedModal] = useState(false);
  const [allDocs, setAllDocs] = useState<{ id: string; name: string }[]>([]);
  const [selectedTargetDocs, setSelectedTargetDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState("All");
  const [documentCount, setDocumentCount] = useState(0);
  const [scanSource, setScanSource] = useState<"ai" | "manual" | null>(null);
  const [reviewingContradiction, setReviewingContradiction] = useState<ContradictionCard | null>(null);
  const { addToast } = useToast();

  const handleDeleteHistory = (id: string) => {
    const newResolved = resolvedContradictions.filter(c => c.id !== id);
    setResolvedContradictions(newResolved);
    localStorage.setItem("veridoc_resolved_contradictions", JSON.stringify(newResolved));
    addToast("Record deleted from history", "success");
  };

  useEffect(() => {
    const loadCount = async () => {
      try {
        const docResponse = await fetchDocuments();
        setDocumentCount(docResponse.total);
        setAllDocs(docResponse.documents.map(d => ({ id: d.doc_id, name: d.filename })));
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
          const cards = rawContradictions.map((c) => toCard(c));
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
          const cards: ContradictionCard[] = normalizeCardIds(JSON.parse(scanned));
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
    
    try {
      const resolved = localStorage.getItem("veridoc_resolved_contradictions");
      if (resolved) setResolvedContradictions(normalizeCardIds(JSON.parse(resolved)));
    } catch {}
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
            collected.push(toCard(contradiction));
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

  const handleResolve = (id: string) => {
    const item = contradictions.find(c => c.id === id);
    if (!item) return;
    const newResolved = [item, ...resolvedContradictions];
    setResolvedContradictions(newResolved);
    localStorage.setItem("veridoc_resolved_contradictions", JSON.stringify(newResolved));
    
    const newActive = contradictions.filter(c => c.id !== id);
    setContradictions(newActive);
    sessionStorage.setItem("veridoc_scanned_contradictions", JSON.stringify(newActive));
    addToast("Contradiction marked as resolved", "success");
  };

  const runTargetedScan = async () => {
    if (selectedTargetDocs.length < 2) {
      addToast("Please select at least 2 documents", "error");
      return;
    }
    
    setShowTargetedModal(false);
    setIsLoading(true);
    setHasScanned(true);
    setScanSource("manual");
    setViewMode("active");

    try {
      const queries = ["Compare these documents and identify any conflicting statements or contradictions"];
      const seen = new Set<string>();
      const collected: ContradictionCard[] = [];

      const makeKey = (topic: string, srcA: string, srcB: string) => {
        const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
        const sources = [srcA.toLowerCase(), srcB.toLowerCase()].sort().join('|');
        return `${normalizedTopic}::${sources}`;
      };

      for (const query of queries) {
        try {
          const response = await queryDocuments(query, selectedTargetDocs, 10);
          for (const contradiction of response.contradictions) {
            const key = makeKey(contradiction.topic, contradiction.source_a, contradiction.source_b);
            if (seen.has(key)) continue;
            seen.add(key);
            collected.push(toCard(contradiction));
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
      setSelectedTargetDocs([]);
    }
  };

  const currentList = viewMode === "active" ? contradictions : resolvedContradictions;
  
  const filteredContradictions = useMemo(
    () => (activeSeverity === "All" ? currentList : currentList.filter((item) => item.severity === activeSeverity.toLowerCase())),
    [activeSeverity, currentList]
  );

  const severityCounts = useMemo(
    () => ({
      Critical: currentList.filter((item) => item.severity === "critical").length,
      High: currentList.filter((item) => item.severity === "high").length,
      Medium: currentList.filter((item) => item.severity === "medium").length,
      Low: currentList.filter((item) => item.severity === "low").length,
    }),
    [currentList]
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-8 animate-fade-in">
      <PageHeader
        title="Contradictions"
        badge={<span className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ backgroundColor: "#FFF4EF", color: "#FF6B35" }}>{contradictions.length} detected</span>}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => setShowTargetedModal(true)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold border border-white/60 glass-panel text-text-primary hover:bg-white/40 transition-all"
            >
              Targeted Search
            </button>
            <button
              onClick={() => setViewMode(viewMode === "active" ? "history" : "active")}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${viewMode === "history" ? "bg-text-primary text-white border-transparent" : "glass-panel border-white/60 text-text-primary hover:bg-white/40"}`}
            >
              {viewMode === "active" ? "View History" : "View Active"}
            </button>
            <button
              onClick={runScan}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-mint)" }}
            >
              {isLoading ? "Scanning..." : "Scan All"}
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
        <div className="mt-2">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="glass-card rounded-xl p-6 border border-white/60 shadow-sm">
              <h3 className="text-[18px] font-bold text-text-primary mb-5">How It Works</h3>
              <div className="space-y-4">
                {[
                  {
                    number: "1",
                    title: "Upload Documents",
                    description: "Add your policies, handbooks, SOPs and memos",
                  },
                  {
                    number: "2",
                    title: "Run a Scan",
                    description: "VERIDOC analyzes all documents using AI to find conflicts",
                  },
                  {
                    number: "3",
                    title: "Review & Resolve",
                    description: "See contradictions ranked by severity and mark them resolved",
                  },
                ].map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white bg-accent-mint flex-shrink-0 mt-0.5">
                      {step.number}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-text-primary mb-1">{step.title}</p>
                      <p className="text-[12px] text-text-muted leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={runScan}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-mint)" }}
            >
              {isLoading ? "Scanning..." : `Scan Now (${documentCount} document${documentCount !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          title={viewMode === "active" ? "No Contradictions Found" : "No History"}
          description={viewMode === "active" ? "Your documents are consistent and free of contradictions." : "You haven't resolved any contradictions yet."}
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
          {scanSource === "ai" && viewMode === "active" && (
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
          {scanSource === "manual" && viewMode === "active" && (
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewingContradiction(contradiction)}
                        className="px-4 py-2 rounded-lg border border-white/60 glass-panel text-[12px] font-medium text-text-primary hover:bg-white/40 transition-colors"
                      >
                        Review Sources
                      </button>
                      {viewMode === "active" ? (
                        <button
                          onClick={() => handleResolve(contradiction.id)}
                          className="px-4 py-2 rounded-lg bg-accent-teal text-white text-[12px] font-medium hover:bg-accent-mint transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Resolve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteHistory(contradiction.id)}
                          className="px-4 py-2 rounded-lg text-severity-critical border border-severity-critical/30 text-[12px] font-medium hover:bg-severity-critical hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showTargetedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-text-primary">Targeted Search</h2>
              <button onClick={() => setShowTargetedModal(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <p className="text-[13px] text-text-secondary mb-4">Select 2 or more documents to scan exclusively for contradictions between them.</p>
            <div className="flex-1 overflow-y-auto border border-border rounded-xl p-2 mb-4 space-y-1">
              {allDocs.map(doc => (
                <label key={doc.id} className="flex items-center gap-3 p-2 hover:bg-bg-primary rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTargetDocs.includes(doc.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTargetDocs([...selectedTargetDocs, doc.id]);
                      else setSelectedTargetDocs(selectedTargetDocs.filter(id => id !== doc.id));
                    }}
                    className="w-4 h-4 rounded border-border text-accent-mint focus:ring-accent-mint"
                  />
                  <span className="text-[13px] font-medium text-text-primary truncate">{doc.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowTargetedModal(false)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-text-secondary border border-border hover:bg-bg-primary transition-colors">Cancel</button>
              <button
                onClick={runTargetedScan}
                disabled={selectedTargetDocs.length < 2}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent-mint hover:bg-accent-teal disabled:opacity-50 transition-colors"
              >
                Scan Selected ({selectedTargetDocs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Sources Modal */}
      {reviewingContradiction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 flex flex-col border border-border max-h-[85vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                Review Sources: {reviewingContradiction.topic}
              </h2>
              <button onClick={() => setReviewingContradiction(null)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-primary rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded bg-accent-mint/10 text-accent-mint text-[11px] font-bold">SOURCE A</span>
                  <p className="font-bold text-[14px] text-text-primary">{reviewingContradiction.sourceA}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-border text-[13px] text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">
                  {reviewingContradiction.claimA}
                </div>
              </div>
              <div className="bg-bg-primary rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded bg-accent-mint/10 text-accent-mint text-[11px] font-bold">SOURCE B</span>
                  <p className="font-bold text-[14px] text-text-primary">{reviewingContradiction.sourceB}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-border text-[13px] text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">
                  {reviewingContradiction.claimB}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button onClick={() => setReviewingContradiction(null)} className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-accent-mint hover:bg-accent-teal transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}