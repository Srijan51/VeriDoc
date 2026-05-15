"use client";

import React from "react";

export default function UploadZone() {
  return (
    <div
      id="upload-zone"
      className="rounded-xl border-[1.5px] border-dashed p-8 text-center cursor-pointer transition-all group hover:border-solid"
      style={{
        borderColor: "var(--accent-mint)",
        borderRadius: "8px",
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          className="transition-transform group-hover:scale-110"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-mint)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
          <polyline points="16 16 12 12 8 16" />
        </svg>
        <h3
          className="text-[15px] font-semibold"
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Upload Your Documents
        </h3>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Drag & drop your files here or click to browse
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Supports PDF, DOCX, TXT, XLSX
        </p>
      </div>
    </div>
  );
}
