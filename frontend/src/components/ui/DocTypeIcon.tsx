import React from "react";

interface DocTypeIconProps {
  type: "pdf" | "docx" | "txt" | "xlsx" | string;
  size?: number;
}

export default function DocTypeIcon({ type, size = 20 }: DocTypeIconProps) {
  let color = "#8E8E93";

  switch (type.toLowerCase()) {
    case "pdf":
      color = "#FF3B3B"; // Red
      break;
    case "docx":
      color = "#2563EB"; // Blue
      break;
    case "txt":
      color = "#8E8E93"; // Gray
      break;
    case "xlsx":
      color = "#16A34A"; // Green
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
