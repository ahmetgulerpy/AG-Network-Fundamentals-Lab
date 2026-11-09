import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { ModuleView, type TabKey } from "./components/ModuleView";
import { NetworkLab } from "./components/NetworkLab";
import { MODULES, getModule, moduleProgress } from "./data/modules";
import { labM2 } from "./data/labs";
import type { LabConfig } from "./data/types";
import { useStore } from "./lib/store";
import { cn } from "./utils/cn";

const freeLab: LabConfig = {
  ...labM2,
  palette: ["pc", "server", "switch", "router", "modem", "ap", "firewall", "internet"],
  blank: false,
  hint: "Serbest laboratuvar: istediğin ağı kur. Cihaz ekle, kablo çek, IP ayarla, paket gönder.",
  steps: ["Cihazları sürükleyip bırak.", "Kablo aracıyla bağla.", "IP, Mask, Gateway ayarla; DHCP veya Firewall'u dene.", "Ping gönder ve açıklamaları oku."],
};

const parse = () => (window.location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);

export default function App() {
  const [parts, setParts] = useState(parse());
  const s = useStore();
  useEffect(() => {
    const h = () => {
      setParts(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  const go = (path: string) => {
    window.location.hash = path;
  };

  const route = parts[0];
  const mod = route === "module" ? getModule(parts[1]) : undefined;
  const tab = (["anlatim", "gorsel", "lab", "gorevler", "sinav"].includes(parts[2]) ? parts[2] : "anlatim") as TabKey;

  useEffect(() => {
    document.title = mod ? `${mod.title} – AG CYBER LAB Network Fundamentals` : "AG CYBER LAB – Network Fundamentals Sanal Laboratuvarı";
  }, [mod]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <button onClick={() => go("/")} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-sm font-black text-black">AG</span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-extrabold tracking-wide text-white">AG CYBER LAB</span>
              <span className="block text-[11px] text-zinc-400">Network Fundamentals</span>
            </span>
          </button>
          <nav className="ml-2 flex gap-1 text-sm">
            <button onClick={() => go("/")} className={cn("rounded-lg px-3 py-1.5 font-medium", !route ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white")}>
              Ana sayfa
            </button>
            <button onClick={() => go("/lab")} className={cn("rounded-lg px-3 py-1.5 font-medium", route === "lab" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white")}>
              Serbest lab
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {MODULES.map((m) => {
              const done = moduleProgress(m, s).complete;
              const active = mod?.id === m.id;
              return (
                <button
                  key={m.id}
                  title={`${m.no}. ${m.title}`}
                  onClick={() => go(`/module/${m.id}/anlatim`)}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition", active ? "border-yellow-400 bg-yellow-400 text-black" : done ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-white/15 text-zinc-300 hover:bg-white/10")}
                >
                  {done && !active ? "✓" : m.no}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {!route && <Home go={go} />}
        {mod && <ModuleView key={mod.id} m={mod} tab={tab} go={go} />}
        {route === "lab" && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Laboratuvar</div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Serbest Ağ Laboratuvarı</h1>
              <p className="text-zinc-400">Tüm cihazlarla kendi ağını kur. Çalışman otomatik olarak bu tarayıcıda saklanır.</p>
            </div>
            <NetworkLab moduleId="free" config={freeLab} />
          </div>
        )}
        {route === "module" && !mod && <div className="text-zinc-400">Modül bulunamadı.</div>}
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">AG CYBER LAB · Network Fundamentals · Tüm veriler bu tarayıcıda (localStorage) saklanır.</footer>
    </div>
  );
}
