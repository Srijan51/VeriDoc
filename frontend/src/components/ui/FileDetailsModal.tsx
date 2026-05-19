"use client";

import React, { useState } from "react";

export type DocumentTypeValue = "policy" | "handbook" | "sop" | "memo";

export interface FileDetails {
  type: DocumentTypeValue;
  date: string;
  file?: File;
}

interface FileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: FileDetails) => void;
  selectedFile?: File;
}

const documentTypes: { label: string; value: DocumentTypeValue }[] = [
  { label: "Policy", value: "policy" },
  { label: "Handbook / Manual", value: "handbook" },
  { label: "Standard Operating Procedure", value: "sop" },
  { label: "Memo", value: "memo" },
];

export default function FileDetailsModal({
  isOpen,
  onClose,
  onSave,
  selectedFile,
}: FileDetailsModalProps) {
  const [selectedType, setSelectedType] = useState<DocumentTypeValue | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedType || !selectedDate) {
      return;
    }

    onSave({ type: selectedType, date: selectedDate, file: selectedFile });
    // Reset state for next open
    setSelectedType(null);
    setSelectedDate("");
    onClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setSelectedDate("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: "rgba(245, 240, 232, 0.7)",
          backdropFilter: "blur(2px)",
        }}
        onClick={handleClose}
      />
      <div className="relative bg-white/80 rounded-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 w-full max-w-lg animate-fade-in backdrop-blur-md">
        <h3
          className="text-lg font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Document Details
        </h3>
        <p className="text-[13px] mb-6 text-text-secondary">
          Please provide additional details for the uploaded document.
        </p>

        {/* Document Type Section */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-text-secondary mb-3 uppercase tracking-wider">
            Document Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {documentTypes.map((typeOption) => (
              <div
                key={typeOption.value}
                onClick={() => setSelectedType(typeOption.value)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedType === typeOption.value
                    ? "border-accent-mint bg-accent-mint/10"
                    : "border-border bg-white/40 hover:bg-white/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === typeOption.value
                        ? "border-accent-mint"
                        : "border-text-muted"
                    }`}
                  >
                    {selectedType === typeOption.value && (
                      <div className="w-2 h-2 rounded-full bg-accent-mint" />
                    )}
                  </div>
                  <span
                    className={`text-[13px] font-medium ${
                      selectedType === typeOption.value
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {typeOption.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Effective Date Section */}
        <div className="mb-8">
          <label className="block text-[11px] font-bold text-text-secondary mb-3 uppercase tracking-wider">
            Effective Date
          </label>
          <div className="relative">
             <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white/40 text-[14px] text-text-primary outline-none focus:border-accent-mint transition-colors cursor-pointer"
                style={{
                  colorScheme: "light"
                }}
             />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-white/60"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedType || !selectedDate}
            className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--accent-mint)",
            }}
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}
