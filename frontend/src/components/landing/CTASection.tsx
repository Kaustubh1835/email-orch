"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 px-4 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100 mb-4">
            Ready to automate your emails?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Describe what you need, review the AI-generated draft, and send
            — all in one streamlined workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/compose"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition-all text-lg"
            >
              Start Composing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-zinc-100 transition-all text-lg"
            >
              View History
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
