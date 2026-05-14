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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent-mint)" />
                  <stop offset="100%" stopColor="var(--accent-teal)" />
                </linearGradient>
              </defs>
              {/* Left Page */}
              <path d="M 3 3 L 3 14 L 11.5 20 L 11.5 9 Z" fill="url(#logoGrad)" />
              {/* Right Page */}
              <path d="M 21 3 L 21 14 L 12.5 20 L 12.5 9 Z" fill="var(--text-primary)" />
              
              {/* Left Page Lines */}
              <path d="M 5.5 6.5 L 9.5 9.3 M 5.5 9 L 9.5 11.8 M 5.5 11.5 L 9.5 14.3" stroke="var(--bg-primary)" strokeWidth="1" strokeLinecap="round" />
              
              {/* Right Page Lines */}
              <path d="M 18.5 6.5 L 14.5 9.3 M 18.5 9 L 14.5 11.8 M 18.5 11.5 L 14.5 14.3" stroke="var(--bg-primary)" strokeWidth="1" strokeLinecap="round" />
              
              {/* Center Star/Glow */}
              <path d="M 12 15 L 13.5 20 L 12 23 L 10.5 20 Z" fill="var(--accent-cyan)" />
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
