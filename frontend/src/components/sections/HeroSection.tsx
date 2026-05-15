"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { fetchDocuments } from "@/lib/api";

export default function HeroSection() {
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    const fetchDocCount = async () => {
      try {
        const response = await fetchDocuments();
        setDocumentCount(response.total);
      } catch (error) {
        // Silently fail
        setDocumentCount(0);
      }
    };

    fetchDocCount();
  }, []);

  return (
    <section id="hero-section" className="relative">
      {/* Single-column centered layout */}
      <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
        {/* Headline */}
        <h1
          className="text-[44px] leading-[1.15] font-extrabold mb-5 animate-slide-up delay-200"
          style={{
            fontFamily: "var(--font-display), serif",
            color: "var(--text-primary)",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          Your Company&apos;s Documents Shouldn&apos;t Contradict Each Other.
        </h1>

        {/* Subtext */}
        <p
          className="text-[16px] leading-relaxed mb-7 max-w-lg mx-auto animate-slide-up delay-300"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body), system-ui, sans-serif",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          VERIDOC detects conflicts, outdated policies, and inconsistencies
          across enterprise knowledge systems using AI.
        </p>

        {/* Search Bar */}
        <div className="mb-6 animate-slide-up delay-400 w-full flex justify-center" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <SearchBar />
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center items-center gap-3 mb-10 animate-slide-up delay-500" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <Link
            id="hero-upload"
            href="/documents"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--accent-mint), var(--accent-teal))",
              fontFamily: "var(--font-body), system-ui, sans-serif",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
            Upload Documents
          </Link>
          <Link
            href="/ai-assistant"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold border border-white/60 glass-panel text-text-primary hover:bg-white/40 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask AI Assistant
          </Link>
        </div>

        {/* Document Count + Status */}
        <div className="animate-slide-up delay-600" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/60">
              <div className="w-2 h-2 rounded-full bg-accent-mint animate-pulse"></div>
              <span className="text-[13px] font-medium text-text-primary">
                {documentCount > 0 
                  ? `${documentCount} document${documentCount !== 1 ? "s" : ""} indexed`
                  : "Ready to get started"
                }
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <p
            className="label-caps text-[10px] mb-4 text-center"
            style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}
          >
            TRUSTED BY INNOVATIVE ENTERPRISES WORLDWIDE
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {["Globex Corporation", "NEXORA", "PIVOTLABS", "synergen", "vertex"].map(
              (company) => (
                <span
                  key={company}
                  className="text-[13px] font-semibold"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-heading), system-ui, sans-serif",
                    opacity: 0.6,
                  }}
                >
                  {company === "Globex Corporation" && (
                    <span className="flex items-center gap-1.5 justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                      {company}
                    </span>
                  )}
                  {company === "NEXORA" && (
                    <span className="flex items-center gap-1.5 justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      {company}
                    </span>
                  )}
                  {company !== "Globex Corporation" && company !== "NEXORA" && company}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


