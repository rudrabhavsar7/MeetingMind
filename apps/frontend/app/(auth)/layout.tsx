import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s | MeetingMind",
  },
};

/**
 * Shared layout for all auth pages (/login, /register).
 * Centers the form card on screen with a branded split-panel design.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.627 0.194 149.216) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9 1.5C5.96 1.5 3.5 3.96 3.5 7c0 2.04 1.09 3.82 2.72 4.82L5.5 14h7l-.72-2.18C13.41 10.82 14.5 9.04 14.5 7c0-3.04-2.46-5.5-5.5-5.5z"
                fill="white"
              />
              <circle cx="9" cy="16" r="1" fill="white" />
            </svg>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">
            MeetingMind
          </span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-light text-white/90 leading-relaxed">
            &ldquo;Your meetings, fully understood.
            <br />
            Your data, fully yours.&rdquo;
          </blockquote>
          <ul className="space-y-3">
            {[
              "Speaker-aware live transcription",
              "AI summaries & action items",
              "RAG-powered meeting search",
              "100% self-hosted, privacy-first",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/30 text-xs">
          Privacy-first · Self-hosted · Enterprise-grade
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
