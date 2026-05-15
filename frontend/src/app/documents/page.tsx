"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DocTypeIcon from "@/components/ui/DocTypeIcon";
import AuthorityBar from "@/components/ui/AuthorityBar";
import SeverityBadge from "@/components/ui/SeverityBadge";
import FileDetailsModal from "@/components/ui/FileDetailsModal";

// Represents the expected backend document model
interface Document {
  id: string;
  name: string;
  type: string;
  department: string;
  uploadedAt: string;
  authorityScore: number;
  conflicts: number;
  status: "Active" | "Outdated" | "Processing";
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false);

  useEffect(() => {
    // Backend-ready fetch implementation
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        // FIXME: Connect to real backend
        // const response = await fetch('/api/documents');
        // const data = await response.json();
        // setDocuments(data);

        // Simulating a backend that returns an empty array initially
        setTimeout(() => {
          setDocuments([]);
          setIsLoading(false);
        }, 600);
      } catch (error) {
        console.error("Failed to fetch documents", error);
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-8 animate-fade-in">
      <PageHeader
        title="Documents"
        badge={
          <span className="px-3 py-1 rounded-full text-[12px] font-medium glass border border-white/60 text-text-secondary">
            {documents.length} documents
          </span>
        }
        actions={
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-mint), var(--accent-teal))",
              boxShadow: "0 4px 14px rgba(0,201,167,0.2)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Upload Documents
          </button>
        }
      />

      {/* Upload Zone */}
      {isUploadOpen && (
        <div
          className="mb-8 p-8 border-[1.5px] border-dashed rounded-xl transition-all"
          style={{
            borderColor: "var(--accent-mint)",
            backgroundColor: "rgba(0,201,167,0.02)",
          }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="mb-4"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-mint)"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3
              className="text-[15px] font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Drop files here or click to browse
            </h3>
            <p
              className="text-[11px] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Supports PDF, DOCX, TXT, XLSX · Max 10MB per file
            </p>
            <button 
              onClick={() => setIsFileDetailsOpen(true)}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-border glass-panel hover:bg-white/40 transition-colors"
            >
              Select Files
            </button>
          </div>
        </div>
      )}

      {/* Filter + Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {["All", "PDF", "DOCX", "TXT", "XLSX"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                activeFilter === filter
                  ? "bg-accent-mint border-accent-mint text-white"
                  : "glass-panel border-white/60 text-text-primary hover:bg-white/40"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-3 py-1.5 rounded-lg border border-border glass-panel text-[13px] font-medium outline-none focus:border-accent-mint">
            <option>Newest ▾</option>
            <option>Oldest ▾</option>
            <option>Authority ▾</option>
          </select>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-9 pr-4 py-1.5 rounded-full border border-border glass-panel text-[13px] outline-none focus:border-accent-mint w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Document Table / States */}
      <div className="glass-card rounded-xl border border-white/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table-row" rows={5} />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
            title="No documents yet"
            description="Upload your first document to get started."
            action={{
              label: "Upload Documents",
              onClick: () => setIsUploadOpen(true),
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-white/30 backdrop-blur-sm">
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  #
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Name
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Type
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Uploaded
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Authority
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Conflicts
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Status
                </th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/50 hover:bg-white/40 transition-colors cursor-pointer group relative"
                >
                  <td className="py-3 px-4 text-[12px] font-mono text-text-muted">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <DocTypeIcon type={doc.type} />
                      <div>
                        <p className="text-[13px] font-bold text-text-primary">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {doc.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold border border-border">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-text-muted">
                    {doc.uploadedAt}
                  </td>
                  <td className="py-3 px-4">
                    <AuthorityBar score={doc.authorityScore} />
                  </td>
                  <td className="py-3 px-4">
                    {doc.conflicts === 0 ? (
                      <span className="text-[12px] text-text-muted">None</span>
                    ) : (
                      <SeverityBadge severity="high" label={doc.conflicts.toString()} />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold border border-border">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-text-muted hover:text-text-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FileDetailsModal
        isOpen={isFileDetailsOpen}
        onClose={() => setIsFileDetailsOpen(false)}
        onSave={(details) => {
          console.log("Saved details:", details);
          setIsFileDetailsOpen(false);
          setIsUploadOpen(false); // Close upload zone after successful mock upload
        }}
      />
    </div>
  );
}
