"use client";

import { motion } from "framer-motion";
import { Shield, Clock, Globe, Cpu } from "lucide-react";

const stats = [
  {
    icon: Cpu,
    value: "GPT-4",
    label: "Language Model",
  },
  {
    icon: Clock,
    value: "< 10s",
    label: "Generation Time",
  },
  {
    icon: Globe,
    value: "SMTP",
    label: "Delivery Protocol",
  },
  {
    icon: Shield,
    value: "TLS",
    label: "Encrypted Sending",
  },
];

export default function StatsSection() {
  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-zinc-900/50 border border-zinc-800"
            >
              <stat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-zinc-100 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
