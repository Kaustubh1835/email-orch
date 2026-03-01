"use client";

import { useState, useEffect, useCallback } from "react";
import { getEmails } from "@/lib/api/email";
import type { EmailSummary } from "@/lib/api/types";

export function useEmailHistory() {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmails(p, 20);
      setEmails(result.emails);
      setTotal(result.total);
      setPage(p);
    } catch {
      setError("Failed to load email history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  const refresh = () => fetchEmails(page);
  const goToPage = (p: number) => fetchEmails(p);

  return { emails, total, page, loading, error, refresh, goToPage };
}
