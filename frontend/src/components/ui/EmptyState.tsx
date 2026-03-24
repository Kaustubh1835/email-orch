import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-lg bg-cyan-600/10 border border-cyan-600/20 flex items-center justify-center">
          <Icon className="w-8 h-8 text-cyan-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-400 mb-6 max-w-sm mx-auto">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 transition-all"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
