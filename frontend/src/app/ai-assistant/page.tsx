"use client";

import React, { useState } from "react";
import { queryDocuments, Citation, Contradiction } from "@/lib/api";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  contradictions?: Contradiction[];
  noAnswerReason?: string;
}

export default function AiAssistantPage() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState<{
    citations: Citation[];
    contradictions: Contradiction[];
  } | null>(null);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = query;
    setIsTyping(true);
    setQuery("");

    try {
      // Add user message to chat
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      // Query the backend
      const response = await queryDocuments(userMessage, [], 5);

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.no_answer_found
            ? response.no_answer_reason || "I could not find an answer to your question."
            : response.answer,
          citations: response.citations,
          contradictions: response.contradictions,
          noAnswerReason: response.no_answer_reason,
        },
      ]);

      // Update the sources panel
      setCurrentResponse({
        citations: response.citations,
        contradictions: response.contradictions,
      });
    } catch (error) {
      console.error("Query failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your query. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse(null);
  };

  return (
    <div className="h-[calc(100vh-2rem)] pt-4 pb-4 flex flex-col max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-1 overflow-hidden border border-white/60 mx-8 rounded-xl glass-card shadow-sm">
        {/* LEFT - CHAT AREA */}
        <div className="flex-1 flex flex-col border-r border-border relative">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between glass z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2
                  className="text-[15px] font-bold"
                  style={{
                    fontFamily: "var(--font-heading), system-ui, sans-serif",
                    color: "var(--text-primary)",
                  }}
                >
                  VERIDOC AI
                </h2>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-mint opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-mint"></span>
                </span>
                <span className="text-[11px] font-bold text-accent-mint uppercase tracking-wider">
                  Online
                </span>
              </div>
              <p className="text-[12px] text-text-muted">
                Querying across 47 documents
              </p>
            </div>
            <button 
              onClick={clearChat}
              className="text-[13px] text-text-muted hover:text-severity-critical transition-colors"
            >
              Clear Chat
            </button>
          </div>

          {/* Messages Area / Welcome State */}
          <div className="flex-1 overflow-y-auto p-6 bg-white/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                <svg
                  className="mb-6 animate-pulse-slow"
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-mint)"
                  strokeWidth="1"
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                  <circle cx="12" cy="12" r="6" stroke="var(--accent-teal)" />
                  <circle cx="12" cy="12" r="2" fill="var(--accent-cyan)" />
                </svg>
                <h2
                  className="text-[20px] font-bold mb-2"
                  style={{
                    fontFamily: "var(--font-heading), system-ui, sans-serif",
                    color: "var(--text-primary)",
                  }}
                >
                  Ask anything about your documents
                </h2>
                <p className="text-[12px] text-text-muted mb-8">
                  Powered by Claude — with citations and conflict detection
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[
                    "How many annual leave days?",
                    "What's the password expiry policy?",
                    "Which document is most authoritative?",
                    "Are there any compliance conflicts?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        // Call handleSend on next render with updated query
                        setTimeout(() => {
                          setQuery(suggestion);
                          queryDocuments(suggestion, [], 5).then((response) => {
                            setMessages([
                              { role: "user", content: suggestion },
                              {
                                role: "assistant",
                                content: response.no_answer_found
                                  ? response.no_answer_reason ||
                                    "I could not find an answer to your question."
                                  : response.answer,
                                citations: response.citations,
                                contradictions: response.contradictions,
                                noAnswerReason: response.no_answer_reason,
                              },
                            ]);
                            setCurrentResponse({
                              citations: response.citations,
                              contradictions: response.contradictions,
                            });
                            setQuery("");
                          });
                        }, 0);
                      }}
                      className="px-4 py-3 rounded-xl border border-white/60 glass-panel text-[12px] text-text-primary text-left hover:border-accent-mint hover:text-accent-mint transition-colors shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contradiction Warning Banner */}
                {messages.map((msg, idx) => {
                  if (
                    msg.role === "assistant" &&
                    msg.contradictions &&
                    msg.contradictions.length > 0
                  ) {
                    return (
                      <div
                        key={`contradiction-banner-${idx}`}
                        className="p-4 rounded-xl border-l-4 mb-6"
                        style={{
                          borderLeftColor: "var(--severity-critical)",
                          backgroundColor: "rgba(255, 107, 53, 0.1)",
                          borderColor: "rgba(255, 107, 53, 0.2)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--severity-critical)"
                            strokeWidth="2"
                            className="mt-0.5 flex-shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div>
                            <p
                              className="text-[13px] font-bold mb-2"
                              style={{ color: "var(--severity-critical)" }}
                            >
                              ⚠️ Contradictions Detected
                            </p>
                            <div className="space-y-1">
                              {msg.contradictions.map((contradiction, cidx) => (
                                <p
                                  key={cidx}
                                  className="text-[11px] text-text-secondary"
                                >
                                  <strong>{contradiction.topic}</strong> —{" "}
                                  {contradiction.severity.toUpperCase()}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Messages */}
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-accent-mint text-white rounded-tr-sm"
                          : "glass-panel border border-white/60 rounded-tl-sm text-text-primary"
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass-panel border border-white/60 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                      <div
                        className="w-2 h-2 rounded-full bg-accent-mint animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-accent-mint animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-accent-mint animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Input Bar */}
          <div className="p-4 glass border-t border-border/50">
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-mint)"
                  strokeWidth="2"
                >
                  <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask VERIDOC anything..."
                className="w-full pl-11 pr-12 py-3.5 rounded-full border-[1.5px] border-white/60 glass-panel text-[14px] outline-none focus:border-accent-mint transition-colors shadow-sm"
              />
              <button
                onClick={handleSend}
                disabled={!query.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-accent-mint text-white disabled:opacity-50 hover:bg-accent-teal transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-text-muted mt-2">
              Searching across 47 documents
            </p>
          </div>
        </div>

        {/* RIGHT - CONTEXT PANEL */}
        <div className="w-[300px] bg-white/30 backdrop-blur-md flex flex-col border-l border-white/40">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between glass">
            <h3
              className="text-[13px] font-bold"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
              }}
            >
              Sources Used
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-bg-primary text-[10px] font-bold border border-border text-text-muted">
              {currentResponse?.citations?.length || 0}
            </span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            {!currentResponse || currentResponse.citations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <svg
                  className="mb-3"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="14" height="18" rx="2" />
                  <path d="M7 3v18" />
                  <path d="M3 7h14" />
                </svg>
                <p className="text-[12px] text-text-muted max-w-[200px]">
                  Sources will appear here after your first query
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentResponse.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-text-primary mb-1">
                      {citation.source}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-border bg-white/30">
                        {citation.doc_type}
                      </span>
                      <span className="text-[9px] text-text-muted">
                        {citation.doc_date}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      "{citation.claim}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
