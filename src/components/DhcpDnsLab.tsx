import { useState } from "react";
import { Btn, Card, Badge } from "./ui";
import { SequenceDiagram, type SeqStep, type Actor } from "./SequenceDiagram";
import { actions } from "../lib/store";
import { cn } from "../utils/cn";

export const DNS_RECORDS: Record<string, string> = {
  "google.com": "142.250.187.206",
  "youtube.com": "142.250.184.14",
  "wikipedia.org": "185.15.58.224",
  "github.com": "140.82.121.4",
  "agcyberlab.com": "203.0.113.25",
};

export function DnsPanel({ moduleId }: { moduleId: string }) {
  const [input, setInput] = useState("google.com");
  const [cache, setCache] = useState<Record<string, string>>({});
  const [run, setRun] = useState<{ id: number; domain: string; ip?: string; cached: boolean; steps: SeqStep[] } | null>(null);
  const [counter, setCounter] = useState(0);

  const actors: Actor[] = [
    { id: "pc", label: "Senin bilgisayarın", sub: "192.168.1.10", emoji: "💻" },
    { id: "dns", label: "DNS sunucusu", sub: "192.168.1.1", emoji: "📖" },
    { id: "root", label: "Kök/TLD/Yetkili DNS", sub: "internet", emoji: "🌍" },
  ];

  const start = () => {
    const domain = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    if (!domain) return;
    const ip = DNS_RECORDS[domain];
    const cached = !!cache[domain];
    const steps: SeqStep[] = [{ from: "pc", to: "dns", label: `${domain} nerede?`, detail: `Tarayıcı ${domain} adresini açmak istiyor ama sadece IP ile konuşabilir. Bu yüzden DNS sunucusuna soruyor (UDP, port 53).` }];
    if (cached) {
      steps.push({ from: "dns", to: "dns", label: "Önbellekte var!", detail: "Bu alan adını daha önce sormuştun. DNS sunucusu cevabı hafızasında (cache) tuttuğu için internete sormadan hemen cevap verir. Bu yüzden ikinci ziyaret daha hızlıdır.", tone: "green" });
      steps.push({ from: "dns", to: "pc", label: `IP: ${cache[domain]}`, detail: "Cevap çok hızlı döndü.", tone: "green" });
    } else if (ip) {
      steps.push({ from: "dns", to: "dns", label: "Önbellek boş", detail: "DNS sunucusu kendi defterine baktı, bu isim yok. Daha üst DNS sunucularına soracak." });
      steps.push({ from: "dns", to: "root", label: `${domain} kimde?`, detail: "Sorgu sırasıyla Kök (.), TLD (.com gibi) ve alan adının yetkili DNS sunucusuna ulaşır. Biz bunu tek kutu olarak gösteriyoruz." });
      steps.push({ from: "root", to: "dns", label: `${ip}`, detail: `Yetkili DNS sunucusu cevap verdi: ${domain} → ${ip}`, tone: "green" });
      steps.push({ from: "dns", to: "pc", label: `IP: ${ip}`, detail: "DNS sunucusu cevabı sana iletir ve bir süre önbelleğinde saklar.", tone: "green" });
    } else {
      steps.push({ from: "dns", to: "dns", label: "Önbellek boş", detail: "Kendi defterinde yok, üst sunuculara soracak." });
      steps.push({ from: "dns", to: "root", label: `${domain} kimde?`, detail: "Sorgu hiyerarşide yukarı doğru ilerler." });
      steps.push({ from: "root", to: "dns", label: "Böyle bir kayıt yok", detail: "Hiçbir DNS sunucusu bu isme ait kayıt bulamadı (NXDOMAIN).", tone: "red" });
      steps.push({ from: "dns", to: "pc", label: "NXDOMAIN (bulunamadı)", detail: "Tarayıcıda 'Siteye ulaşılamıyor' hatası görürsün. Alan adını yanlış yazmış olabilirsin.", tone: "red" });
    }
    if (ip) steps.push({ from: "pc", to: "pc", label: `${ip} adresine bağlan`, detail: "Artık IP adresi biliniyor. Tarayıcı bu adrese HTTP/HTTPS isteği gönderebilir.", tone: "green" });
    setRun({ id: counter + 1, domain, ip, cached, steps });
    setCounter((c) => c + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-zinc-400">
          Alan adı (domain)
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            className="mt-1 block w-64 rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
            placeholder="google.com"
          />
        </label>
        <Btn onClick={start}>DNS sorgusu yap</Btn>
        <Btn variant="ghost" onClick={() => setCache({})}>
          Önbelleği temizle
        </Btn>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-zinc-400">Dene:</span>
        {[...Object.keys(DNS_RECORDS), "yanlisadres.xyz"].map((d) => (
          <button key={d} onClick={() => setInput(d)} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-200 hover:bg-white/10">
            {d}
          </button>
        ))}
      </div>
      {run && (
        <SequenceDiagram
          key={run.id}
          actors={actors}
          steps={run.steps}
          onComplete={() => {
            if (run.ip) {
              setCache((c) => ({ ...c, [run.domain]: run.ip! }));
              actions.addEvents(moduleId, ["dns_resolved", ...(run.cached ? ["dns_cache_hit"] : [])]);
            } else actions.addEvents(moduleId, ["dns_nxdomain"]);
          }}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold text-white">DNS defteri (örnek kayıtlar)</div>
          <table className="w-full text-xs">
            <tbody className="font-mono">
              {Object.entries(DNS_RECORDS).map(([d, ip]) => (
                <tr key={d} className="border-t border-white/5">
                  <td className="py-1 text-zinc-200">{d}</td>
                  <td className="py-1 text-right text-yellow-300">{ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold text-white">Önbellek (cache)</div>
          {Object.keys(cache).length === 0 ? (
            <p className="text-xs text-zinc-500">Önbellek boş. Bir sorgu yapınca cevap burada saklanır. Aynı alan adını tekrar sorarsan cevap önbellekten gelir.</p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {Object.entries(cache).map(([d, ip]) => (
                <div key={d} className="flex justify-between">
                  <span className="text-zinc-200">{d}</span>
                  <span className="text-emerald-300">{ip}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function DhcpPanel({ moduleId }: { moduleId: string }) {
  const [serverOn, setServerOn] = useState(true);
  const [lease, setLease] = useState<{ ip: string; apipa?: boolean } | null>(null);
  const [run, setRun] = useState<{ id: number; steps: SeqStep[]; ip?: string } | null>(null);
  const [count, setCount] = useState(0);

  const actors: Actor[] = [
    { id: "pc", label: "Bilgisayar (istemci)", sub: lease ? lease.ip : "0.0.0.0", emoji: "💻" },
    { id: "dhcp", label: "DHCP sunucusu", sub: "192.168.1.1", emoji: "📮" },
  ];

  const start = () => {
    const ip = `192.168.1.${100 + count}`;
    setLease(null);
    const steps: SeqStep[] = [
      { from: "pc", to: "dhcp", label: "1. DISCOVER (Keşfet)", detail: "Bilgisayar ağa yeni bağlandı, IP adresi yok (0.0.0.0). Herkese birden bağırır: 'Ağda DHCP sunucusu var mı? Bana bir IP lazım!' (yayın / broadcast)", tone: "blue" },
    ];
    if (serverOn) {
      steps.push(
        { from: "dhcp", to: "pc", label: `2. OFFER (Teklif)`, detail: `DHCP sunucusu havuzundan boş bir adres seçer ve teklif eder: 'Sana ${ip} adresini verebilirim.'`, tone: "yellow" },
        { from: "pc", to: "dhcp", label: "3. REQUEST (İstek)", detail: `Bilgisayar teklifi kabul eder: 'Evet, ${ip} adresini istiyorum.' (Birden fazla DHCP sunucusu varsa hangisini seçtiğini de duyurur.)`, tone: "blue" },
        { from: "dhcp", to: "pc", label: "4. ACKNOWLEDGE (Onay)", detail: `Sunucu onaylar: '${ip} artık senin. Kira süresi 24 saat.' Ayrıca subnet mask, gateway ve DNS bilgisini de gönderir.`, tone: "green" },
        { from: "pc", to: "pc", label: `IP ayarlandı: ${ip}`, detail: "Bilgisayar artık ağda kullanılabilir. Tüm ayarları elle girmen gerekmedi!", tone: "green" }
      );
    } else {
      steps.push(
        { from: "dhcp", to: "dhcp", label: "Sunucu kapalı", detail: "DHCP sunucusu kapalı olduğu için Discover mesajını kimse duymaz.", tone: "red" },
        { from: "pc", to: "pc", label: "APIPA: 169.254.x.x", detail: "Cevap gelmeyince Windows kendine 169.254.x.x gibi geçici bir adres verir. Bu adresle internete çıkamazsın. Bu adresi görürsen: 'DHCP çalışmıyor!' diye düşün.", tone: "red" }
      );
    }
    setRun({ id: count + 1, steps, ip: serverOn ? ip : undefined });
    setCount((c) => c + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setServerOn((s) => !s)}
          className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", serverOn ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300")}
        >
          DHCP sunucusu: {serverOn ? "AÇIK" : "KAPALI"}
        </button>
        <Btn onClick={start}>Otomatik IP iste (DHCP)</Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            setLease(null);
            setRun(null);
          }}
        >
          IP'yi bırak (Release)
        </Btn>
        <span className="text-xs text-zinc-400">Havuz: 192.168.1.100 – 192.168.1.199</span>
      </div>
      {run && (
        <SequenceDiagram
          key={run.id}
          actors={actors}
          steps={run.steps}
          onComplete={() => {
            if (run.ip) {
              setLease({ ip: run.ip });
              actions.addEvents(moduleId, ["dhcp_dora_done"]);
            } else {
              setLease({ ip: "169.254.17.88", apipa: true });
              actions.addEvents(moduleId, ["dhcp_server_off_tested"]);
            }
          }}
        />
      )}
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          Bilgisayarın ağ ayarları {lease ? <Badge tone={lease.apipa ? "red" : "green"}>{lease.apipa ? "APIPA" : "DHCP'den alındı"}</Badge> : <Badge tone="gray">IP yok</Badge>}
        </div>
        <div className="grid gap-2 font-mono text-xs sm:grid-cols-2">
          {[
            ["IP adresi", lease?.ip ?? "0.0.0.0"],
            ["Subnet Mask", lease ? (lease.apipa ? "255.255.0.0" : "255.255.255.0") : "—"],
            ["Default Gateway", lease && !lease.apipa ? "192.168.1.1" : "—"],
            ["DNS sunucusu", lease && !lease.apipa ? "192.168.1.1" : "—"],
            ["Kira süresi", lease && !lease.apipa ? "24 saat" : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between rounded-md bg-black/40 px-3 py-2">
              <span className="font-sans text-zinc-400">{k}</span>
              <span className="text-yellow-300">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DhcpDnsLab({ moduleId }: { moduleId: string }) {
  const [tab, setTab] = useState<"dhcp" | "dns">("dhcp");
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-black/50 p-1">
        {[
          ["dhcp", "1) DHCP – otomatik IP (DORA)"],
          ["dns", "2) DNS – alan adı çözümleme"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as "dhcp" | "dns")} className={cn("rounded-md px-4 py-2 text-sm font-semibold", tab === k ? "bg-yellow-400 text-black" : "text-zinc-300 hover:bg-white/10")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "dhcp" ? <DhcpPanel moduleId={moduleId} /> : <DnsPanel moduleId={moduleId} />}
    </div>
  );
}
