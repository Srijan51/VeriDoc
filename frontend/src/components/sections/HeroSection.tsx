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
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white"
            style={{
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
            className="btn-ghost flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold glass-panel text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask AI Assistant
          </Link>
        </div>

        {/* Document Count + Status */}
        <div className="animate-slide-up delay-600" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center justify-center gap-2 mb-8">
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

          {/* Feature Highlights */}
          <div className="flex items-center justify-center gap-4 flex-wrap max-w-2xl mx-auto">
            {[
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "AI Contradiction Detection" },
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Document Analysis" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Instant Results" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/40 hover:border-accent-mint/30 transition-all hover:shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={feature.icon} />
                </svg>
                <span className="text-[12px] font-medium text-text-secondary">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


