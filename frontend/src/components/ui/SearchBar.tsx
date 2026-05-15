"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Navigate to AI Assistant with the query
    // The AI Assistant page will handle the actual search
    router.push(`/ai-assistant?q=${encodeURIComponent(searchQuery)}`);
    
    setTimeout(() => {
      setIsSearching(false);
      setSearchQuery("");
    }, 500);
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full max-w-md">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-full transition-all duration-200 hover:shadow-lg"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--accent-mint)",
        }}
      >
        {/* Search icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-mint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ask VERIDOC anything about your documents..."
          className="flex-1 bg-transparent outline-none text-[15px] placeholder-text-muted"
          style={{
            fontFamily: "var(--font-body), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        />

        {/* Arrow CTA button */}
        <button
          type="submit"
          disabled={!searchQuery.trim() || isSearching}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--accent-mint)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </form>
  );
}
