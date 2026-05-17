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
    <section id="hero-section" className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
        
        {/* Left Column - Content */}
        <div className="flex flex-col items-start text-left w-full">
          {/* Headline */}
          <h1
            className="text-[44px] lg:text-[52px] leading-[1.1] font-extrabold mb-6 animate-slide-up delay-200"
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
            className="text-[17px] lg:text-[18px] leading-relaxed mb-8 max-w-xl animate-slide-up delay-300"
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
          <div className="mb-8 w-full max-w-xl animate-slide-up delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <SearchBar />
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mb-12 animate-slide-up delay-500" style={{ opacity: 0, animationFillMode: "forwards" }}>
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

          {/* System Overview Stats */}
          <div className="animate-slide-up delay-600 w-full max-w-lg border-t border-white/30 pt-8" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">System Overview</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-white/40 hover:border-accent-mint/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent-mint animate-pulse"></div>
                  <span className="text-[12px] font-semibold text-text-primary">Documents</span>
                </div>
                <p className="text-[24px] font-bold text-accent-mint leading-none mt-2">{documentCount}</p>
                <p className="text-[10px] text-text-muted mt-1">Total Indexed</p>
              </div>
              
              <div className="glass-panel p-4 rounded-xl border border-white/40 hover:border-accent-mint/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2">
                    <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
                    <path d="M6 10v1a6 6 0 0012 0v-1" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                  </svg>
                  <span className="text-[12px] font-semibold text-text-primary">AI Engine</span>
                </div>
                <p className="text-[14px] font-bold text-accent-teal leading-none mt-3">Online</p>
                <p className="text-[10px] text-text-muted mt-1">Ready for queries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Holographic Watermark */}
        <div className="hidden lg:flex justify-center items-center relative w-full h-full animate-fade-in delay-500" style={{ opacity: 0, animationFillMode: "forwards" }}>
          {/* Subtle background glow for the image */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-mint/5 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"></div>
          
          <img 
            src="/hero-bg.png" 
            alt="VeriDoc Holographic Engine" 
            className="w-full max-w-[550px] object-contain opacity-[0.55] mix-blend-multiply animate-float select-none pointer-events-none"
            style={{ 
              filter: "brightness(1.1) contrast(1.1) drop-shadow(0 0 30px rgba(0, 201, 167, 0.15))" 
            }}
          />
        </div>
        
      </div>
    </section>
  );
}


