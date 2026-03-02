"use client";

import { useState, useCallback } from "react";
import {
  generateEmailStream,
  sendEmail as apiSendEmail,
} from "@/lib/api/email";
import type { SSEEvent } from "@/lib/api/email";
import { useEmailStore } from "@/lib/store/emailStore";
import type { StepState } from "@/components/compose/StepProgress";

const ALL_STEP_IDS = [
  "classify_intent",
  "determine_tone",
  "generate_email",
  "format_email",
  "send_email",
];

function buildInitialSteps(): StepState[] {
  return ALL_STEP_IDS.map((id) => ({ id, status: "pending" as const }));
}

export function useEmailGeneration() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(buildInitialSteps());
  const [showStepper, setShowStepper] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { currentEmailId, generatedEmail, intent, tone, setGenerated, clear } =
    useEmailStore();

  const updateStep = useCallback((stepId: string, stepStatus: string) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx === -1) return prev;

      if (stepStatus === "started") {
        return prev.map((s, i) => {
          if (i < idx) return { ...s, status: "completed" as const };
          if (i === idx) return { ...s, status: "active" as const };
          return s;
        });
      }

      // status === "completed" — don't auto-activate the next step if it's send_email
      return prev.map((s, i) => {
        if (i < idx) return { ...s, status: "completed" as const };
        if (i === idx) return { ...s, status: "completed" as const };
        if (i === idx + 1 && prev[i].id !== "send_email")
          return { ...s, status: "active" as const };
        return s;
      });
    });
  }, []);

  const generate = async (
    sender: string,
    receiver: string,
    subject: string,
    userIntent: string,
    salutation?: string
  ) => {
    setLoading(true);
    setError(null);
    setSent(false);
    setShowStepper(true);

    setSteps(
      ALL_STEP_IDS.map((id, i) => ({
        id,
        status: i === 0 ? ("active" as const) : ("pending" as const),
      }))
    );

    try {
      await generateEmailStream(
        { sender, receiver, subject, user_intent: userIntent, salutation: salutation || undefined },
        (event: SSEEvent) => {
          if (event.event === "step") {
            updateStep(event.step, event.status);
          } else if (event.event === "complete") {
            setGenerated(
              event.email_id,
              event.formatted_email,
              event.intent,
              event.tone
            );
          } else if (event.event === "error") {
            setError(event.message);
          }
        }
      );

      // Brief pause to show all-green stepper before transitioning to preview
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        setShowUpgradeModal(true);
        setShowStepper(false);
      } else {
        setError("Failed to generate email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!currentEmailId) return;
    setSending(true);
    setError(null);
    setShowStepper(true);

    setSteps((prev) =>
      prev.map((s) =>
        s.id === "send_email" ? { ...s, status: "active" as const } : s
      )
    );

    try {
      await apiSendEmail({ email_id: currentEmailId });
      setSent(true);
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "send_email" ? { ...s, status: "completed" as const } : s
        )
      );
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { detail?: string } } })?.response;
      if (response?.status === 403) {
        setShowUpgradeModal(true);
      } else {
        const msg = response?.data?.detail || "Failed to send email. Please try again.";
        setError(msg);
      }
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "send_email" ? { ...s, status: "pending" as const } : s
        )
      );
    } finally {
      setSending(false);
    }
  };

  const review = () => {
    setShowStepper(false);
  };

  const reset = () => {
    clear();
    setError(null);
    setSent(false);
    setSteps(buildInitialSteps());
    setShowStepper(false);
  };

  return {
    loading,
    sending,
    sent,
    error,
    currentEmailId,
    generatedEmail,
    intent,
    tone,
    steps,
    showStepper,
    showUpgradeModal,
    setShowUpgradeModal,
    generate,
    send,
    review,
    reset,
  };
}
