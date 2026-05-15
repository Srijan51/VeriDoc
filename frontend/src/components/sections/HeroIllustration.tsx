"use client";

import React from "react";

export default function HeroIllustration() {
  return (
    <div id="hero-illustration" className="relative w-full h-[400px]">
      {/* Orbital ring platform */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[280px] h-[60px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(0,229,255,0.15), transparent 70%)",
          border: "1px solid rgba(0,229,255,0.1)",
        }}
      />

      {/* Central shield */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl flex items-center justify-center animate-float z-10"
        style={{
          background: "linear-gradient(135deg, rgba(0,201,167,0.15), rgba(0,229,255,0.1))",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0,201,167,0.25)",
          boxShadow: "0 0 40px rgba(0,201,167,0.2), 0 0 80px rgba(0,229,255,0.1)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>

      {/* Floating document cards */}
      <FloatingDoc
        label="HR Policy.pdf"
        color="var(--severity-critical)"
        iconColor="#FF3B3B"
        top="15%"
        left="10%"
        delay="0s"
      />
      <FloatingDoc
        label="Employee Handbook.pdf"
        color="var(--accent-mint)"
        iconColor="#00C9A7"
        top="8%"
        right="15%"
        delay="0.5s"
      />
      <FloatingDoc
        label="IT Security Policy.pdf"
        color="var(--accent-skyblue)"
        iconColor="#38BDF8"
        bottom="25%"
        right="5%"
        delay="1s"
      />
      <FloatingDoc
        label="Benefits Guide.pdf"
        color="var(--accent-purple)"
        iconColor="#7C3AED"
        bottom="20%"
        left="5%"
        delay="1.5s"
      />

      {/* Light thread connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
        <line x1="30%" y1="30%" x2="50%" y2="50%" stroke="var(--accent-cyan)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="70%" y1="25%" x2="50%" y2="50%" stroke="var(--accent-mint)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="75%" y1="65%" x2="50%" y2="50%" stroke="var(--accent-skyblue)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="25%" y1="70%" x2="50%" y2="50%" stroke="var(--accent-purple)" strokeWidth="0.5" strokeDasharray="4 4" />
      </svg>

      {/* Glow accents */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-12 left-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)",
        }}
      />
    </div>
  );
}

interface FloatingDocProps {
  label: string;
  color: string;
  iconColor: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay: string;
}

function FloatingDoc({ label, iconColor, top, bottom, left, right, delay }: FloatingDocProps) {
  return (
    <div
      className="absolute animate-float-slow"
      style={{
        top,
        bottom,
        left,
        right,
        animationDelay: delay,
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(224,219,208,0.6)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span
          className="text-[11px] font-medium whitespace-nowrap"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
