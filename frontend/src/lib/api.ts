import { createClient } from "@/lib/supabase";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Citation {
  source: string;
  doc_type: string;
  doc_date: string;
  claim: string;
}

export interface Contradiction {
  topic: string;
  source_a: string;
  claim_a: string;
  source_b: string;
  claim_b: string;
  severity: string;
  authoritative_source: string;
  reason: string;
}

export interface SourceChunk {
  doc_id: string;
  filename: string;
  chunk_index: number;
  text: string;
  score: number;
}

export interface QueryResponse {
  question: string;
  answer: string;
  confidence_score: number;
  citations: Citation[];
  contradictions: Contradiction[];
  no_answer_found: boolean;
  no_answer_reason: string | null;
  model?: string;
}

export interface QueryRequest {
  question: string;
  doc_ids?: string[];
  top_k?: number;
}

export interface DocumentMeta {
  doc_id: string;
  filename: string;
  file_type: string;
  doc_type?: string;
  doc_date?: string;
  chunk_count: number;
  uploaded_at: string;
  size_bytes?: number | null;
}

export interface DocumentListResponse {
  documents: DocumentMeta[];
  total: number;
}

export interface UploadResponse {
  doc_id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  message: string;
}

export interface ModelsResponse {
  available_models?: string[];
  count?: number;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await response.json();
      if (typeof body === "string") {
        return body;
      }
      if (body && typeof body === "object") {
        if (typeof body.detail === "string") {
          return body.detail;
        }
        if (typeof body.message === "string") {
          return body.message;
        }
      }
    } catch {
      // Fall through to text parsing.
    }
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // Ignore text parsing errors and use the fallback message below.
  }

  return `Request failed with status ${response.status}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Fall through — no auth header
  }
  return {};
}

async function requestJson<T>(path: string, init?: RequestInit, retries = 3): Promise<T> {
  let lastError: Error | null = null;
  const authHeaders = await getAuthHeaders();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...authHeaders,
          ...(init?.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = await readErrorMessage(response);
        // Don't retry client errors (4xx) — only retry server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMsg);
        }
        lastError = new Error(errorMsg);
        // Wait with exponential backoff before retrying
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          continue;
        }
        throw lastError;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new Error("Request timed out. The server may be starting up.");
      } else if (error instanceof TypeError && error.message.includes("fetch")) {
        lastError = new Error("Cannot connect to the backend. Please ensure the server is running.");
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Don't retry if it's a client error we already threw
        if (!lastError.message.includes("timed out") && !lastError.message.includes("Cannot connect")) {
          throw lastError;
        }
      }

      // Wait before retrying network errors
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string; service: string }> {
  return requestJson<{ status: string; service: string }>("/health", undefined, 1);
}

export async function fetchModels(): Promise<ModelsResponse> {
  return requestJson<ModelsResponse>("/models", undefined, 1);
}

export async function fetchDocuments(): Promise<DocumentListResponse> {
  return requestJson<DocumentListResponse>("/documents");
}

export async function uploadDocument(
  file: File,
  docType: string,
  docDate: string
): Promise<UploadResponse> {
  const normalizedDocType = (() => {
    const value = docType.trim().toLowerCase();
    if (value === "handbook/manual" || value === "handbook" || value === "manual") {
      return "handbook";
    }
    if (value === "standard operating procedure" || value === "sop") {
      return "sop";
    }
    if (value === "memo") {
      return "memo";
    }
    return "policy";
  })();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", normalizedDocType);
  formData.append("doc_date", docDate);

  return requestJson<UploadResponse>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function queryDocuments(
  question: string,
  docIds: string[] = [],
  topK = 5
): Promise<QueryResponse> {
  const payload: QueryRequest = {
    question,
    doc_ids: docIds,
    top_k: topK,
  };

  return requestJson<QueryResponse>("/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteDocument(docId: string): Promise<{ deleted: number; message: string }> {
  return requestJson<{ deleted: number; message: string }>(`/documents/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });
}

export async function deleteAllDocuments(): Promise<{ deleted: number; message: string }> {
  return requestJson<{ deleted: number; message: string }>("/documents", {
    method: "DELETE",
  });
}

export async function deleteAccount(): Promise<{ deleted_documents: number; message: string }> {
  return requestJson<{ deleted_documents: number; message: string }>("/account", {
    method: "DELETE",
  });
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  const url = new URL(`${API_BASE_URL}/auth/email-exists`);
  url.searchParams.set("email", email);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorMsg = await readErrorMessage(response);
    throw new Error(errorMsg);
  }

  return (await response.json()) as { exists: boolean };
}

export async function getDocumentViewUrl(docId: string): Promise<{ url: string; filename: string; file_type: string }> {
  return requestJson<{ url: string; filename: string; file_type: string }>(`/documents/${encodeURIComponent(docId)}/url`, {
    method: "GET",
  });
}

export { API_BASE_URL };