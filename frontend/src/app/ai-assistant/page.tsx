"use client";

import React, { useState } from "react";

export default function AiAssistantPage() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]); // Will hold real data later

  const handleSend = async () => {
    if (!query.trim()) return;

    // We don't have mock data per the instructions, so we just show the typing indicator
    // and let it clear out to simulate a backend request waiting for an endpoint.

    setIsTyping(true);
    setQuery("");

    try {
      // FIXME: Connect to real backend
      // const response = await fetch('/api/query', { method: 'POST', body: JSON.stringify({ question: query }) });
      // const data = await response.json();
      // setMessages(prev => [...prev, { role: 'user', content: query }, { role: 'assistant', ...data }]);

      // Simulating network delay
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
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
            <button className="text-[13px] text-text-muted hover:text-severity-critical transition-colors">
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
                        handleSend();
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
                {/* Real messages would render here */}
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
              0
            </span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            {messages.length === 0 ? (
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
              <div className="space-y-4">
                {/* Source cards will map here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
