import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span className="font-display font-bold text-cyan-400">
                Email Orchestrator AI
              </span>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs">
              AI-powered email orchestration system for generating and sending
              professional emails with intelligent automation.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/compose", label: "Compose" },
                { href: "/history", label: "History" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              Built With
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>Next.js + Tailwind CSS</li>
              <li>FastAPI + LangGraph</li>
              <li>OpenAI GPT-4</li>
              <li>SMTP Integration</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} Email Orchestrator AI. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
