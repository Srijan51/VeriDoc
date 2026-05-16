"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchDocuments, queryDocuments, Citation, Contradiction, getDocumentViewUrl } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  contradictions?: Contradiction[];
  noAnswerReason?: string | null;
}

interface ChatSession {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
}

const STORAGE_KEY = "veridoc_chat_sessions";
const ACTIVE_KEY = "veridoc_active_chat";

function generateId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSessions(): ChatSession[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function AiAssistantPage() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState<{ citations: Citation[]; contradictions: Contradiction[] } | null>(null);
  const [documents, setDocuments] = useState<{ doc_id: string; filename: string }[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoQueried = useRef(false);

  // Load sessions and restore active chat on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);

    const activeId = sessionStorage.getItem(ACTIVE_KEY);
    if (activeId) {
      const active = loaded.find(s => s.id === activeId);
      if (active) {
        setActiveSessionId(active.id);
        setMessages(active.messages);
        return;
      }
    }
    // Create a new session if none active
    const newId = generateId();
    setActiveSessionId(newId);
  }, []);

  // Persist messages whenever they change
  const persistMessages = useCallback((msgs: AssistantMessage[], sessionId: string) => {
    if (!sessionId || msgs.length === 0) return;
    const existing = loadSessions();
    const idx = existing.findIndex(s => s.id === sessionId);
    const title = msgs.find(m => m.role === "user")?.content.slice(0, 50) || "New Chat";

    if (idx >= 0) {
      existing[idx].messages = msgs;
      existing[idx].title = title;
    } else {
      existing.unshift({ id: sessionId, title, messages: msgs, createdAt: new Date().toISOString() });
    }

    // Keep only last 20 sessions
    const trimmed = existing.slice(0, 20);
    saveSessions(trimmed);
    setSessions(trimmed);
    sessionStorage.setItem(ACTIVE_KEY, sessionId);
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const response = await fetchDocuments();
        setDocuments(response.documents);
        setDocumentCount(response.total);
      } catch {
        setDocuments([]);
        setDocumentCount(0);
      }
    };
    void loadCount();
  }, []);

  // Auto-submit query from SearchBar redirect (?q=...)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !hasAutoQueried.current) {
      hasAutoQueried.current = true;
      void sendQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendQuery = async (value?: string) => {
    const prompt = (value ?? query).trim();
    if (!prompt) return;

    setIsTyping(true);
    if (!value) setQuery("");

    try {
      const newMsgs: AssistantMessage[] = [...messages, { role: "user", content: prompt }];
      setMessages(newMsgs);

      const response = await queryDocuments(prompt, [], 5);

      const finalMsgs: AssistantMessage[] = [
        ...newMsgs,
        {
          role: "assistant",
          content: response.no_answer_found
            ? response.no_answer_reason || "I could not find an answer to your question."
            : response.answer,
          citations: response.citations,
          contradictions: response.contradictions,
          noAnswerReason: response.no_answer_reason,
        },
      ];
      setMessages(finalMsgs);
      persistMessages(finalMsgs, activeSessionId);

      setCurrentResponse({
        citations: response.citations,
        contradictions: response.contradictions,
      });

      if (response.contradictions.length > 0) {
        // Store contradictions for the Contradictions page
        sessionStorage.setItem(
          "veridoc_detected_contradictions",
          JSON.stringify(response.contradictions)
        );
        addToast(`⚠️ Found ${response.contradictions.length} contradiction(s) in sources`, "warning");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      addToast(message, "error");
      const errMsgs: AssistantMessage[] = [
        ...messages,
        { role: "user", content: prompt },
        { role: "assistant", content: `Sorry, I encountered an error: ${message}. Please try again.` },
      ];
      setMessages(errMsgs);
      persistMessages(errMsgs, activeSessionId);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    const newId = generateId();
    setActiveSessionId(newId);
    setMessages([]);
    setCurrentResponse(null);
    sessionStorage.setItem(ACTIVE_KEY, newId);
    hasAutoQueried.current = false;
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setCurrentResponse(null);
    sessionStorage.setItem(ACTIVE_KEY, session.id);
    setShowHistory(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = loadSessions().filter(s => s.id !== id);
    saveSessions(updated);
    setSessions(updated);
    if (id === activeSessionId) {
      startNewChat();
    }
  };

  const suggestions = [
    "How many annual leave days?",
    "What's the password expiry policy?",
    "Which document is most authoritative?",
    "Are there any compliance conflicts?",
  ];

  return (
    <div className="h-[calc(100vh-2rem)] pt-4 pb-4 flex flex-col max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-1 overflow-hidden border border-white/60 mx-8 rounded-xl glass-card shadow-sm">

        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-[260px] bg-white/40 backdrop-blur-md flex flex-col border-r border-white/40 animate-fade-in">
            <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between glass">
              <h3 className="text-[13px] font-bold" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}>Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="text-text-muted hover:text-text-primary transition-colors text-[16px]">✕</button>
            </div>
            <div className="p-3">
              <button
                onClick={startNewChat}
                className="w-full px-3 py-2 rounded-lg text-[12px] font-medium bg-accent-mint text-white hover:bg-accent-teal transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {sessions.length === 0 ? (
                <p className="text-[11px] text-text-muted text-center py-4">No chat history yet</p>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`group px-3 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                        session.id === activeSessionId
                          ? "bg-accent-mint/10 border border-accent-mint/30"
                          : "hover:bg-white/50 border border-transparent"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-text-primary truncate">{session.title}</p>
                        <p className="text-[10px] text-text-muted">{session.messages.length} messages</p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-severity-critical transition-all text-[12px] ml-2 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Chat */}
        <div className="flex-1 flex flex-col border-r border-border relative">
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between glass z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/40 transition-colors border border-transparent hover:border-border"
                title="Chat History"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-[15px] font-bold" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}>VERIDOC AI</h2>
                  <span className="text-[11px] font-bold text-accent-mint uppercase tracking-wider">Online</span>
                </div>
                <p className="text-[12px] text-text-muted">Querying across {documentCount} document{documentCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={startNewChat} className="text-[12px] text-text-muted hover:text-accent-mint transition-colors px-2 py-1 rounded-lg hover:bg-white/40">New Chat</button>
              <button onClick={() => { setMessages([]); persistMessages([], activeSessionId); }} className="text-[12px] text-text-muted hover:text-severity-critical transition-colors px-2 py-1 rounded-lg hover:bg-white/40">Clear</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                <h2 className="text-[20px] font-bold mb-2" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}>Ask anything about your documents</h2>
                <p className="text-[12px] text-text-muted mb-8">Powered by citations and conflict detection</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => void sendQuery(suggestion)} className="px-4 py-3 rounded-xl border border-white/60 glass-panel text-[12px] text-text-primary text-left hover:border-accent-mint hover:text-accent-mint transition-colors shadow-sm">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <div key={index}>
                    {msg.role === "assistant" && msg.contradictions && msg.contradictions.length > 0 && (
                      <div className="mb-4 p-4 rounded-xl border-l-4" style={{ borderLeftColor: "var(--severity-critical)", backgroundColor: "rgba(255, 107, 53, 0.08)", borderColor: "rgba(255, 107, 53, 0.2)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] font-bold" style={{ color: "var(--severity-critical)" }}>⚠ Contradictions Detected</p>
                          <button
                            onClick={() => {
                              sessionStorage.setItem(
                                "veridoc_detected_contradictions",
                                JSON.stringify(msg.contradictions)
                              );
                              router.push("/contradictions");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: "var(--severity-high)" }}
                          >
                            View Contradictions
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-1">
                          {msg.contradictions.map((contradiction, cidx) => (
                            <p key={cidx} className="text-[11px] text-text-secondary"><strong>{contradiction.topic}</strong> — {contradiction.severity.toUpperCase()} — {contradiction.source_a} vs {contradiction.source_b}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-accent-mint text-white rounded-tr-sm" : "glass-panel border border-white/60 rounded-tl-sm text-text-primary"}`}>
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass-panel border border-white/60 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full bg-accent-mint animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-accent-mint animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-accent-mint animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="p-4 glass border-t border-border/50">
            <div className="relative max-w-3xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendQuery()}
                placeholder="Ask VERIDOC anything..."
                disabled={isTyping}
                className="w-full px-4 py-3.5 pr-12 rounded-full border-[1.5px] border-white/60 glass-panel text-[14px] outline-none focus:border-accent-mint transition-colors shadow-sm disabled:opacity-50"
              />
              <button onClick={() => void sendQuery()} disabled={!query.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-accent-mint text-white disabled:opacity-50 hover:bg-accent-teal transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-text-muted mt-2">Searching across {documentCount} document{documentCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Sources Panel */}
        <div className="w-[300px] bg-white/30 backdrop-blur-md flex flex-col border-l border-white/40">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between glass">
            <h3 className="text-[13px] font-bold" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}>Sources Used</h3>
            <span className="px-2 py-0.5 rounded-full bg-bg-primary text-[10px] font-bold border border-border text-text-muted">{currentResponse?.citations.length || 0}</span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            {!currentResponse || currentResponse.citations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <p className="text-[12px] text-text-muted max-w-[200px]">Sources will appear here after your first query</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentResponse.citations.map((citation, idx) => (
                  <div 
                    key={idx} 
                    onClick={async () => {
                      const doc = documents.find(d => d.filename === citation.source);
                      if (!doc) {
                        addToast(`Original file not found for ${citation.source}`, "error");
                        return;
                      }
                      try {
                        const response = await getDocumentViewUrl(doc.doc_id);
                        const isPdf = response.filename.toLowerCase().endsWith(".pdf");
                        if (isPdf) {
                          window.open(`https://docs.google.com/gview?url=${encodeURIComponent(response.url)}&embedded=true`, "_blank");
                        } else {
                          window.open(response.url, "_blank");
                        }
                      } catch (error) {
                        const msg = error instanceof Error ? error.message : "Failed to open document";
                        addToast(msg, "error");
                      }
                    }}
                    className="p-3 rounded-lg border border-border/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[11px] font-bold text-text-primary break-all">{citation.source}</p>
                      <svg className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-accent-mint" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-border bg-white/30">{citation.doc_type}</span>
                      <span className="text-[9px] text-text-muted">{citation.doc_date}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">&quot;{citation.claim}&quot;</p>
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