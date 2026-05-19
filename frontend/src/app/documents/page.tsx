"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DocTypeIcon from "@/components/ui/DocTypeIcon";
import SeverityBadge from "@/components/ui/SeverityBadge";
import FileDetailsModal, { type FileDetails } from "@/components/ui/FileDetailsModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fetchDocuments, uploadDocument, deleteDocument, getDocumentViewUrl, queryDocuments } from "@/lib/api";
import { useToastContext as useToast } from "@/lib/context/ToastContext";

// Represents the expected backend document model
interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  docDate: string;
  department: string;
  uploadedAt: string;
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

  // New States for Advanced Features
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocText, setPreviewDocText] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editType, setEditType] = useState("Policy");
  const [editDate, setEditDate] = useState("");
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const hasLoadedRef = useRef(false);

  const DOCS_CACHE_KEY = "veridoc_docs_cache";

  const mapDocuments = (docs: any[]) => {
    let scannedCards: any[] = [];
    try {
      const scanned = sessionStorage.getItem("veridoc_scanned_contradictions");
      if (scanned) {
        scannedCards = JSON.parse(scanned);
      }
    } catch {}

    return docs.map((doc) => {
      const docConflicts = scannedCards.filter(
        (card) => card.sourceA === doc.filename || card.sourceB === doc.filename
      ).length;

      const cat = doc.doc_type || "Unknown";

      return {
        id: doc.doc_id,
        name: doc.filename,
        type: doc.file_type,
        category: cat,
        docDate: doc.doc_date || "Unknown",
        department: "",
        uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
        conflicts: docConflicts,
        status: "Active" as const,
      };
    });
  };

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

  const handleUpload = async (details: FileDetails) => {
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
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    try {
      const response = await getDocumentViewUrl(docId);
      const url = response.url;
      const isPdf = response.filename.toLowerCase().endsWith(".pdf");
      
      if (isPdf) {
        setPreviewDocUrl(url);
      } else if (response.filename.toLowerCase().endsWith(".txt")) {
        const textRes = await fetch(url);
        const textContent = await textRes.text();
        setPreviewDocText(textContent);
        setPreviewDocUrl("txt-mode");
      } else {
        window.open(url, "_blank");
        return;
      }
      setPreviewDocName(doc.name);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate view URL.";
      addToast(msg, "error");
    }
  };

  const handleBulkScan = async () => {
    if (selectedDocIds.length < 2) return;
    setIsBulkActioning(true);
    addToast("Scanning selected documents for contradictions...", "info");
    try {
      const queries = ["Compare these documents and identify any conflicting statements or contradictions"];
      const seen = new Set<string>();
      const collected: any[] = [];
      const makeKey = (topic: string, srcA: string, srcB: string) => {
        const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
        const sources = [srcA.toLowerCase(), srcB.toLowerCase()].sort().join('|');
        return `${normalizedTopic}::${sources}`;
      };

      for (const query of queries) {
        const response = await queryDocuments(query, selectedDocIds, 10);
        for (const contradiction of response.contradictions) {
          const key = makeKey(contradiction.topic, contradiction.source_a, contradiction.source_b);
          if (seen.has(key)) continue;
          seen.add(key);
          const c = contradiction;
          collected.push({
            id: `contradiction-${collected.length}`,
            severity: c.severity.toLowerCase() === "critical" ? "critical" : c.severity.toLowerCase() === "high" ? "high" : c.severity.toLowerCase() === "medium" ? "medium" : "low",
            topic: c.topic,
            sourceA: c.source_a,
            claimA: c.claim_a,
            sourceB: c.source_b,
            claimB: c.claim_b,
            authoritySource: c.authoritative_source,
            reason: c.reason,
          });
        }
      }
      sessionStorage.setItem("veridoc_scanned_contradictions", JSON.stringify(collected));
      window.location.href = "/contradictions";
    } catch (error) {
      addToast("Scan failed", "error");
      setIsBulkActioning(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedDocIds.length} documents?`)) return;
    setIsBulkActioning(true);
    try {
      for (const id of selectedDocIds) {
        await deleteDocument(id);
      }
      addToast(`Deleted ${selectedDocIds.length} documents`, "success");
      setSelectedDocIds([]);
      await loadDocuments(true);
    } catch (error) {
      addToast("Failed to delete some documents", "error");
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleEditSave = () => {
    if (!editingDocId) return;
    setDocuments(prev => prev.map(d => {
      if (d.id === editingDocId) {
        return { ...d, category: editType, docDate: editDate };
      }
      return d;
    }));
    addToast("Document metadata updated locally (Backend save requires API update).", "success");
    setEditingDocId(null);
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

      {/* Bulk Actions Bar */}
      {selectedDocIds.length > 0 && (
        <div className="mb-6 p-4 rounded-xl glass border border-accent-mint/30 flex flex-wrap items-center justify-between gap-4 animate-fade-in shadow-sm bg-accent-mint/5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-accent-mint text-white text-[12px] font-bold">
              {selectedDocIds.length}
            </span>
            <span className="text-[13px] font-medium text-text-primary">Documents Selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkScan}
              disabled={selectedDocIds.length < 2 || isBulkActioning}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-accent-teal hover:bg-accent-mint transition-colors disabled:opacity-50 shadow-sm"
            >
              {isBulkActioning ? "Scanning..." : "Scan for Contradictions"}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkActioning}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold border border-severity-critical/30 text-severity-critical hover:bg-severity-critical hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

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

      {/* Hierarchy Info Banner */}
      <div className="mb-6 p-4 rounded-xl bg-accent-mint/10 border border-accent-mint/30 flex items-start gap-3 text-text-primary text-[13px] shadow-sm">
        <svg className="w-5 h-5 text-accent-teal mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <p className="font-bold mb-1" style={{ fontFamily: "var(--font-heading), serif" }}>System Hierarchy</p>
          <p className="text-text-secondary leading-relaxed text-[12px]">
            VERIDOC resolves conflicts using the following strict authority order: 
            <span className="font-bold text-accent-teal ml-1">Policy</span> &gt; 
            <span className="font-bold text-accent-teal mx-1">Handbook</span> &gt; 
            <span className="font-bold text-accent-teal mx-1">SOP</span> &gt; 
            <span className="font-bold text-accent-teal mx-1">Memo</span>.
            <br />
            Newer documents automatically take precedence over older documents within the same category.
          </p>
        </div>
      </div>

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
      <div className="glass-card rounded-xl border border-white/60 shadow-sm overflow-x-auto">
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
                <th className="py-3 px-4 w-[40px]">
                  <input 
                    type="checkbox" 
                    checked={selectedDocIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDocIds(filteredDocuments.map(d => d.id));
                      else setSelectedDocIds([]);
                    }}
                    className="w-4 h-4 rounded border-border text-accent-mint focus:ring-accent-mint cursor-pointer"
                  />
                </th>
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
                  Category
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  Effective Date
                </th>
                <th className="py-3 px-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Uploaded
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
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox" 
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc.id]);
                        else setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                      }}
                      className="w-4 h-4 rounded border-border text-accent-mint focus:ring-accent-mint cursor-pointer"
                    />
                  </td>
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
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(0, 201, 167, 0.1)", color: "var(--accent-mint)" }}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-text-primary whitespace-nowrap">
                    {doc.docDate !== "Unknown" ? doc.docDate : "—"}
                  </td>
                  <td className="py-3 px-4 text-[12px] text-text-muted">
                    {doc.uploadedAt}
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
                        onClick={() => {
                          setEditingDocId(doc.id);
                          setEditType(doc.category);
                          setEditDate(doc.docDate !== "Unknown" ? doc.docDate : "");
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-accent-teal border border-accent-teal/30 hover:bg-accent-teal/10 transition-all"
                      >
                        Edit
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

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-bg-primary rounded-t-2xl">
              <h2 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {previewDocName}
              </h2>
              <button onClick={() => { setPreviewDocUrl(null); setPreviewDocText(null); setPreviewDocName(""); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white border border-transparent hover:border-border text-text-muted hover:text-text-primary transition-all">✕</button>
            </div>
            <div className="flex-1 bg-white rounded-b-2xl overflow-hidden relative">
              {previewDocText !== null ? (
                <div className="w-full h-full p-6 overflow-auto bg-white text-black font-mono text-[13px] whitespace-pre-wrap">
                  {previewDocText}
                </div>
              ) : (
                <iframe src={previewDocUrl} className="w-full h-full border-0 absolute inset-0" title="Document Preview" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
            <h2 className="text-[18px] font-bold text-text-primary mb-6">Edit Document Metadata</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">Document Category</label>
                <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] outline-none focus:border-accent-mint bg-transparent">
                  <option value="Policy">Policy</option>
                  <option value="Handbook">Handbook</option>
                  <option value="SOP">SOP</option>
                  <option value="Memo">Memo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">Effective Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] outline-none focus:border-accent-mint bg-transparent" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingDocId(null)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-text-secondary border border-border hover:bg-bg-primary transition-colors">Cancel</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent-mint hover:bg-accent-teal transition-colors shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
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