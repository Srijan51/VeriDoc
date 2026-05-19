"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

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
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Extract display info from user
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || "";
  const displayName = userName || userEmail.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      id="sidebar"
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col border-r border-white/40 z-40 glass-panel"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          {/* New Book Logo */}
          <div className="flex items-center justify-center shrink-0">
            {/* Put the transparent logo on the dashboard off-white so it visually blends */}
            <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center" style={{ background: "var(--bg-primary)", padding: 4 }}>
              <img src="/logo.png" alt="VeriDoc Logo" className="w-full h-full object-contain" />
            </div>
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

      {/* Bottom — User Info + Sign Out */}
      <div className="px-3 pb-5 pt-4 border-t border-white/30">
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent-mint), var(--accent-teal))",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[12px] font-semibold truncate"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-body), system-ui, sans-serif" }}
            >
              {displayName}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body), system-ui, sans-serif" }}
            >
              {userEmail}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          id="sidebar-sign-out"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 h-[36px] rounded-xl transition-all hover:opacity-85 hover:shadow-md"
          style={{
            background: "var(--text-primary)",
            color: "white",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-[13px] font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
