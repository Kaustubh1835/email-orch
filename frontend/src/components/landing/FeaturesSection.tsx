"use client";

import { motion } from "framer-motion";
import { Brain, Zap, BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";

const features = [
  {
    icon: Brain,
    title: "AI-Generated Content",
    description:
      "GPT-4 powered email generation with intelligent intent classification and automatic tone detection for every message.",
    color: "text-cyan-400",
  },
  {
    icon: Zap,
    title: "Smart Automation",
    description:
      "Automated follow-up scheduling with reply detection. Never miss an opportunity with intelligent email tracking.",
    color: "text-purple-400",
  },
  {
    icon: BarChart3,
    title: "Complete Tracking",
    description:
      "Full email history with status tracking, delivery confirmations, and detailed metadata for every sent message.",
    color: "text-blue-400",
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100 mb-4">
            Intelligent Email Workflow
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            From intent classification to automated follow-ups, every step is
            orchestrated by AI.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
