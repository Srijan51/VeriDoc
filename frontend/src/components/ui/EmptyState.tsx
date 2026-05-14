import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div
        className="mb-6 flex items-center justify-center w-20 h-20 rounded-full"
        style={{ background: "rgba(0, 201, 167, 0.05)" }}
      >
        <div style={{ color: "var(--accent-mint)" }}>{icon}</div>
      </div>
      <h3
        className="text-xl font-bold mb-2"
        style={{
          fontFamily: "var(--font-heading), system-ui, sans-serif",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mx-auto mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "var(--accent-mint)",
            boxShadow: "0 4px 14px rgba(0,201,167,0.2)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
