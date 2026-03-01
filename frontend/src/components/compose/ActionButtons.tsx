"use client";

import { motion } from "framer-motion";
import { Send, RefreshCw, CheckCircle, Eye, CalendarClock } from "lucide-react";
import Button from "@/components/ui/Button";
import FollowupScheduler from "@/components/followup/FollowupScheduler";

interface ActionButtonsProps {
  onSend: () => void;
  onRegenerate: () => void;
  onReview: () => void;
  sending: boolean;
  sent: boolean;
  hasEmail: boolean;
  showStepper: boolean;
  loading: boolean;
  emailId?: string;
}

export default function ActionButtons({
  onSend,
  onRegenerate,
  onReview,
  sending,
  sent,
  hasEmail,
  showStepper,
  loading,
  emailId,
}: ActionButtonsProps) {
  if (!hasEmail || loading) return null;

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <span className="text-emerald-400 font-medium">
              Email sent successfully!
            </span>
          </motion.div>
          <Button onClick={onRegenerate} variant="secondary" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            New Email
          </Button>
        </div>

        {/* Follow-up scheduler */}
        {emailId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Schedule Follow-up
              </h3>
            </div>
            <div className="p-5">
              <FollowupScheduler emailId={emailId} />
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Stepper is visible — generation just completed, show Review + Send
  if (showStepper) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mt-4"
      >
        <Button
          onClick={onReview}
          variant="secondary"
          size="lg"
          className="flex-1"
          disabled={sending}
        >
          <Eye className="w-4 h-4 mr-2" />
          Review Email
        </Button>
        <Button
          onClick={onSend}
          loading={sending}
          size="lg"
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </motion.div>
    );
  }

  // Preview is visible — show Send + Regenerate
  return (
    <div className="flex gap-3 mt-4">
      <Button
        onClick={onSend}
        loading={sending}
        size="lg"
        className="flex-1"
      >
        <Send className="w-4 h-4 mr-2" />
        Send Email
      </Button>
      <Button
        onClick={onRegenerate}
        variant="secondary"
        size="lg"
        disabled={sending}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Regenerate
      </Button>
    </div>
  );
}
