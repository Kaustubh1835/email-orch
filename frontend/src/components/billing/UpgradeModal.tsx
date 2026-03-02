"use client";

import { useState } from "react";
import { Sparkles, Zap, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createCheckoutSession } from "@/lib/api/billing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>

        <h2 className="text-xl font-display font-bold text-zinc-100 mb-2">
          Upgrade to Basic Plan
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          You&apos;ve used your free email. Upgrade to unlock unlimited access.
        </p>

        <div className="rounded-lg border border-white/10 bg-zinc-800/50 p-5 mb-6 text-left">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-lg font-semibold text-zinc-100">Basic</span>
            <div>
              <span className="text-2xl font-bold text-cyan-400">$3</span>
              <span className="text-zinc-500 text-sm">/month</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {[
              "Unlimited email generations",
              "Unlimited email sends",
              "AI-powered tone & intent",
              "Follow-up scheduling",
              "Priority support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Redirecting to checkout..." : "Upgrade Now"}
        </button>

        <p className="text-zinc-600 text-xs mt-3">
          Powered by Stripe. Cancel anytime.
        </p>
      </div>
    </Modal>
  );
}
