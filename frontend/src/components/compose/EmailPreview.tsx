"use client";

import { motion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import StepProgress from "@/components/compose/StepProgress";
import type { StepState } from "@/components/compose/StepProgress";

interface EmailPreviewProps {
  email: string | null;
  intent: string | null;
  tone: string | null;
  loading: boolean;
  steps?: StepState[];
  showStepper?: boolean;
}

export default function EmailPreview({
  email,
  loading,
  steps,
  showStepper,
}: EmailPreviewProps) {
  if (showStepper && steps) {
    return (
      <div className="min-h-[360px] flex flex-col justify-center">
        <StepProgress steps={steps} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-sm text-zinc-400">
            AI is crafting your email...
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2.5 h-2.5 rounded-full bg-cyan-400"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm font-medium">
          No email generated yet
        </p>
        <p className="text-zinc-600 text-xs mt-1 max-w-[240px]">
          Fill in the email details on the left and click Generate to get started.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-mono bg-zinc-950/50 rounded-lg p-4 border border-white/5 min-h-[360px]">
        {email}
      </div>
    </motion.div>
  );
}
