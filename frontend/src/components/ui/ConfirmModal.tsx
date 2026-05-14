import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: "rgba(245, 240, 232, 0.7)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl border border-border shadow-lg p-6 max-w-sm w-full animate-fade-in">
        <h3
          className="text-lg font-bold mb-2"
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-bg-primary"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-white hover:opacity-90"
            style={{
              backgroundColor:
                confirmVariant === "danger"
                  ? "var(--severity-high)"
                  : "var(--accent-mint)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
