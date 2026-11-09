import { ArrowRight, CheckCircle2, FlaskConical, HelpCircle, PlayCircle, RotateCcw, Trophy } from "lucide-react";
import { Badge, Btn, Card, ProgressBar } from "./ui";
import { MODULES, moduleProgress } from "../data/modules";
import { actions, useStore } from "../lib/store";
import { cn } from "../utils/cn";

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132">
      <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="#facc15" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 66 66)" style={{ transition: "stroke-dashoffset .6s" }} />
      <text x="66" y="64" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">
        %{Math.round(value * 100)}
      </text>
      <text x="66" y="84" textAnchor="middle" fill="#a1a1aa" fontSize="11">
        tamamlandı
      </text>
    </svg>
  );
}

export function Home({ go }: { go: (h: string) => void }) {
  const s = useStore();
  const prog = MODULES.map((m) => ({ m, p: moduleProgress(m, s) }));
  const total = prog.reduce((a, x) => a + x.p.value, 0) / MODULES.length;
  const completed = prog.filter((x) => x.p.complete).length;
  const next = prog.find((x) => !x.p.complete);
  const started = prog.some((x) => x.p.value > 0);
  const quizzes = prog.filter((x) => x.p.quiz).length;
  const tasksDone = prog.reduce((a, x) => a + x.p.tasksDone, 0);
  const tasksTotal = MODULES.reduce((a, m) => a + m.tasks.length, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="relative overflow-hidden rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl" />
          <Badge>AG CYBER LAB · Eğitim Modülü</Badge>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Network Fundamentals <span className="text-yellow-400">Sanal Laboratuvarı</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">Ağları ezberleme, <b className="text-white">anla</b>. Her konu günlük hayattan bir örnekle başlar; sonra teknik karşılığını öğrenir ve sanal laboratuvarda kendi ağını kurarsın.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {next ? (
              <Btn onClick={() => go(`/module/${next.m.id}/anlatim`)}>
                <PlayCircle className="h-4 w-4" /> {started ? "Derse devam et" : "Eğitime başla"}
              </Btn>
            ) : null}
            <Btn variant="ghost" onClick={() => go("/lab")}>
              <FlaskConical className="h-4 w-4" /> Serbest laboratuvar
            </Btn>
          </div>
        </div>
        <Card className="flex items-center gap-5">
          <Ring value={total} />
          <div className="space-y-2 text-sm">
            <div className="text-zinc-400">
              Tamamlanan modül: <b className="text-white">{completed} / {MODULES.length}</b>
            </div>
            <div className="text-zinc-400">
              Görevler: <b className="text-white">{tasksDone} / {tasksTotal}</b>
            </div>
            <div className="text-zinc-400">
              Çözülen sınav: <b className="text-white">{quizzes} / {MODULES.length}</b>
            </div>
          </div>
        </Card>
      </section>

      {next ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-yellow-400/30 bg-yellow-400/5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Sıradaki ders</div>
            <div className="mt-1 text-xl font-bold text-white">
              Modül {next.m.no}: {next.m.title}
            </div>
            <div className="text-sm text-zinc-300">{next.m.tagline}</div>
          </div>
          <Btn onClick={() => go(`/module/${next.m.id}/anlatim`)}>
            Başla <ArrowRight className="h-4 w-4" />
          </Btn>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 border-emerald-500/40 bg-emerald-500/5 text-emerald-200">
          <Trophy className="h-6 w-6" /> Tebrikler! Tüm modülleri tamamladın. Serbest laboratuvarda kendi ağlarını kurabilirsin.
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">Eğitim modülleri</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {prog.map(({ m, p }) => (
            <div key={m.id} className={cn("flex flex-col rounded-2xl border bg-zinc-900/70 p-4 transition hover:border-yellow-400/50", p.complete ? "border-emerald-500/40" : "border-white/10")}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-lg font-extrabold text-black">{m.no}</span>
                {p.complete ? (
                  <Badge tone="green">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Tamamlandı
                  </Badge>
                ) : p.value > 0 ? (
                  <Badge>Devam ediyor</Badge>
                ) : (
                  <Badge tone="gray">Başlanmadı</Badge>
                )}
              </div>
              <div className="mt-3 font-bold text-white">{m.title}</div>
              <div className="mt-0.5 flex-1 text-sm text-zinc-400">{m.tagline}</div>
              <ProgressBar value={p.value} className="mt-3" />
              <div className="mt-1 text-[11px] text-zinc-500">
                Görev {p.tasksDone}/{m.tasks.length} · Sınav {p.quiz ? `${p.quiz.score}/${p.quiz.total}` : "—"}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
                <button onClick={() => go(`/module/${m.id}/anlatim`)} className="rounded-md bg-yellow-400 px-2 py-1.5 font-semibold text-black hover:bg-yellow-300">
                  Ders
                </button>
                <button onClick={() => go(`/module/${m.id}/lab`)} className="rounded-md border border-white/15 px-2 py-1.5 text-zinc-200 hover:bg-white/10">
                  Lab
                </button>
                <button onClick={() => go(`/module/${m.id}/sinav`)} className="rounded-md border border-white/15 px-2 py-1.5 text-zinc-200 hover:bg-white/10">
                  Sınav
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <FlaskConical className="h-5 w-5 text-yellow-400" /> Laboratuvar erişimi
          </div>
          <p className="mb-3 text-sm text-zinc-400">Her modülün kendine özel laboratuvarı var. Hepsi tarayıcında çalışır; internet veya sunucu gerekmez.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODULES.map((m) => (
              <button key={m.id} onClick={() => go(`/module/${m.id}/lab`)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left text-sm text-zinc-200 hover:border-yellow-400/50">
                <span className="font-bold text-yellow-400">{m.no}</span>
                <span className="truncate">{m.title}</span>
              </button>
            ))}
          </div>
          <Btn className="mt-3" onClick={() => go("/lab")}>
            Serbest laboratuvarı aç
          </Btn>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <HelpCircle className="h-5 w-5 text-yellow-400" /> Mini sınavlar
          </div>
          <div className="space-y-1.5">
            {prog.map(({ m, p }) => (
              <button key={m.id} onClick={() => go(`/module/${m.id}/sinav`)} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 hover:border-yellow-400/50">
                <span>
                  <b className="mr-2 text-yellow-400">{m.no}</b>
                  {m.title}
                </span>
                {p.quiz ? <Badge tone={p.quiz.score >= 3 ? "green" : "red"}>{p.quiz.score}/{p.quiz.total}</Badge> : <Badge tone="gray">Çözülmedi</Badge>}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <div className="flex justify-end">
        <Btn
          variant="ghost"
          onClick={() => {
            if (confirm("Tüm ilerleme, laboratuvar kayıtları ve sınav sonuçların silinecek. Emin misin?")) actions.resetAll();
          }}
        >
          <RotateCcw className="h-4 w-4" /> İlerlemeyi sıfırla
        </Btn>
      </div>
    </div>
  );
}
