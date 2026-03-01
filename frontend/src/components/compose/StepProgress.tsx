"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Palette, PenTool, FileText, Send, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type StepStatus = "pending" | "active" | "completed";

export interface StepState {
  id: string;
  status: StepStatus;
}

interface StepProgressProps {
  steps: StepState[];
}

const STEP_META: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  classify_intent: { title: "Classifying Intent", description: "Analyzing what the email is about", icon: Brain },
  determine_tone: { title: "Determining Tone", description: "Choosing the right writing style", icon: Palette },
  generate_email: { title: "Generating Content", description: "AI writing the email body", icon: PenTool },
  format_email: { title: "Formatting Email", description: "Assembling the final email", icon: FileText },
  send_email: { title: "Sending Email", description: "Delivering via SMTP", icon: Send },
};

export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
          const meta = STEP_META[step.id];
          if (!meta) return null;
          const Icon = meta.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    step.status === "completed" && "bg-emerald-500/20 border-emerald-500",
                    step.status === "active" && "bg-cyan-500/20 border-cyan-400",
                    step.status === "pending" && "bg-zinc-800 border-zinc-700",
                  )}
                  animate={step.status === "active" ? { scale: [1, 1.1, 1] } : {}}
                  transition={step.status === "active" ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  <AnimatePresence mode="wait">
                    {step.status === "completed" ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                    ) : step.status === "active" ? (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, rotate: 360 }}
                        transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                      >
                        <Loader2 className="w-5 h-5 text-cyan-400" />
                      </motion.div>
                    ) : (
                      <Icon className="w-5 h-5 text-zinc-600" />
                    )}
                  </AnimatePresence>
                </motion.div>

                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-8",
                      step.status === "completed" ? "bg-emerald-500/50" : "bg-zinc-800",
                    )}
                  />
                )}
              </div>

              <div className="pt-2 pb-4">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.status === "completed" && "text-emerald-400",
                    step.status === "active" && "text-cyan-400",
                    step.status === "pending" && "text-zinc-600",
                  )}
                >
                  {meta.title}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    step.status === "pending" ? "text-zinc-700" : "text-zinc-500",
                  )}
                >
                  {meta.description}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}
