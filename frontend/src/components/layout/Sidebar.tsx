"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "home",
    href: "/",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "documents",
    href: "/documents",
    label: "Documents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: "contradictions",
    href: "/contradictions",
    label: "Contradictions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: "ai-assistant",
    href: "/ai-assistant",
    label: "AI Assistant",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
        <path d="M6 10v1a6 6 0 0012 0v-1" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    ),
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      id="sidebar"
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col border-r border-white/40 z-40 glass-panel"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          {/* New Book Logo */}
          <div className="flex items-center justify-center">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-mint)" />
                  <stop offset="100%" stopColor="var(--accent-teal)" />
                </linearGradient>
                <linearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A4A4A" />
                  <stop offset="100%" stopColor="var(--text-primary)" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Left Cover */}
              <polygon points="5,20 48,40 48,95 5,70" fill="url(#leftGrad)" />
              
              {/* Right Cover */}
              <polygon points="95,20 95,70 52,95 52,40" fill="url(#rightGrad)" />
              
              {/* Left Inner Document */}
              <polygon points="18,33 40,43 40,82 18,65" fill="#ffffff" />
              
              {/* Left Document Details */}
              {/* Header Block */}
              <polygon points="21,37 30,41 30,49 21,45" fill="var(--accent-teal)" />
              {/* Text Lines */}
              <polygon points="21,52 37,59 37,61 21,54" fill="var(--accent-teal)" />
              <polygon points="21,57 37,64 37,66 21,59" fill="var(--accent-teal)" />
              <polygon points="21,62 33,67 33,69 21,64" fill="var(--accent-teal)" />

              {/* Right Inner Document */}
              <polygon points="82,33 82,65 60,82 60,43" fill="#ffffff" />
              
              {/* Right Document Details */}
              {/* Header Block */}
              <polygon points="79,37 70,41 70,49 79,45" fill="var(--text-secondary)" />
              {/* Text Lines */}
              <polygon points="79,52 63,59 63,61 79,54" fill="var(--text-secondary)" />
              <polygon points="79,57 63,64 63,66 79,59" fill="var(--text-secondary)" />
              <polygon points="79,62 67,67 67,69 79,64" fill="var(--text-secondary)" />

              {/* Center Star Glow */}
              <path d="M50 70 Q50 85 65 85 Q50 85 50 100 Q50 85 35 85 Q50 85 50 70 Z" fill="var(--bg-primary)" filter="url(#glow)"/>
              {/* Center Star Core */}
              <path d="M50 75 Q50 85 60 85 Q50 85 50 95 Q50 85 40 85 Q50 85 50 75 Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h1
              className="text-[18px] font-bold tracking-[0.15em] uppercase leading-none mb-1"
              style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", color: "var(--text-primary)" }}
            >
              VERIDOC
            </h1>
            <div className="flex items-center gap-1">
              <div className="h-[1px] w-2" style={{ background: "var(--accent-mint)" }}></div>
              <p className="text-[7.5px] tracking-[0.15em] uppercase font-bold" style={{ color: "var(--accent-teal)" }}>
                TRUTH. VERIFIED.
              </p>
              <div className="h-[1px] w-2" style={{ background: "var(--accent-mint)" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <li key={item.id}>
                <Link
                  id={`nav-${item.id}`}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-100 relative
                    ${
                      isActive
                        ? "bg-white/60 backdrop-blur-sm border border-white/80 text-text-primary shadow-sm active"
                        : "text-text-secondary hover:bg-white/40 hover:text-text-primary border border-transparent"
                    }`}
                  style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
                >
                  {/* Active left border */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-mint" />
                  )}
                  <span className={isActive ? "text-accent-mint" : ""}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom CTA - Sign In */}
      <div className="px-3 pb-5 pt-4">
        <button
          id="sidebar-sign-in"
          className="w-full flex items-center justify-center gap-2 px-4 h-[36px] rounded-xl transition-all hover:opacity-85"
          style={{
            background: "var(--text-primary)",
            color: "white",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          }}
        >
          <span className="text-[13px] font-medium">Sign In</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <div className="mt-3 text-center">
          <Link
            href="/register"
            className="text-[11px] font-medium hover:underline transition-colors"
            style={{ color: "var(--accent-mint)" }}
          >
            New here? Create account
          </Link>
        </div>
      </div>
    </aside>
  );
}
