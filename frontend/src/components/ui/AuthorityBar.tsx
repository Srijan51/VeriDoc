import React from "react";

interface AuthorityBarProps {
  score: number;
}

export default function AuthorityBar({ score }: AuthorityBarProps) {
  const percentage = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden w-20">
        <div
          className="h-full bg-accent-mint rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className="text-[12px] font-bold tracking-tight text-right flex-shrink-0"
        style={{
          fontFamily: "var(--font-mono), monospace",
          color: "var(--text-primary)",
        }}
      >
        {percentage}/100
      </span>
    </div>
  );
}
