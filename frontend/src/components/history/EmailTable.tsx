"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import type { EmailSummary, EmailDetail } from "@/lib/api/types";
import { getEmailById } from "@/lib/api/email";
import StatusBadge from "./StatusBadge";
import EmailDetailModal from "./EmailDetailModal";

interface EmailTableProps {
  emails: EmailSummary[];
  loading: boolean;
}

export default function EmailTable({ emails, loading }: EmailTableProps) {
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleView = async (id: string) => {
    setDetailLoading(true);
    setModalOpen(true);
    try {
      const detail = await getEmailById(id);
      setSelectedEmail(detail);
    } catch {
      setSelectedEmail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500">No emails yet. Start composing!</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Recipient
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr
                key={email.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-zinc-400">
                  {format(new Date(email.created_at), "MMM d, yyyy")}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-300">
                  {email.receiver}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-300 max-w-[250px] truncate">
                  {email.subject}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={email.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleView(email.id)}
                    className="text-zinc-400 hover:text-cyan-400 transition-colors p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => handleView(email.id)}
            className="glass rounded-lg p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                {format(new Date(email.created_at), "MMM d, yyyy")}
              </span>
              <StatusBadge status={email.status} />
            </div>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {email.subject}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{email.receiver}</p>
          </div>
        ))}
      </div>

      <EmailDetailModal
        email={selectedEmail}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEmail(null);
        }}
        loading={detailLoading}
      />
    </>
  );
}
