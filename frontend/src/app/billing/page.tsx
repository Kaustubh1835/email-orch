"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Zap, Crown, ExternalLink, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/api/billing";
import type { BillingStatusResponse } from "@/lib/api/types";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { updateUser } = useAuthStore();
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const status = await getBillingStatus();
        setBilling(status);
        updateUser({
          plan: status.plan as "free" | "basic",
          emails_generated: status.emails_generated,
          emails_sent: status.emails_sent,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const { portal_url } = await createPortalSession();
      window.location.href = portal_url;
    } catch {
      setActionLoading(false);
    }
  };

  const isPaid = billing?.plan === "basic";

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Header */}
          <div className="mb-10 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-cyan-600/10 border border-cyan-600/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-zinc-100">
                Billing
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                Manage your subscription and view usage.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : billing ? (
            <div className="space-y-6">
              {/* Current Plan Card */}
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Current Plan
                  </h2>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isPaid
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
                    }`}
                  >
                    {isPaid ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Basic
                      </span>
                    ) : (
                      "Free"
                    )}
                  </span>
                </div>

                {isPaid && billing.plan_expires_at && (
                  <p className="text-xs text-zinc-500 mb-4">
                    Renews on{" "}
                    {new Date(billing.plan_expires_at).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                )}

                {!isPaid && (
                  <p className="text-sm text-zinc-400 mb-4">
                    You&apos;re on the free plan with limited usage. Upgrade to
                    Basic for unlimited access.
                  </p>
                )}

                {isPaid ? (
                  <button
                    onClick={handleManage}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {actionLoading ? "Opening..." : "Manage Subscription"}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {actionLoading
                      ? "Redirecting..."
                      : "Upgrade to Basic — $3/mo"}
                  </button>
                )}
              </div>

              {/* Usage */}
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Usage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-white/5 bg-zinc-800/40 p-4">
                    <p className="text-xs text-zinc-500 mb-1">
                      Emails Generated
                    </p>
                    <p className="text-2xl font-bold text-zinc-100">
                      {billing.emails_generated}
                      <span className="text-sm font-normal text-zinc-500 ml-1">
                        / {isPaid ? "Unlimited" : billing.free_generation_limit}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-zinc-800/40 p-4">
                    <p className="text-xs text-zinc-500 mb-1">Emails Sent</p>
                    <p className="text-2xl font-bold text-zinc-100">
                      {billing.emails_sent}
                      <span className="text-sm font-normal text-zinc-500 ml-1">
                        / {isPaid ? "Unlimited" : billing.free_send_limit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              Failed to load billing information. Please try again.
            </div>
          )}
        </div>
      </PageTransition>
      <Footer />
    </main>
  );
}
