"use client";

import React from "react";
import SearchBar from "@/components/ui/SearchBar";

export default function HeroSection() {
  return (
    <section id="hero-section" className="relative">
      {/* Two-column layout */}
      <div className="flex gap-12 items-start">
        {/* Left — 55% */}
        <div className="w-[55%] flex-shrink-0">
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
            className="text-[16px] leading-relaxed mb-7 max-w-lg animate-slide-up delay-300"
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
          <div className="mb-6 animate-slide-up delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <SearchBar />
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mb-10 animate-slide-up delay-500" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <button
              id="hero-upload"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90"
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
            </button>
            <button
              id="hero-query"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "white",
                fontFamily: "var(--font-body), system-ui, sans-serif",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Start Querying
            </button>
          </div>

          {/* Trust Badges */}
          <div className="animate-slide-up delay-600" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <p
              className="label-caps text-[10px] mb-4"
              style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}
            >
              TRUSTED BY INNOVATIVE ENTERPRISES WORLDWIDE
            </p>
            <div className="flex items-center gap-6 flex-wrap">
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
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                        {company}
                      </span>
                    )}
                    {company === "NEXORA" && (
                      <span className="flex items-center gap-1.5">
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

        {/* Right — 45% Holographic Illustration */}
        <div className="w-[45%] animate-slide-up delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
          {/* Placeholder for 3D holographic illustration */}
        </div>
      </div>
    </section>
  );
}


