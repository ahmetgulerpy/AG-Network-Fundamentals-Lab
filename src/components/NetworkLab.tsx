import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Server, Network, Router, Cable, Wifi, Shield, Globe, MousePointer2, Trash2, RotateCcw, Sparkles, Send, Activity, Power, Scissors } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "../utils/cn";
import { Btn, Badge, Callout } from "./ui";
import type { LabConfig } from "../data/types";
import {
  addDevice,
  findConflicts,
  hasIp,
  isHost,
  isValidIp,
  isValidMask,
  networkOf,
  renewDhcp,
  simulateSend,
  TYPE_LABEL,
  isPrivateIp,
  type DType,
  type Device,
  type LabState,
  type SendResult,
} from "../lib/net";
import { actions, getStore } from "../lib/store";

const ICONS: Record<DType, ComponentType<{ className?: string }>> = {
  pc: Monitor,
  server: Server,
  switch: Network,
  router: Router,
  modem: Cable,
  ap: Wifi,
  firewall: Shield,
  internet: Globe,
};
const COLORS: Record<DType, string> = {
  pc: "text-sky-300 border-sky-400/40",
  server: "text-violet-300 border-violet-400/40",
  switch: "text-emerald-300 border-emerald-400/40",
  router: "text-yellow-300 border-yellow-400/50",
  modem: "text-orange-300 border-orange-400/40",
  ap: "text-pink-300 border-pink-400/40",
  firewall: "text-red-300 border-red-400/40",
  internet: "text-cyan-300 border-cyan-400/40",
};
const W = 960;
const H = 480;

type Tool = "move" | "cable" | "delete";
interface LogEntry {
  id: number;
  ok: boolean;
  title: string;
  lines: string[];
}

export function NetworkLab({ moduleId, config }: { moduleId: string; config: LabConfig }) {
  const [lab, setLab] = useState<LabState>(() => getStore().labs[moduleId] ?? config.initial());
  const [tool, setTool] = useState<Tool>("move");
  const [sel, setSel] = useState<{ kind: "device" | "link"; id: string } | null>(null);
  const [cableFrom, setCableFrom] = useState<string | null>(null);
  const [src, setSrc] = useState("");
  const [dst, setDst] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [dot, setDot] = useState<{ x: number; y: number; back: boolean } | null>(null);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const latest = useRef(lab);
  latest.current = lab;
  const logId = useRef(1);

  // kalıcı kayıt (gecikmeli)
  useEffect(() => {
    const t = setTimeout(() => actions.saveLab(moduleId, lab), 250);
    return () => clearTimeout(t);
  }, [lab, moduleId]);
  useEffect(() => () => actions.saveLab(moduleId, latest.current), [moduleId]);

  const conflicts = useMemo(() => findConflicts(lab), [lab]);
  useEffect(() => {
    if (conflicts.size) actions.addEvents(moduleId, ["conflict_seen"]);
  }, [conflicts, moduleId]);

  const byId = useMemo(() => new Map(lab.devices.map((d) => [d.id, d])), [lab.devices]);
  const endpoints = lab.devices.filter((d) => hasIp(d.type));
  useEffect(() => {
    if (src && !byId.has(src)) setSrc("");
    if (dst && !byId.has(dst)) setDst("");
  }, [byId, src, dst]);

  const upd = (id: string, patch: Partial<Device>) =>
    setLab((l) => ({ ...l, devices: l.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));

  const pushLog = (r: { ok: boolean; title: string; lines: string[] }) =>
    setLog((l) => [{ id: logId.current++, ...r }, ...l].slice(0, 8));

  const doAdd = (type: DType, x?: number, y?: number) => {
    const n = lab.devices.length;
    const px = x ?? 100 + (n % 7) * 125;
    const py = y ?? 90 + (Math.floor(n / 7) % 3) * 140 + (n % 2) * 30;
    const { state, id } = addDevice(lab, type, Math.max(50, Math.min(W - 50, px)), Math.max(50, Math.min(H - 50, py)), config.blank);
    setLab(state);
    setSel({ kind: "device", id });
    actions.addEvents(moduleId, ["added_" + type]);
  };

  const removeDevice = (id: string) => {
    setLab((l) => ({ ...l, devices: l.devices.filter((d) => d.id !== id), links: l.links.filter((k) => k.a !== id && k.b !== id) }));
    setSel(null);
    setCableFrom(null);
  };

  const connect = (a: string, b: string) => {
    if (a === b) return;
    if (lab.links.some((k) => (k.a === a && k.b === b) || (k.a === b && k.b === a))) {
      setMsg("Bu iki cihaz zaten kabloyla bağlı.");
      return;
    }
    setLab((l) => ({ ...l, links: [...l.links, { id: `l${l.seq}`, a, b, up: true }], seq: l.seq + 1 }));
    setMsg(`${byId.get(a)?.name} ↔ ${byId.get(b)?.name} bağlandı.`);
    actions.addEvents(moduleId, ["link_added"]);
  };

  const onDevDown = (e: React.PointerEvent, d: Device) => {
    e.stopPropagation();
    if (tool === "delete") return removeDevice(d.id);
    if (tool === "cable") {
      if (!cableFrom) {
        setCableFrom(d.id);
        setSel({ kind: "device", id: d.id });
        setMsg(`${d.name} seçildi. Şimdi bağlanacak ikinci cihaza tıkla.`);
      } else {
        connect(cableFrom, d.id);
        setCableFrom(null);
      }
      return;
    }
    setSel({ kind: "device", id: d.id });
    const rect = canvasRef.current!.getBoundingClientRect();
    dragRef.current = { id: d.id, dx: e.clientX - rect.left - d.x, dy: e.clientY - rect.top - d.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDevMove = (e: React.PointerEvent) => {
    const dr = dragRef.current;
    if (!dr || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(45, Math.min(W - 45, e.clientX - rect.left - dr.dx));
    const y = Math.max(45, Math.min(H - 45, e.clientY - rect.top - dr.dy));
    upd(dr.id, { x, y });
  };
  const onDevUp = () => {
    dragRef.current = null;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const t = e.dataTransfer.getData("text/device") as DType;
    if (!t || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    doAdd(t, e.clientX - rect.left, e.clientY - rect.top);
  };

  // ---- paket gönderme + animasyon ----
  const send = (kind: "ping" | "data") => {
    if (!src || !dst) {
      pushLog({ ok: false, title: "Cihaz seçilmedi", lines: ["Aşağıdan bir kaynak ve bir hedef cihaz seç."] });
      return;
    }
    const r: SendResult = simulateSend(lab, src, dst, kind);
    actions.addEvents(moduleId, r.events);
    pushLog({ ok: r.ok, title: (r.ok ? "✔ " : "✘ ") + r.title, lines: r.lines });
    // animasyon yolu
    let ids = r.path;
    if (!r.ok && r.failAt && ids.length > 1 && ids[ids.length - 1] !== r.failAt) ids = ids.slice(0, ids.indexOf(r.failAt) + 1);
    const full = r.ok ? [...ids, ...[...ids].reverse().slice(1)] : ids;
    const pts = full.map((id) => ({ id, x: byId.get(id)!.x, y: byId.get(id)!.y }));
    const half = r.ok ? ids.length - 1 : pts.length;
    setBusy(true);
    const segs: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push(l);
      total += l;
    }
    const start = performance.now();
    const speed = 0.28;
    let raf = 0;
    const finish = () => {
      setDot(null);
      setActiveIds([]);
      setBusy(false);
      if (!r.ok && r.failAt) {
        setFlash(r.failAt);
        setTimeout(() => setFlash(null), 1800);
      }
    };
    const tick = (now: number) => {
      const d = (now - start) * speed;
      if (d >= total) return finish();
      let acc = 0;
      let i = 0;
      while (i < segs.length && acc + segs[i] < d) {
        acc += segs[i];
        i++;
      }
      const t = segs[i] ? (d - acc) / segs[i] : 0;
      const a = pts[i];
      const b = pts[i + 1] ?? a;
      setDot({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, back: i >= half });
      setActiveIds(pts.slice(0, i + 1).map((p) => p.id));
      raf = requestAnimationFrame(tick);
    };
    if (total === 0) finish();
    else raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  };

  // ---- DHCP ----
  const runDhcp = (state: LabState) => {
    const r = renewDhcp(state);
    setLab(r.state);
    if (r.messages.length) {
      pushLog({
        ok: r.assigned > 0,
        title: "DHCP işlemi",
        lines: [...r.messages, r.assigned ? "DHCP sunucusu adresleri havuzdan otomatik dağıttı." : ""].filter(Boolean),
      });
    }
    const ev: string[] = [];
    if (r.assigned) ev.push("dhcp_assigned");
    if (r.messages.some((m) => m.includes("APIPA"))) ev.push("dhcp_apipa");
    if (ev.length) actions.addEvents(moduleId, ev);
  };

  const selDev = sel?.kind === "device" ? byId.get(sel.id) : undefined;
  const selLink = sel?.kind === "link" ? lab.links.find((l) => l.id === sel.id) : undefined;

  const reset = () => {
    setLab(config.initial());
    actions.clearEvents(moduleId);
    setLog([]);
    setSel(null);
    setCableFrom(null);
    setMsg("Laboratuvar başlangıç durumuna döndü.");
  };

  const ipClass = (v: string, kind: "ip" | "mask" = "ip") =>
    cn(
      "w-full rounded-md border bg-black/40 px-2 py-1.5 font-mono text-sm outline-none focus:border-yellow-400 disabled:opacity-50",
      v === "" ? "border-white/15" : (kind === "ip" ? isValidIp(v) : isValidMask(v)) ? "border-emerald-500/40" : "border-red-500/60"
    );

  return (
    <div className="space-y-4">
      {/* Cihaz paleti */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
        <div className="mb-2 text-xs font-medium text-zinc-400">Cihaz ekle: tıkla ya da çalışma alanına sürükleyip bırak</div>
        <div className="flex flex-wrap gap-2">
          {config.palette.map((t) => {
            const Icon = ICONS[t as DType];
            return (
              <button
                key={t}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/device", t)}
                onClick={() => doAdd(t as DType)}
                className={cn("flex cursor-grab items-center gap-2 rounded-lg border bg-black/40 px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/10 active:cursor-grabbing", COLORS[t as DType])}
              >
                <Icon className="h-4 w-4" />
                <span className="text-zinc-100">{TYPE_LABEL[t as DType]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["move", "Seç / Taşı", MousePointer2],
            ["cable", "Kablo çek", Cable],
            ["delete", "Sil", Trash2],
          ] as [Tool, string, ComponentType<{ className?: string }>][]
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => {
              setTool(k);
              setCableFrom(null);
              setMsg(k === "cable" ? "Kablo modu: önce bir cihaza, sonra bağlanacak cihaza tıkla." : k === "delete" ? "Silme modu: silmek istediğin cihaza veya kabloya tıkla." : "");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
              tool === k ? "border-yellow-400 bg-yellow-400 text-black" : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {config.sample && (
            <Btn
              variant="ghost"
              onClick={() => {
                setLab(config.sample!());
                setSel(null);
                setMsg("Örnek ağ yüklendi. Cihazlara tıklayarak inceleyebilirsin.");
              }}
            >
              <Sparkles className="h-4 w-4" /> Örnek ağı yükle
            </Btn>
          )}
          <Btn variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Sıfırla
          </Btn>
        </div>
      </div>
      <div className="min-h-5 text-sm text-yellow-300">{msg || config.hint}</div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {/* Çalışma alanı */}
          <div className="overflow-auto rounded-xl border border-white/10 bg-black">
            <div
              ref={canvasRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onPointerDown={() => {
                setSel(null);
                if (tool === "cable") setCableFrom(null);
              }}
              className="relative select-none"
              style={{
                width: W,
                height: H,
                backgroundImage: "radial-gradient(rgba(250,204,21,0.18) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              <svg width={W} height={H} className="pointer-events-none absolute inset-0">
                {lab.links.map((l) => {
                  const a = byId.get(l.a);
                  const b = byId.get(l.b);
                  if (!a || !b) return null;
                  const active = activeIds.includes(l.a) && activeIds.includes(l.b);
                  const selected = sel?.kind === "link" && sel.id === l.id;
                  return (
                    <g key={l.id}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={!l.up ? "#ef4444" : selected ? "#fde047" : active ? "#facc15" : "#52525b"}
                        strokeWidth={active || selected ? 3.5 : 2.5}
                        strokeDasharray={l.up ? undefined : "6 6"}
                      />
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="transparent"
                        strokeWidth={16}
                        className="pointer-events-auto cursor-pointer"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (tool === "delete") {
                            setLab((s) => ({ ...s, links: s.links.filter((k) => k.id !== l.id) }));
                          } else setSel({ kind: "link", id: l.id });
                        }}
                      />
                      {!l.up && (
                        <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle" fill="#f87171" fontSize="12">
                          ✂ kablo kopuk
                        </text>
                      )}
                    </g>
                  );
                })}
                {dot && (
                  <g>
                    <circle cx={dot.x} cy={dot.y} r={13} fill={dot.back ? "rgba(52,211,153,0.25)" : "rgba(250,204,21,0.3)"} />
                    <circle cx={dot.x} cy={dot.y} r={7} fill={dot.back ? "#34d399" : "#facc15"} />
                  </g>
                )}
              </svg>

              {lab.devices.map((d) => {
                const Icon = ICONS[d.type];
                const isSel = sel?.kind === "device" && sel.id === d.id;
                const conflict = conflicts.has(d.id);
                return (
                  <div
                    key={d.id}
                    onPointerDown={(e) => onDevDown(e, d)}
                    onPointerMove={onDevMove}
                    onPointerUp={onDevUp}
                    className={cn("absolute z-10 w-24 -translate-x-1/2 -translate-y-1/2 touch-none text-center", tool === "move" ? "cursor-grab" : "cursor-pointer", !d.on && "opacity-45")}
                    style={{ left: d.x, top: d.y }}
                  >
                    <div
                      className={cn(
                        "mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-zinc-950 transition",
                        COLORS[d.type],
                        isSel && "ring-2 ring-yellow-400",
                        cableFrom === d.id && "ring-2 ring-emerald-400",
                        activeIds.includes(d.id) && "bg-yellow-400/20 shadow-[0_0_18px_rgba(250,204,21,0.6)]",
                        (conflict || flash === d.id) && "border-red-500 ring-2 ring-red-500",
                        d.type === "firewall" && d.block && "bg-red-950"
                      )}
                    >
                      <Icon className="h-7 w-7" />
                      {!d.on && <Power className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-black text-red-400" />}
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold text-white">{d.name}</div>
                    {hasIp(d.type) && d.ip && <div className="font-mono text-[10px] text-yellow-300">{d.ip}</div>}
                    {conflict && <div className="text-[10px] font-bold text-red-400">⚠ IP çakışması</div>}
                    {d.type === "firewall" && <div className={cn("text-[10px]", d.block ? "text-red-400" : "text-emerald-400")}>{d.block ? "engelliyor" : "izin veriyor"}</div>}
                  </div>
                );
              })}
              {lab.devices.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-zinc-500">
                  Çalışma alanı boş.
                  <br />
                  Yukarıdan bir cihaz sürükle ya da "Örnek ağı yükle" butonunu kullan.
                </div>
              )}
            </div>
          </div>

          {/* Paket gönderme */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Send className="h-4 w-4 text-yellow-400" /> Paket gönder
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {[
                ["Kaynak", src, setSrc],
                ["Hedef", dst, setDst],
              ].map(([label, val, setter]) => (
                <label key={label as string} className="text-xs text-zinc-400">
                  {label as string}
                  <select
                    value={val as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    className="mt-1 block w-44 rounded-md border border-white/15 bg-black px-2 py-2 text-sm text-white outline-none focus:border-yellow-400"
                  >
                    <option value="">Seç…</option>
                    {endpoints.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.ip ? `(${d.ip})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <Btn disabled={busy} onClick={() => void send("ping")}>
                <Activity className="h-4 w-4" /> Ping gönder
              </Btn>
              <Btn disabled={busy} variant="ghost" onClick={() => void send("data")}>
                <Send className="h-4 w-4" /> Veri gönder
              </Btn>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Sarı nokta giden paketi, yeşil nokta dönen cevabı gösterir. Hata olursa paket durduğu cihazı kırmızı yanar.</p>
          </div>

          {/* Günlük */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-2 text-sm font-semibold text-white">Olay günlüğü ve açıklamalar</div>
            {log.length === 0 && <p className="text-sm text-zinc-500">Henüz bir işlem yok. Bir ping ya da veri gönder, ne olduğunu burada okuyacaksın.</p>}
            <div className="max-h-72 space-y-2 overflow-auto">
              {log.map((e, i) => (
                <div key={e.id} className={cn("rounded-lg border p-3 text-sm", e.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5", i > 0 && "opacity-70")}>
                  <div className={cn("font-semibold", e.ok ? "text-emerald-300" : "text-red-300")}>{e.title}</div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-300">
                    {e.lines.map((l, j) => (
                      <li key={j}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Denetçi */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-3 text-sm font-semibold text-white">Cihaz ayarları</div>
            {!selDev && !selLink && <p className="text-sm text-zinc-500">Ayarlarını görmek için çalışma alanında bir cihaza veya kabloya tıkla.</p>}
            {selLink && (
              <div className="space-y-3 text-sm">
                <div className="text-zinc-300">
                  Kablo: <b>{byId.get(selLink.a)?.name}</b> ↔ <b>{byId.get(selLink.b)?.name}</b>
                </div>
                <Badge tone={selLink.up ? "green" : "red"}>{selLink.up ? "Bağlı" : "Kopuk"}</Badge>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => setLab((l) => ({ ...l, links: l.links.map((k) => (k.id === selLink.id ? { ...k, up: !k.up } : k)) }))}>
                    <Scissors className="h-4 w-4" /> {selLink.up ? "Kabloyu çıkar" : "Kabloyu tak"}
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      setLab((l) => ({ ...l, links: l.links.filter((k) => k.id !== selLink.id) }));
                      setSel(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Sil
                  </Btn>
                </div>
              </div>
            )}
            {selDev && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge tone="gray">{TYPE_LABEL[selDev.type]}</Badge>
                  <button
                    onClick={() => upd(selDev.id, { on: !selDev.on })}
                    className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", selDev.on ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300")}
                  >
                    <Power className="h-3.5 w-3.5" /> {selDev.on ? "Açık" : "Kapalı"}
                  </button>
                </div>
                <label className="block text-xs text-zinc-400">
                  Ad
                  <input value={selDev.name} onChange={(e) => upd(selDev.id, { name: e.target.value })} className="mt-1 w-full rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-yellow-400" />
                </label>

                {isHost(selDev.type) && (
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/40 p-1 text-xs">
                    {[
                      ["Statik IP", false],
                      ["DHCP (otomatik)", true],
                    ].map(([l, v]) => (
                      <button
                        key={l as string}
                        onClick={() => {
                          const next = { ...lab, devices: lab.devices.map((d) => (d.id === selDev.id ? { ...d, dhcpMode: v as boolean, lease: (v ? d.lease : "static") as Device["lease"] } : d)) };
                          if (v) runDhcp(next);
                          else setLab(next);
                        }}
                        className={cn("rounded-md px-2 py-1.5 font-semibold", !!selDev.dhcpMode === v ? "bg-yellow-400 text-black" : "text-zinc-300 hover:bg-white/10")}
                      >
                        {l as string}
                      </button>
                    ))}
                  </div>
                )}
                {hasIp(selDev.type) && selDev.type !== "internet" && (
                  <>
                    <label className="block text-xs text-zinc-400">
                      {selDev.type === "router" ? "Router IP (LAN – Gateway adresi)" : "IP adresi"}
                      <input
                        disabled={!!selDev.dhcpMode}
                        value={selDev.ip}
                        placeholder="192.168.1.10"
                        onChange={(e) => upd(selDev.id, { ip: e.target.value.trim(), lease: "static" })}
                        className={cn("mt-1", ipClass(selDev.ip))}
                      />
                    </label>
                    <label className="block text-xs text-zinc-400">
                      Subnet Mask
                      <input disabled={!!selDev.dhcpMode} value={selDev.mask} placeholder="255.255.255.0" onChange={(e) => upd(selDev.id, { mask: e.target.value.trim() })} className={cn("mt-1", ipClass(selDev.mask, "mask"))} />
                    </label>
                    {isHost(selDev.type) && (
                      <label className="block text-xs text-zinc-400">
                        Default Gateway
                        <input disabled={!!selDev.dhcpMode} value={selDev.gw} placeholder="192.168.1.1" onChange={(e) => upd(selDev.id, { gw: e.target.value.trim() })} className={cn("mt-1", ipClass(selDev.gw))} />
                      </label>
                    )}
                    {selDev.type === "router" && (
                      <>
                        <label className="block text-xs text-zinc-400">
                          İkinci arayüz IP (isteğe bağlı)
                          <input value={selDev.ip2 ?? ""} placeholder="192.168.2.1" onChange={(e) => upd(selDev.id, { ip2: e.target.value.trim() })} className={cn("mt-1", ipClass(selDev.ip2 ?? ""))} />
                        </label>
                        <button
                          onClick={() => {
                            const next = { ...lab, devices: lab.devices.map((d) => (d.id === selDev.id ? { ...d, dhcpServer: !d.dhcpServer } : d)) };
                            if (!selDev.dhcpServer) runDhcp(next);
                            else setLab(next);
                          }}
                          className={cn("w-full rounded-lg border px-3 py-2 text-sm font-semibold", selDev.dhcpServer ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/15 bg-white/5 text-zinc-300")}
                        >
                          DHCP sunucusu: {selDev.dhcpServer ? "AÇIK" : "KAPALI"}
                        </button>
                      </>
                    )}
                    {isHost(selDev.type) && selDev.dhcpMode && (
                      <Btn variant="ghost" className="w-full" onClick={() => runDhcp(lab)}>
                        DHCP'den IP al / yenile
                      </Btn>
                    )}
                    {isValidIp(selDev.ip) && isValidMask(selDev.mask) && (
                      <div className="rounded-lg bg-black/40 p-2.5 text-xs text-zinc-400">
                        Ağ adresi: <span className="font-mono text-yellow-300">{networkOf(selDev.ip, selDev.mask)}</span>
                        <br />
                        Adres türü: <span className="text-zinc-200">{selDev.ip.startsWith("169.254") ? "APIPA (DHCP bulunamadı)" : isPrivateIp(selDev.ip) ? "Özel (private) IP" : "Genel (public) IP"}</span>
                        {selDev.lease && selDev.lease !== "static" && (
                          <>
                            <br />
                            Kaynak: <span className="text-zinc-200">{selDev.lease === "dhcp" ? "DHCP ile otomatik" : "APIPA"}</span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
                {selDev.type === "internet" && (
                  <div className="rounded-lg bg-black/40 p-2.5 text-xs text-zinc-400">
                    Genel IP: <span className="font-mono text-yellow-300">{selDev.ip}</span>
                    <br />
                    İnterneti temsil eden uzak sunucu.
                  </div>
                )}
                {selDev.type === "firewall" && (
                  <button
                    onClick={() => upd(selDev.id, { block: !selDev.block })}
                    className={cn("w-full rounded-lg border px-3 py-2 text-sm font-semibold", selDev.block ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300")}
                  >
                    Kural: {selDev.block ? "Tüm trafiği ENGELLE" : "Trafiğe İZİN VER"}
                  </button>
                )}
                {selDev.type !== "internet" && (
                  <div className="text-xs text-zinc-400">
                    MAC adresi: <span className="font-mono text-zinc-100">{selDev.mac}</span>
                    <div className="mt-0.5 text-zinc-500">Cihazın kartına fabrikada yazılan benzersiz kimlik.</div>
                  </div>
                )}
                {selDev.type === "switch" && <p className="text-xs text-zinc-500">Switch, bağlı cihazlar arasında paketi doğru porta yönlendirir. IP adresine ihtiyaç duymaz.</p>}
                {selDev.type === "modem" && <p className="text-xs text-zinc-500">Modem, evini internet sağlayıcıya bağlar. Router ile İnternet arasında durur.</p>}
                {selDev.type === "ap" && <p className="text-xs text-zinc-500">Access Point, kablolu ağı kablosuz (Wi‑Fi) hâle getirir.</p>}
                <Btn variant="danger" className="w-full" onClick={() => removeDevice(selDev.id)}>
                  <Trash2 className="h-4 w-4" /> Cihazı sil
                </Btn>
              </div>
            )}
          </div>
          {conflicts.size > 0 && (
            <Callout icon="⚠" title="IP çakışması var!" tone="red">
              Kırmızı çerçeveli cihazlar aynı IP adresini kullanıyor. Birinin IP adresini değiştir.
            </Callout>
          )}
        </div>
      </div>

      {/* Adres tablosu */}
      {lab.devices.some((d) => hasIp(d.type)) && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/60">
          <div className="border-b border-white/10 px-4 py-2.5 text-sm font-semibold text-white">Ağ topolojisi – adres tablosu</div>
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-zinc-400">
              <tr>
                {["Cihaz", "Tür", "IP adresi", "Subnet Mask", "Ağ adresi", "Gateway", "MAC adresi", "Durum"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {lab.devices
                .filter((d) => hasIp(d.type))
                .map((d) => (
                  <tr key={d.id} onClick={() => setSel({ kind: "device", id: d.id })} className="cursor-pointer border-t border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 font-sans font-semibold text-white">{d.name}</td>
                    <td className="px-3 py-2 font-sans text-zinc-400">{TYPE_LABEL[d.type]}</td>
                    <td className="px-3 py-2 text-yellow-300">{d.ip || "—"}</td>
                    <td className="px-3 py-2 text-zinc-300">{d.mask || "—"}</td>
                    <td className="px-3 py-2 text-zinc-300">{isValidIp(d.ip) && isValidMask(d.mask) ? networkOf(d.ip, d.mask) : "—"}</td>
                    <td className="px-3 py-2 text-zinc-300">{d.gw || "—"}</td>
                    <td className="px-3 py-2 text-zinc-300">{d.type === "internet" ? "—" : d.mac}</td>
                    <td className="px-3 py-2 font-sans">{conflicts.has(d.id) ? <Badge tone="red">IP çakışması</Badge> : d.on ? <Badge tone="green">Açık</Badge> : <Badge tone="red">Kapalı</Badge>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export type { LabState };
