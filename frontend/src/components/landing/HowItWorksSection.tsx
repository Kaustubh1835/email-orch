"use client";

import { motion } from "framer-motion";
import { Brain, Palette, PenTool, FileText, Send } from "lucide-react";

const steps = [
  {
    icon: Brain,
    label: "Classify Intent",
    description: "AI analyzes your input to understand the purpose of the email.",
  },
  {
    icon: Palette,
    label: "Determine Tone",
    description: "Selects the appropriate writing style based on context.",
  },
  {
    icon: PenTool,
    label: "Generate Content",
    description: "GPT-4 crafts a professional email body from your intent.",
  },
  {
    icon: FileText,
    label: "Format Email",
    description: "Structures the final email with proper formatting.",
  },
  {
    icon: Send,
    label: "Send Email",
    description: "Delivers the email via SMTP with delivery confirmation.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100 mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Five automated steps from your intent to a delivered email.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start gap-5 relative"
              >
                {/* Step number circle */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-cyan-400" />
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-zinc-600">
                      0{index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-zinc-100">
                      {step.label}
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
