"use client";

import React from "react";

export default function TopNav() {
  const navLinks = [
    { label: "Product", hasDropdown: true },
    { label: "Solutions", hasDropdown: true },
    { label: "Resources", hasDropdown: true },
    { label: "Company", hasDropdown: true },
    { label: "Pricing", hasDropdown: false },
  ];

  return (
    <header
      id="top-nav"
      className="sticky top-0 z-30 flex items-center justify-between px-8 py-3 glass-panel border-b-0 border-x-0 rounded-none"
    >
      {/* Left — Nav Links */}
      <nav className="flex items-center gap-7">
        {navLinks.map((link) => (
          <button
            key={link.label}
            id={`topnav-${link.label.toLowerCase()}`}
            className="flex items-center gap-1 text-[14px] font-medium transition-colors hover:text-text-primary"
            style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              color: "var(--text-secondary)",
            }}
          >
            {link.label}
            {link.hasDropdown && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      {/* Right — CTAs */}
      <div className="flex items-center gap-3">
        <button
          id="topnav-request-demo"
          className="px-5 py-2 rounded-full text-[13px] font-medium transition-all hover:bg-white/80"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          }}
        >
          Request a Demo
        </button>
        <button
          id="topnav-get-started"
          className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-all hover:opacity-90"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "white",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          }}
        >
          Get Started
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </header>
  );
}
