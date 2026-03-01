"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const emailFormSchema = z.object({
  sender: z.string().email("Invalid email address"),
  receiver: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  salutation: z.string().max(100).optional(),
  user_intent: z
    .string()
    .min(5, "Please provide more detail about your email intent")
    .max(1000),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

interface EmailFormProps {
  onSubmit: (data: EmailFormData) => void;
  loading: boolean;
  disabled?: boolean;
}

export default function EmailForm({
  onSubmit,
  loading,
  disabled,
}: EmailFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="sender"
        label="From"
        type="email"
        placeholder="you@example.com"
        error={errors.sender?.message}
        {...register("sender")}
      />
      <Input
        id="receiver"
        label="To"
        type="email"
        placeholder="recipient@example.com"
        error={errors.receiver?.message}
        {...register("receiver")}
      />
      <Input
        id="subject"
        label="Subject"
        type="text"
        placeholder='e.g., "Internship request at Google"'
        error={errors.subject?.message}
        {...register("subject")}
      />
      <div className="space-y-1.5">
        <label htmlFor="salutation" className="block text-sm font-medium text-zinc-300">
          Salutation <span className="text-zinc-600">(optional)</span>
        </label>
        <select
          id="salutation"
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
          {...register("salutation")}
        >
          <option value="" className="bg-zinc-900 text-zinc-400">Auto-detect from email</option>
          <option value="Sir" className="bg-zinc-900 text-zinc-100">Sir</option>
          <option value="Ma'am" className="bg-zinc-900 text-zinc-100">Ma&apos;am</option>
          <option value="Sir/Ma'am" className="bg-zinc-900 text-zinc-100">Sir/Ma&apos;am</option>
          <option value="Mr." className="bg-zinc-900 text-zinc-100">Mr.</option>
          <option value="Ms." className="bg-zinc-900 text-zinc-100">Ms.</option>
          <option value="Dr." className="bg-zinc-900 text-zinc-100">Dr.</option>
          <option value="Prof." className="bg-zinc-900 text-zinc-100">Prof.</option>
        </select>
      </div>
      <Textarea
        id="user_intent"
        label="Intent"
        placeholder='Describe what the email should convey, e.g., "Request an internship position, mention my React and Python skills, express enthusiasm for their AI team"'
        rows={5}
        error={errors.user_intent?.message}
        {...register("user_intent")}
      />

      <Button
        type="submit"
        loading={loading}
        disabled={disabled}
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Email
      </Button>
    </form>
  );
}
