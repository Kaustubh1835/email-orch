"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, X, CalendarPlus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Button from "@/components/ui/Button";
import {
  scheduleFollowup,
  getFollowups,
  cancelFollowup,
} from "@/lib/api/email";
import type { FollowupResponse } from "@/lib/api/types";

interface FollowupSchedulerProps {
  emailId: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export default function FollowupScheduler({ emailId }: FollowupSchedulerProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [followups, setFollowups] = useState<FollowupResponse[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchFollowups = useCallback(async () => {
    try {
      const res = await getFollowups(emailId);
      setFollowups(res.followups);
    } catch {
      // Silently fail on fetch — list just stays empty
    }
  }, [emailId]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleSchedule = async () => {
    if (!scheduledAt) return;

    setScheduling(true);
    setError(null);
    setSuccess(false);

    try {
      const utcDate = new Date(scheduledAt).toISOString();
      await scheduleFollowup({ email_id: emailId, scheduled_at: utcDate });
      setSuccess(true);
      setScheduledAt("");
      await fetchFollowups();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to schedule follow-up";
      setError(msg);
    } finally {
      setScheduling(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelFollowup(id);
      await fetchFollowups();
    } catch {
      setError("Failed to cancel follow-up");
    }
  };

  // Minimum datetime = now + 5 minutes
  const minDate = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-4">
      {/* Schedule form */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="followup-date"
            className="block text-sm font-medium text-zinc-300"
          >
            Follow-up Date & Time
          </label>
          <input
            id="followup-date"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={minDate}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-100",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50",
              "transition-all text-sm",
              "[color-scheme:dark]"
            )}
          />
        </div>
        <Button
          onClick={handleSchedule}
          loading={scheduling}
          disabled={!scheduledAt}
          size="md"
        >
          <CalendarPlus className="w-4 h-4 mr-2" />
          Schedule
        </Button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          Follow-up scheduled successfully!
        </div>
      )}

      {/* Existing follow-ups list */}
      {followups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Scheduled Follow-ups
          </p>
          <div className="space-y-2">
            {followups.map((fu) => (
              <div
                key={fu.id}
                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-300">
                      {new Date(fu.scheduled_at).toLocaleString()}
                    </p>
                    {fu.executed_at && (
                      <p className="text-xs text-zinc-500">
                        Executed: {new Date(fu.executed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] rounded-full border capitalize",
                      STATUS_STYLES[fu.status] || STATUS_STYLES.pending
                    )}
                  >
                    {fu.status}
                  </span>
                  {fu.status === "pending" && (
                    <button
                      onClick={() => handleCancel(fu.id)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Cancel follow-up"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
