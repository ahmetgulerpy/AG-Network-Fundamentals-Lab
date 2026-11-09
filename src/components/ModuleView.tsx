import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, GraduationCap, BookOpen, Eye, FlaskConical, ListChecks, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";
import { Btn, Badge, Callout, Card, LabSteps, ProgressBar } from "./ui";
import { ModuleVisual } from "./Visuals";
import { NetworkLab } from "./NetworkLab";
import { ProtocolLab } from "./ProtocolLab";
import { DhcpDnsLab } from "./DhcpDnsLab";
import { TransmissionLab } from "./TransmissionLab";
import { TerminalLab } from "./TerminalLab";
import type { ModuleDef } from "../data/types";
import { MODULES, moduleProgress } from "../data/modules";
import { actions, useStore } from "../lib/store";

export type TabKey = "anlatim" | "gorsel" | "lab" | "gorevler" | "sinav";
const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "anlatim", label: "Konu Anlatımı", icon: BookOpen },
  { key: "gorsel", label: "Görsel Açıklama", icon: Eye },
  { key: "lab", label: "Sanal Laboratuvar", icon: FlaskConical },
  { key: "gorevler", label: "Görevler", icon: ListChecks },
  { key: "sinav", label: "Mini Sınav", icon: HelpCircle },
];

export function ModuleView({ m, tab, go }: { m: ModuleDef; tab: TabKey; go: (hash: string) => void }) {
  const s = useStore();
  const p = moduleProgress(m, s);
  const idx = MODULES.findIndex((x) => x.id === m.id);
  const next = MODULES[idx + 1];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Modül {m.no}</div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{m.title}</h1>
          <p className="text-zinc-400">{m.tagline}</p>
        </div>
        <div className="w-56">
          <div className="mb-1 flex justify-between text-xs text-zinc-400">
            <span>Modül ilerlemesi</span>
            <span className="text-yellow-300">%{Math.round(p.value * 100)}</span>
          </div>
          <ProgressBar value={p.value} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/70 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => go(`/module/${m.id}/${t.key}`)}
              className={cn("flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition", tab === t.key ? "bg-yellow-400 text-black" : "text-zinc-300 hover:bg-white/10")}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "anlatim" && <Lesson m={m} go={go} />}
      {tab === "gorsel" && (
        <div className="space-y-3">
          <Callout icon="👀" title="Görsel anlatım">
            Şekillere ve etkileşimli kutulara dokunarak konuyu gözünle gör. Sonra sanal laboratuvarda kendin dene.
          </Callout>
          <ModuleVisual id={m.id} />
          <Btn onClick={() => go(`/module/${m.id}/lab`)}>
            Sanal laboratuvara geç <ArrowRight className="h-4 w-4" />
          </Btn>
        </div>
      )}
      {tab === "lab" && (
        <div className="space-y-4">
          {m.lab && <LabSteps steps={m.lab.steps} />}
          {m.labKind === "network" && m.lab && <NetworkLab key={m.id} moduleId={m.id} config={m.lab} />}
          {m.labKind === "protocol" && <ProtocolLab moduleId={m.id} />}
          {m.labKind === "dhcpdns" && <DhcpDnsLab moduleId={m.id} />}
          {m.labKind === "transmission" && <TransmissionLab moduleId={m.id} />}
          {m.labKind === "terminal" && <TerminalLab moduleId={m.id} />}
          <Btn onClick={() => go(`/module/${m.id}/gorevler`)}>
            Görevlere geç <ArrowRight className="h-4 w-4" />
          </Btn>
        </div>
      )}
      {tab === "gorevler" && <Tasks m={m} go={go} />}
      {tab === "sinav" && <Quiz key={m.id} m={m} />}

      {next && p.complete && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-500/30 bg-emerald-500/5">
          <div className="text-emerald-300">
            🎉 Bu modülü tamamladın! Sıradaki: <b>{next.title}</b>
          </div>
          <Btn onClick={() => go(`/module/${next.id}/anlatim`)}>
            Sonraki modül <ArrowRight className="h-4 w-4" />
          </Btn>
        </Card>
      )}
    </div>
  );
}

function Lesson({ m, go }: { m: ModuleDef; go: (h: string) => void }) {
  const s = useStore();
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [inst, setInst] = useState(false);
  const toggle = (i: number) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <div className="space-y-4">
      <Callout icon="🏠" title="Önce günlük hayattan düşünelim">
        {m.intro}
      </Callout>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Konular ({m.topics.length})</h2>
        <button className="text-sm text-yellow-300 hover:underline" onClick={() => setOpen(open.size === m.topics.length ? new Set() : new Set(m.topics.map((_, i) => i)))}>
          {open.size === m.topics.length ? "Hepsini kapat" : "Hepsini aç"}
        </button>
      </div>
      <div className="space-y-2">
        {m.topics.map((t, i) => {
          const isOpen = open.has(i);
          return (
            <div key={t.title} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70">
              <button onClick={() => toggle(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-black">{i + 1}</span>
                <span className="flex-1 font-semibold text-white">{t.title}</span>
                <ChevronDown className={cn("h-5 w-5 text-zinc-400 transition", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
                  {[
                    ["❓ Bu konu nedir?", t.what, "border-white/10"],
                    ["🎯 Neden kullanılır?", t.why, "border-white/10"],
                    ["🏠 Günlük hayattan örnek", t.life, "border-yellow-400/40 bg-yellow-400/5"],
                    ["⚙️ Teknik olarak nasıl çalışır?", t.tech, "border-sky-400/30 bg-sky-400/5"],
                  ].map(([h, b, c]) => (
                    <div key={h} className={cn("rounded-lg border p-3", c)}>
                      <div className="mb-1 text-xs font-semibold text-zinc-300">{h}</div>
                      <div className="text-sm leading-relaxed text-zinc-100">{b}</div>
                    </div>
                  ))}
                  {t.tip && (
                    <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-zinc-200 md:col-span-2">
                      <b className="text-red-300">⚠ Sık karıştırılır:</b> {t.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-white">Öğrenme yolun</div>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["Görsel anlatım", "gorsel"],
            ["Sanal laboratuvar", "lab"],
            ["Görevler", "gorevler"],
            ["Öğrenme kontrolü (mini sınav)", "sinav"],
          ].map(([l, k], i) => (
            <button key={k} onClick={() => go(`/module/${m.id}/${k}`)} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-zinc-200 hover:bg-white/10">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">{i + 5}</span>
              {l}
            </button>
          ))}
        </div>
        <Btn variant={s.lessonRead[m.id] ? "ghost" : "primary"} onClick={() => actions.markLesson(m.id)}>
          <CheckCircle2 className="h-4 w-4" /> {s.lessonRead[m.id] ? "Konu okundu ✔" : "Konuyu okudum, tamamlandı say"}
        </Btn>
      </Card>

      <div className="overflow-hidden rounded-xl border border-yellow-400/30 bg-yellow-400/5">
        <button onClick={() => setInst(!inst)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <GraduationCap className="h-5 w-5 text-yellow-400" />
          <span className="flex-1 font-semibold text-white">Eğitmen Anlatım Notu</span>
          <ChevronDown className={cn("h-5 w-5 text-zinc-400 transition", inst && "rotate-180")} />
        </button>
        {inst && (
          <div className="grid gap-3 border-t border-yellow-400/20 p-4 text-sm text-zinc-200 md:grid-cols-2">
            <div>
              <b className="text-yellow-300">Derse nasıl başlanır?</b>
              <p className="mt-1">{m.instructor.start}</p>
            </div>
            <div>
              <b className="text-yellow-300">Hangi örnek verilmeli?</b>
              <p className="mt-1">{m.instructor.example}</p>
            </div>
            <div>
              <b className="text-yellow-300">Vurgulanacak noktalar</b>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {m.instructor.emphasize.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <b className="text-red-300">Öğrencinin karıştırabileceği noktalar</b>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {m.instructor.confusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <b className="text-emerald-300">Konu nasıl özetlenmeli?</b>
              <p className="mt-1 italic">{m.instructor.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tasks({ m, go }: { m: ModuleDef; go: (h: string) => void }) {
  const s = useStore();
  const [res, setRes] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [hint, setHint] = useState<Set<string>>(new Set());
  const ctx = () => ({ lab: s.labs[m.id] ?? m.lab?.initial(), events: s.events[m.id] || [] });
  const run = (id: string) => {
    const t = m.tasks.find((x) => x.id === id)!;
    const r = t.check(ctx());
    setRes((o) => ({ ...o, [id]: r }));
    actions.setTask(m.id, id, r.ok);
  };
  const done = m.tasks.filter((t) => s.tasks[`${m.id}:${t.id}`]).length;
  return (
    <div className="space-y-4">
      <Callout icon="🎯" title={`Görevlerin: ${done} / ${m.tasks.length} tamamlandı`} tone={done === m.tasks.length ? "green" : "yellow"}>
        Önce Sanal Laboratuvar sekmesinde görevi uygula, sonra buradan “Kontrol et”e bas. Sistem sana sadece doğru/yanlış değil, nedenini de söyler.
      </Callout>
      {m.tasks.map((t, i) => {
        const r = res[t.id];
        const isDone = !!s.tasks[`${m.id}:${t.id}`];
        return (
          <Card key={t.id} className={cn(isDone && "border-emerald-500/30")}>
            <div className="flex flex-wrap items-start gap-3">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", isDone ? "bg-emerald-400 text-black" : "bg-yellow-400 text-black")}>{isDone ? "✓" : i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white">
                  Görev {i + 1}: {t.title}
                </div>
                <p className="mt-1 text-sm text-zinc-300">{t.desc}</p>
                {hint.has(t.id) && <p className="mt-2 rounded-lg bg-sky-400/10 p-2 text-sm text-sky-200">💡 {t.hint}</p>}
                {r && (
                  <div className={cn("mt-3 flex gap-2 rounded-lg border p-3 text-sm", r.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200")}>
                    {r.ok ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                    <span>
                      <b>{r.ok ? "Doğru! " : "Henüz değil. "}</b>
                      {r.msg}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={() => setHint((h) => new Set(h).add(t.id))}>
                  İpucu
                </Btn>
                <Btn onClick={() => run(t.id)}>Kontrol et</Btn>
              </div>
            </div>
          </Card>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Btn variant="ghost" onClick={() => m.tasks.forEach((t) => run(t.id))}>
          Tümünü kontrol et
        </Btn>
        <Btn variant="ghost" onClick={() => go(`/module/${m.id}/lab`)}>
          Laboratuvara dön
        </Btn>
        {done === m.tasks.length && (
          <Btn onClick={() => go(`/module/${m.id}/sinav`)}>
            Mini sınava geç <ArrowRight className="h-4 w-4" />
          </Btn>
        )}
      </div>
    </div>
  );
}

function Quiz({ m }: { m: ModuleDef }) {
  const s = useStore();
  const [ans, setAns] = useState<(number | null)[]>(m.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = m.quiz.reduce((a, q, i) => a + (ans[i] === q.answer ? 1 : 0), 0);
  const kindLabel = { mc: "Çoktan seçmeli", tf: "Doğru / Yanlış", scenario: "Senaryo" };
  const prev = s.quiz[m.id];
  return (
    <div className="space-y-4">
      <Callout icon="📝" title="5 soruluk mini sınav">
        Çoktan seçmeli, doğru/yanlış ve senaryo soruları var. Bitirince her sorunun neden doğru ya da yanlış olduğunu açıklayacağım. En az 3 doğru, modülü geçmek için yeterli. {prev && <b className="text-yellow-300">En iyi sonucun: {prev.score}/{prev.total}</b>}
      </Callout>
      {m.quiz.map((q, i) => (
        <Card key={i}>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="gray">Soru {i + 1}</Badge>
            <Badge>{kindLabel[q.kind]}</Badge>
          </div>
          <div className="mb-3 font-medium text-white">{q.q}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, j) => {
              const picked = ans[i] === j;
              const correct = checked && j === q.answer;
              const wrong = checked && picked && j !== q.answer;
              return (
                <button
                  key={j}
                  disabled={checked}
                  onClick={() => setAns((a) => a.map((v, k) => (k === i ? j : v)))}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                    correct ? "border-emerald-400 bg-emerald-400/15 text-emerald-100" : wrong ? "border-red-400 bg-red-400/15 text-red-100" : picked ? "border-yellow-400 bg-yellow-400/10 text-white" : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10"
                  )}
                >
                  <span className="mr-2 font-mono text-xs text-zinc-400">{q.kind === "tf" ? "" : String.fromCharCode(65 + j) + ")"}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {checked && (
            <div className={cn("mt-3 rounded-lg p-3 text-sm", ans[i] === q.answer ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200")}>
              <b>{ans[i] === q.answer ? "✔ Doğru. " : ans[i] === null ? "✘ Boş bıraktın. " : `✘ Yanlış. Doğru cevap: ${q.options[q.answer]}. `}</b>
              {q.explain}
            </div>
          )}
        </Card>
      ))}
      {!checked ? (
        <Btn
          disabled={ans.some((a) => a === null)}
          onClick={() => {
            setChecked(true);
            actions.setQuiz(m.id, score, m.quiz.length);
          }}
        >
          Cevapları kontrol et {ans.some((a) => a === null) && `(${ans.filter((a) => a === null).length} soru boş)`}
        </Btn>
      ) : (
        <Card className={cn("flex flex-wrap items-center justify-between gap-3", score >= 3 ? "border-emerald-500/40" : "border-red-500/40")}>
          <div>
            <div className="text-xl font-bold text-white">
              Sonuç: {score} / {m.quiz.length}
            </div>
            <div className="text-sm text-zinc-300">{score === m.quiz.length ? "Mükemmel! Konuyu çok iyi anlamışsın." : score >= 3 ? "Geçtin! Yanlışların açıklamalarını okuyup tekrar edebilirsin." : "Henüz yeterli değil. Konu anlatımını ve laboratuvarı tekrar edip yeniden dene."}</div>
          </div>
          <Btn
            variant="ghost"
            onClick={() => {
              setAns(m.quiz.map(() => null));
              setChecked(false);
            }}
          >
            Tekrar dene
          </Btn>
        </Card>
      )}
    </div>
  );
}
