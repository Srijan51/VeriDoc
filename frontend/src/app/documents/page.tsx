"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DocTypeIcon from "@/components/ui/DocTypeIcon";
import AuthorityBar from "@/components/ui/AuthorityBar";
import SeverityBadge from "@/components/ui/SeverityBadge";
import FileDetailsModal from "@/components/ui/FileDetailsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fetchDocuments, uploadDocument, deleteDocument, getDocumentViewUrl } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";

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
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const hasLoadedRef = useRef(false);

  const DOCS_CACHE_KEY = "veridoc_docs_cache";

  const mapDocuments = (docs: { doc_id: string; filename: string; file_type: string; uploaded_at: string }[]) =>
    docs.map((doc) => ({
      id: doc.doc_id,
      name: doc.filename,
      type: doc.file_type,
      department: "",
      uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
      authorityScore: 80,
      conflicts: 0,
      status: "Active" as const,
    }));

  const loadDocuments = useCallback(async (showToast = false) => {
    try {
      // Show cached data instantly while fetching fresh data
      if (!showToast) {
        try {
          const cached = sessionStorage.getItem(DOCS_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            setDocuments(mapDocuments(parsed));
            setIsLoading(false); // Remove spinner immediately
          }
        } catch { /* ignore cache errors */ }
      } else {
        setIsLoading(true);
      }

      const response = await fetchDocuments();
      const mapped = mapDocuments(response.documents);
      setDocuments(mapped);

      // Cache the raw response for next visit
      try {
        sessionStorage.setItem(DOCS_CACHE_KEY, JSON.stringify(response.documents));
      } catch { /* ignore storage errors */ }

      if (showToast) {
        addToast(`Loaded ${mapped.length} document(s)`, "success");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch documents";
      addToast(errorMessage, "error");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadDocuments(false);
    }
  }, [loadDocuments]);

  // Filter and search logic
  useEffect(() => {
    let result = documents;

    // Apply type filter
    if (activeFilter !== "All") {
      result = result.filter((doc) => doc.type.toUpperCase() === activeFilter.toUpperCase());
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((doc) => doc.name.toLowerCase().includes(query));
    }

    // Apply sorting
    if (sortBy === "newest") {
      result = [...result].reverse(); // Newest first
    } else if (sortBy === "oldest") {
      result = [...result]; // Oldest first (original order)
    } else if (sortBy === "authority") {
      result = [...result].sort((a, b) => b.authorityScore - a.authorityScore);
    }

    setFilteredDocuments(result);
  }, [documents, activeFilter, searchQuery, sortBy]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        addToast("File size exceeds 10MB limit", "error");
        return;
      }
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
      addToast("No file selected", "error");
      return;
    }

    const fileToUpload = details.file || selectedFile;
    if (!fileToUpload) return;

    try {
      setIsUploading(true);
      await uploadDocument(fileToUpload, details.type, details.date);
      addToast(`${fileToUpload.name} uploaded successfully`, "success");

      // Refresh documents list
      await loadDocuments(false);

      // Clean up
      setSelectedFile(null);
      setIsFileDetailsOpen(false);
      setIsUploadOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document";
      addToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDoc = async (docId: string) => {
    try {
      const response = await getDocumentViewUrl(docId);
      const url = response.url;
      const isPdf = response.filename.toLowerCase().endsWith(".pdf");
      
      if (isPdf) {
        // Open PDF in Google Docs Viewer for in-browser viewing
        window.open(`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`, "_blank");
      } else {
        // Direct download for DOCX/TXT
        window.open(url, "_blank");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate view URL. The original file might not be stored.";
      addToast(msg, "error");
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      addToast(`Deleted "${deleteTarget.name}"`, "success");
      await loadDocuments(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete";
      addToast(msg, "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
          <div className="flex gap-2">
            <button
              onClick={() => loadDocuments(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border border-white/60 glass-panel text-text-primary hover:bg-white/40 transition-all disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36 10 10 0 012.81 3.1M20.62 15.2A9 9 0 005.94 6" />
              </svg>
              Refresh
            </button>
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
              Upload
            </button>
          </div>
        }
      />

      {/* Upload Zone */}
      {isUploadOpen && (
        <div
          id="upload-drop-zone"
          className={`mb-8 p-8 border-[1.5px] border-dashed rounded-xl transition-all cursor-pointer ${
            isDragOver ? "border-solid bg-accent-mint/5 scale-[1.01]" : ""
          }`}
          style={{
            borderColor: "var(--accent-mint)",
            backgroundColor: isDragOver ? "rgba(0,201,167,0.05)" : "rgba(0,201,167,0.02)",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                addToast("File size exceeds 10MB limit", "error");
                return;
              }
              const ext = file.name.split('.').pop()?.toLowerCase();
              if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
                addToast("Unsupported file type. Use PDF, DOCX, or TXT.", "error");
                return;
              }
              setSelectedFile(file);
              setIsFileDetailsOpen(true);
            }
          }}
        >
          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            <svg
              className={`mb-4 transition-transform ${isDragOver ? "scale-125" : ""}`}
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
              {isDragOver ? "Drop file here" : "Drop files here or click to browse"}
            </h3>
            <p
              className="text-[11px] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Supports PDF, DOCX, TXT · Max 10MB per file
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="pointer-events-auto px-5 py-2 rounded-lg text-sm font-medium border border-border glass-panel hover:bg-white/40 hover:border-accent-mint/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Select Files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.docx,.txt"
            />
          </div>
        </div>
      )}

      {/* Filter + Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {["All", "PDF", "DOCX", "TXT"].map((filter) => (
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
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border glass-panel text-[13px] font-medium outline-none focus:border-accent-mint"
          >
            <option value="newest">Newest ▾</option>
            <option value="oldest">Oldest ▾</option>
            <option value="authority">Authority ▾</option>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        ) : filteredDocuments.length === 0 ? (
          documents.length === 0 ? (
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
              title="No matching documents"
              description="Try adjusting your filters or search query."
            />
          )
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
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc, index) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/50 hover:bg-white/40 transition-colors"
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
                          {doc.department || "—"}
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
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDoc(doc.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-primary border border-border hover:bg-white/40 transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-severity-critical border border-severity-critical/30 hover:bg-severity-critical hover:text-white transition-all"
                      >
                        Delete
                      </button>
                    </div>
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove this document and all its indexed data. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="danger"
        onConfirm={handleDeleteDoc}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


