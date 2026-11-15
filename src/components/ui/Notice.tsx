import type { ReactNode } from "react";

const tones = {
  info: "border-line bg-paper text-ink",
  warn: "border-saffron/50 bg-saffron-tint text-ink",
  danger: "border-danger/40 bg-danger-tint text-ink",
  success: "border-pine/40 bg-pine-tint text-ink",
} as const;

export function Notice({ tone = "info", children, action }: { tone?: keyof typeof tones; children: ReactNode; action?: ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[0.95rem] ${tones[tone]}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-[2rem] sm:text-[2.5rem]">{title}</h1>
        {intro && <p className="prose-narrow mt-2 text-ink-soft">{intro}</p>}
      </div>
      {children}
    </div>
  );
}
