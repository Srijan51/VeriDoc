"use client";

import React, { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DocTypeIcon from "@/components/ui/DocTypeIcon";
import AuthorityBar from "@/components/ui/AuthorityBar";
import SeverityBadge from "@/components/ui/SeverityBadge";
import FileDetailsModal from "@/components/ui/FileDetailsModal";
import { fetchDocuments, uploadDocument } from "@/lib/api";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDocuments();
        const mapped = response.documents.map((doc) => ({
          id: doc.doc_id,
          name: doc.filename,
          type: doc.file_type,
          department: "",
          uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
          authorityScore: 80,
          conflicts: 0,
          status: "Active" as const,
        }));
        setDocuments(mapped);
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsFileDetailsOpen(true);
    }
  };

  const handleUpload = async (details: {
    type: string;
    date: string;
    file?: File;
  }) => {
    if (!details.file && !selectedFile) {
      console.error("No file selected");
      return;
    }

    const fileToUpload = details.file || selectedFile;
    if (!fileToUpload) return;

    try {
      setIsUploading(true);
      await uploadDocument(fileToUpload, details.type, details.date);

      // Refresh documents list
      const response = await fetchDocuments();
      const mapped = response.documents.map((doc) => ({
        id: doc.doc_id,
        name: doc.filename,
        type: doc.file_type,
        department: "",
        uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
        authorityScore: 80,
        conflicts: 0,
        status: "Active" as const,
      }));
      setDocuments(mapped);

      // Clean up
      setSelectedFile(null);
      setIsUploadOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

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
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-border glass-panel hover:bg-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Select Files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.docx,.txt,.xlsx"
            />
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
        onClose={() => {
          setIsFileDetailsOpen(false);
          setSelectedFile(null);
        }}
        onSave={handleUpload}
        selectedFile={selectedFile || undefined}
      />
    </div>
  );
}
