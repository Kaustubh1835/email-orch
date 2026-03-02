"use client";

import { useRef } from "react";
import { CheckCircle, Mail, PenLine, Eye as EyeIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import EmailForm from "@/components/compose/EmailForm";
import EmailPreview from "@/components/compose/EmailPreview";
import ActionButtons from "@/components/compose/ActionButtons";
import UpgradeModal from "@/components/billing/UpgradeModal";
import { useEmailGeneration } from "@/lib/hooks/useEmailGeneration";

export default function ComposePage() {
  const {
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
  } = useEmailGeneration();

  const formDataRef = useRef<{
    sender: string;
    receiver: string;
    subject: string;
    salutation?: string;
    user_intent: string;
  } | null>(null);

  const handleGenerate = (data: {
    sender: string;
    receiver: string;
    subject: string;
    salutation?: string;
    user_intent: string;
  }) => {
    formDataRef.current = data;
    generate(data.sender, data.receiver, data.subject, data.user_intent, data.salutation);
  };

  const handleRegenerate = () => {
    if (formDataRef.current) {
      reset();
      const d = formDataRef.current;
      generate(d.sender, d.receiver, d.subject, d.user_intent, d.salutation);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Page header */}
          <div className="mb-10 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-cyan-600/10 border border-cyan-600/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-zinc-100">
                Compose Email
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                Describe your intent and let AI generate a professional email.
              </p>
            </div>
          </div>

          {/* Alerts */}
          {sent && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Your email has been generated and sent successfully!</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — Form (narrower) */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden sticky top-24">
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Email Details
                  </h2>
                </div>
                <div className="p-5">
                  <EmailForm
                    onSubmit={handleGenerate}
                    loading={loading}
                    disabled={sending}
                  />
                </div>
              </div>
            </div>

            {/* Right — Preview / Stepper (wider) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden flex-1">
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      {showStepper && !sent ? "Pipeline Progress" : "Email Preview"}
                    </h2>
                  </div>
                  {intent && !showStepper && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                        {intent.replace("_", " ")}
                      </span>
                      {tone && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
                          {tone.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <EmailPreview
                    email={generatedEmail}
                    intent={null}
                    tone={null}
                    loading={loading}
                    steps={steps}
                    showStepper={showStepper}
                  />
                </div>
              </div>

              <ActionButtons
                onSend={send}
                onRegenerate={handleRegenerate}
                onReview={review}
                sending={sending}
                sent={sent}
                hasEmail={!!generatedEmail}
                showStepper={showStepper}
                loading={loading}
                emailId={currentEmailId ?? undefined}
              />
            </div>
          </div>
        </div>
      </PageTransition>
      <Footer />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </main>
  );
}
