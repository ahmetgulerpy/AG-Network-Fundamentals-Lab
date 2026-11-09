import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-white/10 bg-zinc-900/70 p-5", className)}>{children}</div>;
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-yellow-400 text-black hover:bg-yellow-300",
        variant === "ghost" && "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10",
        variant === "danger" && "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "yellow" }: { children: ReactNode; tone?: "yellow" | "green" | "red" | "gray" }) {
  const t = {
    yellow: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
    green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    red: "bg-red-400/15 text-red-300 border-red-400/30",
    gray: "bg-white/5 text-zinc-300 border-white/10",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", t)}>{children}</span>;
}

export function Callout({ icon, title, children, tone = "yellow" }: { icon?: string; title: string; children: ReactNode; tone?: "yellow" | "blue" | "green" | "red" }) {
  const t = {
    yellow: "border-yellow-400/30 bg-yellow-400/5",
    blue: "border-sky-400/30 bg-sky-400/5",
    green: "border-emerald-400/30 bg-emerald-400/5",
    red: "border-red-400/30 bg-red-400/5",
  }[tone];
  return (
    <div className={cn("rounded-xl border p-4", t)}>
      <div className="mb-1 text-sm font-semibold text-white">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </div>
      <div className="text-sm leading-relaxed text-zinc-300">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className="h-full rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function LabSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mb-4 grid gap-2 sm:grid-cols-2">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-sm text-zinc-300">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
