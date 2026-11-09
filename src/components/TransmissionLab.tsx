import { useEffect, useMemo, useRef, useState } from "react";
import { Btn, Card, Badge } from "./ui";
import { OSI_LAYERS } from "../data/osi";
import { actions } from "../lib/store";
import { cn } from "../utils/cn";

const NODES = [
  { x: 70, label: "PC1", sub: "192.168.1.10", emoji: "💻", note: "Gönderen" },
  { x: 270, label: "Switch", sub: "MAC'e bakar", emoji: "🔀", note: "" },
  { x: 470, label: "Router", sub: "IP'ye bakar", emoji: "📡", note: "" },
  { x: 670, label: "PC2", sub: "192.168.2.20", emoji: "🖥️", note: "Alıcı" },
];
const Y = 110;
const LEN = 600;

function PacketLab({ moduleId }: { moduleId: string }) {
  const [msg, setMsg] = useState("Merhaba AG CYBER LAB! Bu mesaj paketlere ayrilarak gonderilecek.");
  const [size, setSize] = useState(10);
  const [shuffle, setShuffle] = useState(false);
  const [run, setRun] = useState<{ id: number; chunks: string[]; speeds: number[] } | null>(null);
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef(0);
  const counter = useRef(0);

  const departs = (i: number) => i * 420;
  const arrivals = useMemo(() => (run ? run.chunks.map((_, i) => departs(i) + LEN / run.speeds[i]) : []), [run]);

  const send = () => {
    const text = msg.trim() || "Merhaba";
    const chunks = text.match(new RegExp(`.{1,${size}}`, "g")) ?? [text];
    const speeds = chunks.map(() => (shuffle ? 0.2 + Math.random() * 0.45 : 0.4));
    counter.current++;
    setDone(false);
    setT(0);
    setRun({ id: counter.current, chunks, speeds });
    actions.addEvents(moduleId, ["msg_sent", ...(chunks.length > 1 ? ["msg_multi_packets"] : []), ...(shuffle && chunks.length > 2 ? ["shuffled_reassembled"] : [])]);
  };

  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const end = Math.max(...arrivals) + 300;
    const tick = (now: number) => {
      const el = now - start;
      setT(Math.min(el, end));
      if (el < end) raf.current = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [run, arrivals]);

  const arrived = run ? run.chunks.map((c, i) => ({ c, i, at: arrivals[i] })).filter((p) => p.at <= t).sort((a, b) => a.at - b.at) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="text-xs text-zinc-400">
          Göndereceğin mesaj
          <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={120} className="mt-1 block w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-yellow-400" />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-zinc-400">
            Paket boyutu: <b className="text-yellow-300">{size} karakter</b>
            <input type="range" min={3} max={20} value={size} onChange={(e) => setSize(+e.target.value)} className="mt-1 block w-40 accent-yellow-400" />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="accent-yellow-400" /> Paketler karışık ulaşsın
          </label>
          <Btn onClick={send} disabled={!!run && !done}>
            Mesajı gönder
          </Btn>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black">
        <svg viewBox="0 0 740 220" className="mx-auto w-full min-w-[560px]">
          {NODES.slice(1).map((n, i) => (
            <line key={i} x1={NODES[i].x} y1={Y} x2={n.x} y2={Y} stroke="#52525b" strokeWidth={3} />
          ))}
          {NODES.map((n) => (
            <g key={n.label}>
              <rect x={n.x - 38} y={Y - 34} width={76} height={68} rx={12} fill="#18181b" stroke="#facc15" strokeOpacity={0.5} />
              <text x={n.x} y={Y + 2} textAnchor="middle" fontSize="26">
                {n.emoji}
              </text>
              <text x={n.x} y={Y + 24} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                {n.label}
              </text>
              <text x={n.x} y={Y + 52} textAnchor="middle" fill="#a1a1aa" fontSize="9.5">
                {n.sub}
              </text>
            </g>
          ))}
          {run &&
            run.chunks.map((_c, i) => {
              const p = ((t - departs(i)) * run.speeds[i]) / LEN;
              if (p < 0 || p >= 1) return null;
              const x = 70 + p * LEN;
              return (
                <g key={i}>
                  <rect x={x - 17} y={Y - 52 + (i % 2) * 4} width={34} height={20} rx={5} fill="#facc15" />
                  <text x={x} y={Y - 38 + (i % 2) * 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#000">
                    #{i + 1}
                  </text>
                </g>
              );
            })}
          <text x={370} y={205} textAnchor="middle" fill="#a1a1aa" fontSize="11">
            Switch cihaz adresine (MAC), Router ise hedef adrese (IP) bakarak paketi ilerletir.
          </text>
        </svg>
      </div>

      {run && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-white">1) Mesaj {run.chunks.length} pakete ayrıldı</div>
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-xs">
                <thead className="text-zinc-400">
                  <tr>
                    <th className="py-1 text-left">Sıra no</th>
                    <th className="text-left">Veri</th>
                    <th className="text-left">Kaynak → Hedef</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {run.chunks.map((c, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1 text-yellow-300">#{i + 1}</td>
                      <td className="whitespace-pre text-white">"{c}"</td>
                      <td className="text-zinc-400">192.168.1.10 → 192.168.2.20</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Her pakete bir sıra numarası ve adres bilgisi (başlık) eklenir. Böylece paketler karışık gelse bile alıcı doğru sıraya dizebilir.</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-white">2) Alıcıya ulaşan paketler (geliş sırasıyla)</div>
            <div className="flex min-h-10 flex-wrap gap-1.5">
              {arrived.map((p) => (
                <span key={p.i} className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-2 py-1 font-mono text-xs text-yellow-200">
                  #{p.i + 1} "{p.c}"
                </span>
              ))}
              {arrived.length === 0 && <span className="text-xs text-zinc-500">Paketler yolda…</span>}
            </div>
            <div className="mt-3 text-sm font-semibold text-white">3) Sıra numarasına göre birleştirilmiş mesaj</div>
            <div className={cn("mt-1 min-h-10 rounded-lg border p-2 font-mono text-sm", done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 text-zinc-500")}>
              {done ? run.chunks.join("") : "Tüm paketler gelince birleştirilecek…"}
            </div>
            {done && shuffle && <p className="mt-2 text-xs text-emerald-300">Paketler karışık geldi ama sıra numaraları sayesinde mesaj doğru birleşti ✔</p>}
          </Card>
        </div>
      )}
    </div>
  );
}

const sendHeaders = (L: number) => (L >= 5 ? [] : L === 4 ? ["TCP"] : L === 3 ? ["TCP", "IP"] : ["TCP", "IP", "Ethernet"]);
const recvHeaders = (L: number) => (L >= 4 ? [] : L === 3 ? ["TCP"] : L === 2 ? ["TCP", "IP"] : ["TCP", "IP", "Ethernet"]);
const HEADER_INFO: Record<string, string> = {
  TCP: "Port: 51000 → 80 · Sıra no",
  IP: "192.168.1.10 → 192.168.2.20",
  Ethernet: "MAC: AA:.. → BB:..",
};

function OsiWalk({ moduleId }: { moduleId: string }) {
  const [step, setStep] = useState(-1);
  const [auto, setAuto] = useState(false);
  const order = [...OSI_LAYERS.map((l) => l.no), ...[...OSI_LAYERS].reverse().map((l) => l.no)]; // 7..1 , 1..7
  const sending = step >= 0 && step < 7;
  const layerNo = step >= 0 ? order[step] : 0;
  const layer = OSI_LAYERS.find((l) => l.no === layerNo);
  const headers = step < 0 ? [] : sending ? sendHeaders(layerNo) : recvHeaders(layerNo);

  useEffect(() => {
    if (!auto) return;
    if (step >= 13) {
      setAuto(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [auto, step]);
  useEffect(() => {
    if (step === 13) actions.addEvents(moduleId, ["osi_walkthrough"]);
  }, [step, moduleId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Btn
          onClick={() => {
            setStep(0);
            setAuto(true);
          }}
        >
          Mesajı gönder, katmanları izle
        </Btn>
        <Btn variant="ghost" disabled={step >= 13} onClick={() => { setAuto(false); setStep((s) => s + 1); }}>
          Sonraki adım
        </Btn>
        <Btn variant="ghost" disabled={step <= 0} onClick={() => { setAuto(false); setStep((s) => s - 1); }}>
          Önceki adım
        </Btn>
        {step >= 0 && (
          <Badge tone={sending ? "yellow" : "green"}>{sending ? "GÖNDEREN tarafta: yukarıdan aşağı (7 → 1)" : "ALICI tarafta: aşağıdan yukarı (1 → 7)"}</Badge>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1.5">
          {OSI_LAYERS.map((l) => (
            <button
              key={l.no}
              onClick={() => { setAuto(false); setStep(sending || step < 0 ? 7 - l.no : 7 + l.no - 1); }}
              className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition", layerNo === l.no ? "border-yellow-400 bg-yellow-400 text-black" : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10")}
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", layerNo === l.no ? "bg-black text-yellow-300" : "bg-white/10")}>{l.no}</span>
              <span className="font-semibold">{l.name}</span>
              <span className={cn("ml-auto text-xs", layerNo === l.no ? "text-black/70" : "text-zinc-500")}>{l.pdu.split(" ")[0]}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {!layer ? (
            <Card className="text-sm text-zinc-400">Soldan bir katmana tıkla ya da “Mesajı gönder, katmanları izle” butonuna bas. Veri gönderilirken her katmanda ne olduğunu göreceksin.</Card>
          ) : (
            <>
              <Card className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                  Katman {layer.no} · {layer.tr} ({layer.name})
                </div>
                <div className="text-sm text-zinc-300">
                  <b className="text-white">Günlük hayat:</b> {layer.life}
                </div>
                <div className="text-sm text-zinc-300">
                  <b className="text-white">{sending ? "Gönderirken:" : "Alırken:"}</b>{" "}
                  {sending ? layer.tech : `Bu katman, kendi eklediği başlığı okur ve çıkarır, veriyi bir üst katmana verir. (${layer.tech})`}
                </div>
                <div className="text-xs text-zinc-500">Örnek protokoller: {layer.proto} · Veri birimi: {layer.pdu}</div>
              </Card>
              <Card>
                <div className="mb-2 text-xs text-zinc-400">Verinin o anki hâli (zarflar iç içe):</div>
                {layerNo === 1 ? (
                  <div className="break-all rounded-lg border border-yellow-400/40 bg-black p-3 font-mono text-xs text-yellow-300">
                    01001000 01100101 01101100 01101100 01101111 … (kablodan akan 1 ve 0'lar)
                  </div>
                ) : (
                  <div className="space-y-0">
                    {headers.reduce<React.ReactNode>((inner, h) => (
                      <div className={cn("rounded-lg border p-2", h === "Ethernet" ? "border-sky-400/50 bg-sky-400/5" : h === "IP" ? "border-emerald-400/50 bg-emerald-400/5" : "border-orange-400/50 bg-orange-400/5")}>
                        <div className="mb-1 text-[11px] font-semibold text-zinc-200">
                          {h === "Ethernet" ? "Çerçeve (L2)" : h === "IP" ? "Paket (L3)" : "Segment (L4)"} başlığı: <span className="font-mono text-zinc-400">{HEADER_INFO[h]}</span>
                        </div>
                        {inner}
                      </div>
                    ), <div className="rounded-md bg-yellow-400 px-3 py-2 text-center font-mono text-sm font-bold text-black">VERİ: "Merhaba"</div>)}
                  </div>
                )}
                <p className="mt-2 text-xs text-zinc-400">
                  {sending ? "Aşağı indikçe veriye yeni başlıklar eklenir (zarfa zarf sarılır). Buna kapsülleme denir." : "Yukarı çıktıkça başlıklar sırayla açılır. Buna kapsül açma denir."}
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function TransmissionLab({ moduleId }: { moduleId: string }) {
  const [tab, setTab] = useState<"pkt" | "osi">("pkt");
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-black/50 p-1">
        {[
          ["pkt", "1) Mesaj → paketler"],
          ["osi", "2) OSI katmanları"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as "pkt" | "osi")} className={cn("rounded-md px-4 py-2 text-sm font-semibold", tab === k ? "bg-yellow-400 text-black" : "text-zinc-300 hover:bg-white/10")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "pkt" ? <PacketLab moduleId={moduleId} /> : <OsiWalk moduleId={moduleId} />}
    </div>
  );
}
