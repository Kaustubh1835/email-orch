"use client";

import { RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import EmailTable from "@/components/history/EmailTable";
import { useEmailHistory } from "@/lib/hooks/useEmailHistory";

export default function HistoryPage() {
  const { emails, total, loading, error, refresh } = useEmailHistory();

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-zinc-100">
                Email History
              </h1>
              <p className="text-zinc-400 mt-1">
                {total} email{total !== 1 ? "s" : ""} total
              </p>
            </div>
            <Button onClick={refresh} variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <EmailTable emails={emails} loading={loading} />
        </div>
      </PageTransition>
      <Footer />
    </main>
  );
}
