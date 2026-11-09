import { useState } from "react";
import { Btn, Card } from "./ui";
import { SequenceDiagram, type SeqStep, type Actor } from "./SequenceDiagram";
import { DnsPanel } from "./DhcpDnsLab";
import { actions } from "../lib/store";
import { cn } from "../utils/cn";

interface Service {
  id: string;
  name: string;
  port: number;
  proto: "TCP" | "UDP";
  desc: string;
}
const SERVICES: Service[] = [
  { id: "ftp", name: "FTP", port: 21, proto: "TCP", desc: "Dosya aktarımı" },
  { id: "ssh", name: "SSH", port: 22, proto: "TCP", desc: "Güvenli uzak terminal" },
  { id: "dns", name: "DNS", port: 53, proto: "UDP", desc: "İsimden IP bulma" },
  { id: "http", name: "HTTP", port: 80, proto: "TCP", desc: "Web (şifresiz)" },
  { id: "https", name: "HTTPS", port: 443, proto: "TCP", desc: "Web (şifreli)" },
  { id: "rdp", name: "RDP", port: 3389, proto: "TCP", desc: "Uzak masaüstü" },
];

export function ProtocolLab({ moduleId }: { moduleId: string }) {
  const [mode, setMode] = useState<"app" | "udp" | "dns">("app");
  const [svc, setSvc] = useState("http");
  const [closed, setClosed] = useState<string[]>([]);
  const [run, setRun] = useState<{ id: number; steps: SeqStep[]; actors: Actor[]; done: () => void } | null>(null);
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState("Merhaba AG CYBER LAB");
  const [loss, setLoss] = useState(true);

  const s = SERVICES.find((x) => x.id === svc)!;
  const cport = 49152 + ((n * 7919 + 1234) % 16000);

  const startApp = () => {
    const isClosed = closed.includes(s.id);
    const actors: Actor[] = [
      { id: "c", label: "İstemci (Client)", sub: `10.0.0.5 : ${cport}`, emoji: "💻" },
      { id: "s", label: "Sunucu (Server)", sub: `93.184.216.34 : ${s.port}`, emoji: "🖥️" },
    ];
    const steps: SeqStep[] = [];
    let done = () => {};
    if (s.proto === "UDP") {
      steps.push({ from: "c", to: "s", label: `Sorgu → port ${s.port} (UDP)`, detail: "UDP'de el sıkışma yoktur. İstemci hiç sormadan paketi doğrudan gönderir; hızlıdır ama garanti vermez.", tone: "blue" });
      if (isClosed) {
        steps.push({ from: "s", to: "c", label: "ICMP: Port ulaşılamaz", detail: `Sunucuda ${s.port} numaralı port kapalı (servis çalışmıyor). Sunucu 'burada kimse yok' diye haber verdi.`, tone: "red" });
        done = () => actions.addEvents(moduleId, ["port_closed"]);
      } else {
        steps.push({ from: "s", to: "c", label: "Cevap (UDP)", detail: "Sunucu cevabı yine el sıkışmadan gönderir.", tone: "green" });
        done = () => actions.addEvents(moduleId, ["udp_sent"]);
      }
    } else {
      steps.push({ from: "c", to: "s", label: `SYN → port ${s.port}`, detail: `1/3 El sıkışma: İstemci '${s.port} numaralı kapıya (port) bağlanmak istiyorum' der. (SYN = Senkronize ol)`, tone: "blue" });
      if (isClosed) {
        steps.push({ from: "s", to: "c", label: "RST (Reddedildi)", detail: `Sunucuda ${s.port} numaralı port kapalı: bu servis çalışmıyor ya da firewall kapattı. Bağlantı reddedildi. Aynı numaralı kapıyı açık bırakmak güvenlik için bilinçli karar olmalı.`, tone: "red" });
        done = () => actions.addEvents(moduleId, ["port_closed"]);
      } else {
        steps.push({ from: "s", to: "c", label: "SYN-ACK", detail: "2/3 Sunucu: 'Seni duydum, ben de hazırım' der. (SYN + ACK = Onay)", tone: "yellow" });
        steps.push({ from: "c", to: "s", label: "ACK", detail: "3/3 İstemci: 'Tamam, başlayalım.' Artık TCP bağlantısı kuruldu (3'lü el sıkışma / 3-way handshake).", tone: "green" });
        if (s.id === "https") {
          steps.push({ from: "c", to: "s", label: "TLS ClientHello", detail: "HTTPS'te TCP bağlantısından sonra bir de şifreleme anlaşması yapılır. İstemci hangi şifreleme yöntemlerini bildiğini söyler.", tone: "blue" });
          steps.push({ from: "s", to: "c", label: "ServerHello + Sertifika", detail: "Sunucu kimliğini kanıtlayan sertifikasını gönderir (kilit simgesi bu yüzden çıkar).", tone: "yellow" });
          steps.push({ from: "c", to: "s", label: "Anahtar değişimi", detail: "İki taraf ortak bir gizli anahtar üretir. Bundan sonra tüm veriler şifreli akar.", tone: "green" });
        }
        const req: Record<string, [string, string, string, string]> = {
          http: ["GET / HTTP/1.1", "Tarayıcı sayfayı ister. HTTP'de bu istek düz metindir; ağı dinleyen biri okuyabilir!", "200 OK + Web sayfası", "Sunucu sayfayı gönderir. (200 = başarılı)"],
          https: ["Şifreli GET isteği", "İstek şifreli gönderilir; ağda dinleyen kişi içeriği okuyamaz.", "Şifreli 200 OK + sayfa", "Sayfa şifreli şekilde gelir. Güvenli bağlantı!"],
          ftp: ["USER / PASS", "FTP kullanıcı adı ve parolayı gönderir (düz metin – güvensizdir).", "230 Giriş başarılı", "Dosya listesi ve aktarımı başlayabilir."],
          ssh: ["SSH anahtar değişimi + giriş", "SSH, baştan şifreli bir kanal kurar ve kullanıcıyı doğrular.", "Terminal oturumu açıldı", "Uzak bilgisayarın komut satırına güvenle bağlandın."],
          rdp: ["RDP oturum isteği", "Uzak masaüstü bağlantısı için kullanıcı doğrulaması istenir.", "Ekran görüntüsü akışı", "Uzak bilgisayarın masaüstü ekranı sana akar."],
        };
        const r = req[s.id];
        steps.push({ from: "c", to: "s", label: r[0], detail: r[1], tone: "blue" });
        steps.push({ from: "s", to: "c", label: r[2], detail: r[3], tone: "green" });
        done = () => actions.addEvents(moduleId, ["tcp_handshake", `svc_${s.id}`]);
      }
    }
    setRun({ id: n + 1, steps, actors, done });
    setN((x) => x + 1);
  };

  const startUdp = () => {
    const chunks = (msg || "Merhaba").match(/.{1,6}/g) ?? ["Merhaba"];
    const lostIdx = loss && chunks.length > 1 ? 1 : -1;
    const actors: Actor[] = [
      { id: "c", label: "Gönderen", sub: `UDP port ${cport}`, emoji: "💻" },
      { id: "s", label: "Alıcı", sub: "UDP port 5004", emoji: "🖥️" },
    ];
    const steps: SeqStep[] = chunks.map((c, i) =>
      i === lostIdx
        ? { from: "c", to: "s", label: `Datagram ${i + 1}: "${c}" ✘ KAYBOLDU`, detail: `Bu paket yolda kayboldu. UDP kaybı fark etmez ve yeniden göndermez. Alıcıya "${c}" parçası ulaşmadı. TCP olsaydı eksik paket fark edilip tekrar gönderilirdi.`, tone: "red" as const }
        : { from: "c", to: "s", label: `Datagram ${i + 1}: "${c}"`, detail: "UDP paketi el sıkışma olmadan gönderildi. Cevap beklenmez; canlı yayın, oyun ve DNS için hız önemlidir.", tone: "blue" as const }
    );
    const received = chunks.filter((_, i) => i !== lostIdx).join("");
    steps.push({ from: "s", to: "s", label: `Alınan: "${received}"`, detail: lostIdx >= 0 ? "Mesajın bir kısmı eksik! UDP hızlıdır ama güvenilir değildir. Ses/video için küçük eksikler sorun olmaz, ama dosya indirirken olur." : "Bu sefer tüm paketler ulaştı. Ama UDP bunu garanti etmez.", tone: lostIdx >= 0 ? "red" : "green" });
    setRun({ id: n + 1, steps, actors, done: () => actions.addEvents(moduleId, ["udp_sent", ...(lostIdx >= 0 ? ["udp_loss"] : [])]) });
    setN((x) => x + 1);
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex flex-wrap rounded-lg bg-black/50 p-1">
        {[
          ["app", "1) Bağlantı kur (TCP/HTTP/HTTPS…)"],
          ["udp", "2) UDP ile veri gönder"],
          ["dns", "3) DNS sorgusu"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setMode(k as typeof mode);
              setRun(null);
            }}
            className={cn("rounded-md px-3 py-2 text-sm font-semibold", mode === k ? "bg-yellow-400 text-black" : "text-zinc-300 hover:bg-white/10")}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === "app" && (
        <>
          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-white">Sunucunun kapıları (portları)</div>
            <p className="mb-3 text-xs text-zinc-400">Sunucu bir apartman gibidir: IP adresi apartmanın adresi, port numarası ise kapı numarasıdır. Bir servisi seç, istersen portunu kapat ve bağlanmayı dene.</p>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {SERVICES.map((x) => {
                const isClosed = closed.includes(x.id);
                return (
                  <div key={x.id} className={cn("rounded-lg border p-2.5 text-center", svc === x.id ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-black/40")}>
                    <button
                      onClick={() => {
                        setSvc(x.id);
                        setRun(null);
                      }}
                      className="w-full"
                    >
                      <div className="text-lg font-bold text-white">{x.name}</div>
                      <div className="font-mono text-sm text-yellow-300">:{x.port}</div>
                      <div className="text-[11px] text-zinc-400">
                        {x.proto} · {x.desc}
                      </div>
                    </button>
                    <button
                      onClick={() => setClosed((c) => (isClosed ? c.filter((i) => i !== x.id) : [...c, x.id]))}
                      className={cn("mt-2 w-full rounded-md px-2 py-1 text-[11px] font-semibold", isClosed ? "bg-red-500/20 text-red-300" : "bg-emerald-500/15 text-emerald-300")}
                    >
                      {isClosed ? "🔒 Kapalı" : "🔓 Açık"}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="flex flex-wrap items-center gap-3">
            <Btn onClick={startApp}>
              {s.name} ({s.proto}:{s.port}) bağlantısını başlat
            </Btn>
            <span className="text-xs text-zinc-400">İstemci portu her seferinde rastgele seçilir (örn. {cport}). Sunucu portu ise sabittir.</span>
          </div>
          {run && <SequenceDiagram key={run.id} actors={run.actors} steps={run.steps} onComplete={run.done} />}
        </>
      )}

      {mode === "udp" && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-zinc-400">
              Gönderilecek mesaj (6'şar karakterlik datagramlara bölünür)
              <input value={msg} onChange={(e) => setMsg(e.target.value)} className="mt-1 block w-72 rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-yellow-400" />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={loss} onChange={(e) => setLoss(e.target.checked)} className="accent-yellow-400" /> Paket kaybı olsun
            </label>
            <Btn onClick={startUdp}>UDP ile gönder</Btn>
          </div>
          {run && <SequenceDiagram key={run.id} actors={run.actors} steps={run.steps} onComplete={run.done} />}
        </>
      )}

      {mode === "dns" && <DnsPanel moduleId={moduleId} />}
    </div>
  );
}
