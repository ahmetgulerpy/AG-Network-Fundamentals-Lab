import { useEffect, useState } from "react";
import { Play, StepForward, RotateCcw, Pause } from "lucide-react";
import { Btn } from "./ui";

export interface Actor {
  id: string;
  label: string;
  sub?: string;
  emoji?: string;
}
export interface SeqStep {
  from: string;
  to: string;
  label: string;
  detail: string;
  tone?: "yellow" | "green" | "red" | "blue";
}

const TONES = { yellow: "#facc15", green: "#34d399", red: "#f87171", blue: "#38bdf8" };

export function SequenceDiagram({
  actors,
  steps,
  onComplete,
  autoStart = true,
}: {
  actors: Actor[];
  steps: SeqStep[];
  onComplete?: () => void;
  autoStart?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const [auto, setAuto] = useState(autoStart);
  const W = 720;
  const rowH = 62;
  const top = 96;
  const H = top + steps.length * rowH + 20;
  const xs = actors.map((_, i) => (actors.length === 1 ? W / 2 : 90 + (i * (W - 180)) / (actors.length - 1)));
  const xOf = (id: string) => xs[actors.findIndex((a) => a.id === id)];

  useEffect(() => {
    if (!auto) return;
    if (shown >= steps.length) {
      setAuto(false);
      return;
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 300 : 1500);
    return () => clearTimeout(t);
  }, [auto, shown, steps.length]);

  useEffect(() => {
    if (steps.length && shown === steps.length) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const cur = shown > 0 ? steps[shown - 1] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Btn
          onClick={() => {
            if (shown >= steps.length) setShown(0);
            setAuto((a) => !a);
          }}
        >
          {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {auto ? "Duraklat" : shown >= steps.length ? "Yeniden oynat" : "Otomatik oynat"}
        </Btn>
        <Btn
          variant="ghost"
          disabled={shown >= steps.length}
          onClick={() => {
            setAuto(false);
            setShown((s) => Math.min(steps.length, s + 1));
          }}
        >
          <StepForward className="h-4 w-4" /> Sonraki adım
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setAuto(false);
            setShown(0);
          }}
        >
          <RotateCcw className="h-4 w-4" /> Başa sar
        </Btn>
        <span className="ml-auto self-center text-xs text-zinc-400">
          Adım {shown} / {steps.length}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full min-w-[560px]" style={{ maxWidth: W + 100 }}>
          {actors.map((a, i) => (
            <g key={a.id}>
              <line x1={xs[i]} y1={72} x2={xs[i]} y2={H - 8} stroke="#3f3f46" strokeDasharray="5 5" />
              <rect x={xs[i] - 70} y={8} width={140} height={60} rx={12} fill="#18181b" stroke="#facc15" strokeOpacity={0.5} />
              <text x={xs[i]} y={32} textAnchor="middle" fontSize="20">
                {a.emoji}
              </text>
              <text x={xs[i]} y={50} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                {a.label}
              </text>
              {a.sub && (
                <text x={xs[i]} y={63} textAnchor="middle" fill="#a1a1aa" fontSize="9.5" fontFamily="monospace">
                  {a.sub}
                </text>
              )}
            </g>
          ))}
          {steps.slice(0, shown).map((s, i) => {
            const y = top + i * rowH + 20;
            const x1 = xOf(s.from);
            const x2 = xOf(s.to);
            const c = TONES[s.tone ?? "yellow"];
            const latest = i === shown - 1;
            if (s.from === s.to) {
              return (
                <g key={i} opacity={latest ? 1 : 0.7}>
                  <rect x={x1 + 12} y={y - 16} width={200} height={32} rx={8} fill="#18181b" stroke={c} />
                  <text x={x1 + 112} y={y + 4} textAnchor="middle" fill="#fff" fontSize="11">
                    {i + 1}. {s.label}
                  </text>
                </g>
              );
            }
            const dir = x2 > x1 ? 1 : -1;
            return (
              <g key={i} opacity={latest ? 1 : 0.65}>
                <line x1={x1} y1={y} x2={x2 - dir * 8} y2={y} stroke={c} strokeWidth={2.2} />
                <polygon points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`} fill={c} />
                <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="600">
                  {i + 1}. {s.label}
                </text>
                {latest && (
                  <circle r={6} cy={y} fill={c}>
                    <animate attributeName="cx" from={x1} to={x2} dur="0.9s" fill="freeze" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="min-h-16 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3 text-sm text-zinc-200">
        {cur ? (
          <>
            <b className="text-yellow-300">
              Adım {shown}: {cur.label}
            </b>
            <div className="mt-1 text-zinc-300">{cur.detail}</div>
          </>
        ) : (
          <span className="text-zinc-400">Başlamak için “Otomatik oynat” veya “Sonraki adım” butonuna bas.</span>
        )}
      </div>
    </div>
  );
}
