"use client";

import { useCallback, useState } from "react";
import { fetchDocuments, type DocumentMeta } from "@/lib/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchDocuments();
      setDocuments(response.documents);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load documents";
      setError(message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments,
  };
}