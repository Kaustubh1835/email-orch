import { create } from "zustand";

interface EmailState {
  currentEmailId: string | null;
  generatedEmail: string | null;
  intent: string | null;
  tone: string | null;
  setGenerated: (
    emailId: string,
    email: string,
    intent: string,
    tone: string
  ) => void;
  clear: () => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  currentEmailId: null,
  generatedEmail: null,
  intent: null,
  tone: null,

  setGenerated: (emailId, email, intent, tone) =>
    set({
      currentEmailId: emailId,
      generatedEmail: email,
      intent,
      tone,
    }),

  clear: () =>
    set({
      currentEmailId: null,
      generatedEmail: null,
      intent: null,
      tone: null,
    }),
}));
