"use client";

import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "./StatusBadge";
import FollowupScheduler from "@/components/followup/FollowupScheduler";
import type { EmailDetail } from "@/lib/api/types";

interface EmailDetailModalProps {
  email: EmailDetail | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
}

export default function EmailDetailModal({
  email,
  isOpen,
  onClose,
  loading,
}: EmailDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : email ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">
              {email.subject}
            </h2>
            <StatusBadge status={email.status} />
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex gap-2">
              <span className="text-zinc-500 w-16">From:</span>
              <span className="text-zinc-300">{email.sender}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-zinc-500 w-16">To:</span>
              <span className="text-zinc-300">{email.receiver}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-zinc-500 w-16">Date:</span>
              <span className="text-zinc-300">
                {format(new Date(email.created_at), "MMM d, yyyy h:mm a")}
              </span>
            </div>
            {email.intent && (
              <div className="flex gap-2">
                <span className="text-zinc-500 w-16">Intent:</span>
                <span className="text-cyan-400">
                  {email.intent.replace("_", " ")}
                </span>
              </div>
            )}
            {email.tone && (
              <div className="flex gap-2">
                <span className="text-zinc-500 w-16">Tone:</span>
                <span className="text-purple-400">
                  {email.tone.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed bg-white/[0.02] rounded-lg p-4 border border-white/5 max-h-[400px] overflow-y-auto">
            {email.body}
          </div>

          {email.error_message && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Error: {email.error_message}
            </div>
          )}

          {email.status === "sent" && (
            <div className="mt-6 border-t border-white/5 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Schedule Follow-up
                </h3>
              </div>
              <FollowupScheduler emailId={email.id} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-zinc-500 text-center py-8">
          Failed to load email details.
        </p>
      )}
    </Modal>
  );
}
