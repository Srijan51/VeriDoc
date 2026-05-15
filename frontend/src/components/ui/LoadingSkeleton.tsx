import React from "react";

interface LoadingSkeletonProps {
  variant: "table-row" | "card" | "text";
  rows?: number;
}

export default function LoadingSkeleton({
  variant,
  rows = 1,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: rows });

  return (
    <div className="space-y-4 w-full">
      {items.map((_, i) => (
        <div key={i} className="animate-pulse w-full">
          {variant === "table-row" && (
            <div className="flex items-center gap-4 py-4 px-6 border-b border-border bg-white/40 rounded-xl">
              <div className="h-4 w-4 bg-border rounded" />
              <div className="h-4 w-32 bg-border rounded" />
              <div className="flex-1" />
              <div className="h-4 w-20 bg-border rounded" />
              <div className="h-4 w-24 bg-border rounded" />
            </div>
          )}
          {variant === "card" && (
            <div className="h-32 w-full bg-border rounded-xl opacity-50" />
          )}
          {variant === "text" && (
            <div className="h-4 w-full bg-border rounded opacity-50 mb-2" />
          )}
        </div>
      ))}
    </div>
  );
}
