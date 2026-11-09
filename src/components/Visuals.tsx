import { useState, type ReactNode } from "react";
import { Card, Callout } from "./ui";
import { OSI_LAYERS } from "../data/osi";
import { broadcastOf, isPrivateIp, isValidIp, isValidMask, networkOf, prefixOf, toInt, toIp } from "../lib/net";
import { cn } from "../utils/cn";

const Node = ({ e, l, sub, tone = "border-yellow-400/40" }: { e: string; l: string; sub?: string; tone?: string }) => (
  <div className={cn("flex min-w-20 flex-col items-center rounded-xl border bg-black/60 px-3 py-2 text-center", tone)}>
    <span className="text-2xl">{e}</span>
    <span className="text-xs font-semibold text-white">{l}</span>
    {sub && <span className="font-mono text-[10px] text-zinc-400">{sub}</span>}
  </div>
);
const Line = ({ label, dashed }: { label?: string; dashed?: boolean }) => (
  <div className="flex min-w-10 flex-1 flex-col items-center justify-center px-1">
    {label && <span className="mb-0.5 text-center text-[10px] text-yellow-300">{label}</span>}
    <div className={cn("w-full border-t-2", dashed ? "border-dashed border-sky-400" : "border-yellow-400")} />
  </div>
);

function Tabbed({ items }: { items: { key: string; label: string; diagram: ReactNode; text: ReactNode }[] }) {
  const [k, setK] = useState(items[0].key);
  const it = items.find((i) => i.key === k)!;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button key={i.key} onClick={() => setK(i.key)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", k === i.key ? "bg-yellow-400 text-black" : "border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10")}>
            {i.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black p-5">{it.diagram}</div>
      <div className="text-sm leading-relaxed text-zinc-300">{it.text}</div>
    </div>
  );
}

function V1() {
  return (
    <Tabbed
      items={[
        {
          key: "lan",
          label: "LAN",
          diagram: (
            <div className="flex items-center justify-center gap-2">
              <Node e="💻" l="Laptop" />
              <Line />
              <Node e="🔀" l="Switch" tone="border-emerald-400/40" />
              <Line />
              <Node e="🖨️" l="Yazıcı" />
              <Line />
              <Node e="🖥️" l="Masaüstü" />
            </div>
          ),
          text: "LAN (Yerel Ağ): Ev, ofis ya da okul gibi küçük bir alandaki cihazların oluşturduğu ağdır. Hızlıdır ve sahibi sensin.",
        },
        {
          key: "wlan",
          label: "WLAN",
          diagram: (
            <div className="flex items-center justify-center gap-3">
              <Node e="📱" l="Telefon" />
              <Line dashed label="Wi‑Fi" />
              <Node e="📡" l="Access Point" tone="border-pink-400/40" />
              <Line dashed label="Wi‑Fi" />
              <Node e="💻" l="Laptop" />
            </div>
          ),
          text: "WLAN (Kablosuz Yerel Ağ): LAN'ın kablosuz hâlidir. Cihazlar kablo yerine radyo dalgalarıyla (Wi‑Fi) bağlanır. Kesikli mavi çizgiler kablosuz bağlantıyı gösterir.",
        },
        {
          key: "wan",
          label: "WAN",
          diagram: (
            <div className="flex items-center justify-center gap-2">
              <div className="rounded-xl border border-dashed border-white/30 p-2">
                <div className="mb-1 text-center text-[10px] text-zinc-400">İstanbul ofisi (LAN)</div>
                <div className="flex gap-1.5">
                  <Node e="💻" l="PC" />
                  <Node e="📡" l="Router" />
                </div>
              </div>
              <Line label="Operatör hatları" />
              <Node e="🌍" l="WAN / İnternet" tone="border-cyan-400/40" />
              <Line label="Operatör hatları" />
              <div className="rounded-xl border border-dashed border-white/30 p-2">
                <div className="mb-1 text-center text-[10px] text-zinc-400">Ankara ofisi (LAN)</div>
                <div className="flex gap-1.5">
                  <Node e="📡" l="Router" />
                  <Node e="🖥️" l="Sunucu" />
                </div>
              </div>
            </div>
          ),
          text: "WAN (Geniş Alan Ağı): Şehirleri, ülkeleri birbirine bağlayan büyük ağdır. İnternet, dünyanın en büyük WAN'ıdır. Evdeki LAN'ını WAN'a router bağlar.",
        },
        {
          key: "cs",
          label: "İstemci – Sunucu",
          diagram: (
            <div className="flex items-center justify-center gap-3">
              <Node e="💻" l="İstemci (Client)" sub="'Sayfayı ver'" />
              <div className="flex flex-1 flex-col gap-3">
                <Line label="İstek →" />
                <Line label="← Cevap" dashed />
              </div>
              <Node e="🖥️" l="Sunucu (Server)" sub="'İşte sayfa'" tone="border-violet-400/40" />
            </div>
          ),
          text: "İstemci hizmet isteyen, sunucu hizmet veren bilgisayardır. Lokantada sen müşterisin (istemci), garson mutfaktan yemeği getirir (sunucu).",
        },
        {
          key: "home",
          label: "Evdeki ağ",
          diagram: (
            <div className="flex items-center justify-center gap-2">
              <Node e="🌍" l="İnternet" tone="border-cyan-400/40" />
              <Line />
              <div className="rounded-xl border border-dashed border-yellow-400/50 p-2">
                <div className="mb-1 text-center text-[10px] text-yellow-300">Evin yerel ağı (LAN)</div>
                <div className="flex items-center gap-1.5">
                  <Node e="📡" l="Modem/Router" />
                  <Node e="📱" l="Telefon" />
                  <Node e="💻" l="Laptop" />
                  <Node e="📺" l="TV" />
                </div>
              </div>
            </div>
          ),
          text: "Evinin ağı bir LAN'dır; modem/router bu LAN'ı internete bağlar. İnternet ≠ yerel ağ: İnternet dışarıdaki dev ağ, yerel ağ ise sadece senin evindeki cihazlardır. Yazıcıya internetsiz de ulaşabilirsin.",
        },
      ]}
    />
  );
}

function V2() {
  const devs = [
    { e: "☎️", n: "Modem", life: "Evinin dış dünyaya açılan kapısı ve çevirmeni.", job: "İnternet sağlayıcının hattındaki sinyali (ADSL/Fiber) bilgisayarların anlayacağı veriye çevirir.", where: "Duvar/hat ile Router arasında." },
    { e: "📡", n: "Router", life: "Trafik polisi: araçların hangi yola gideceğine karar verir.", job: "Yerel ağı internete bağlar, ağlar arası yönlendirme yapar, IP adresi dağıtır (DHCP).", where: "Modem ile Switch/cihazlar arasında." },
    { e: "🔀", n: "Switch", life: "Apartmandaki kapıcı: postayı doğru daireye bırakır.", job: "Kablolu cihazları birbirine bağlar, paketi sadece ilgili cihaza (MAC adresine bakarak) iletir.", where: "Router ile bilgisayarlar arasında." },
    { e: "📶", n: "Access Point", life: "Evin içindeki Wi‑Fi vericisi.", job: "Kablolu ağı kablosuz hâle getirir; telefon ve laptop kablosuz bağlanır.", where: "Router/Switch'e kabloyla bağlı." },
    { e: "🛡️", n: "Firewall", life: "Güvenlik görevlisi: kimin içeri gireceğine karar verir.", job: "Kurallara göre trafiği engeller veya geçirir. Zararlı bağlantıları durdurur.", where: "Ağın girişinde, router yanında." },
    { e: "🔌", n: "Ethernet kablosu", life: "Cihazlar arasındaki yol.", job: "Veriyi elektrik sinyali olarak taşır (Cat5e/Cat6, genelde 100 m'ye kadar).", where: "Cihazlardan cihazlara." },
  ];
  const [o, setO] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black p-4">
        <Node e="🌍" l="İnternet" />
        <Line />
        <Node e="☎️" l="Modem" />
        <Line />
        <Node e="📡" l="Router" />
        <Line />
        <Node e="🔀" l="Switch" />
        <Line />
        <Node e="💻" l="PC'ler" />
      </div>
      <p className="text-xs text-zinc-400">Tipik ev ağı zinciri. Aşağıdaki kartlara tıkla; her cihazın günlük hayattaki karşılığını gör.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devs.map((d) => (
          <button key={d.n} onClick={() => setO(o === d.n ? null : d.n)} className={cn("rounded-xl border p-4 text-left transition", o === d.n ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-zinc-900/60 hover:bg-white/5")}>
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">{d.e}</span>
              <b>{d.n}</b>
            </div>
            <div className="mt-2 text-sm text-yellow-200">🏠 {d.life}</div>
            {o === d.n && (
              <div className="mt-2 space-y-1 text-sm text-zinc-300">
                <div>
                  <b className="text-white">Görevi:</b> {d.job}
                </div>
                <div>
                  <b className="text-white">Nerede durur:</b> {d.where}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function V3() {
  const [ip, setIp] = useState("192.168.1.25");
  const valid = isValidIp(ip);
  const parts = valid ? ip.split(".").map(Number) : [];
  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-2 text-sm font-semibold text-white">IPv4 adresini incele</div>
        <input value={ip} onChange={(e) => setIp(e.target.value.trim())} className={cn("w-56 rounded-md border bg-black px-3 py-2 font-mono text-white outline-none", valid ? "border-emerald-500/50" : "border-red-500/60")} />
        {valid ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {parts.map((p, i) => (
                <div key={i} className="rounded-lg border border-yellow-400/30 bg-black p-3 text-center">
                  <div className="font-mono text-2xl font-bold text-yellow-300">{p}</div>
                  <div className="font-mono text-xs text-zinc-400">{p.toString(2).padStart(8, "0")}</div>
                  <div className="text-[10px] text-zinc-500">{i + 1}. bölüm (8 bit)</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              IPv4 adresi, noktayla ayrılmış <b>4 sayıdan</b> oluşur. Her sayı 0–255 arasındadır (8 bit). Toplam 32 bit. Bu adres: <b className={isPrivateIp(ip) ? "text-emerald-300" : "text-sky-300"}>{isPrivateIp(ip) ? "ÖZEL (private) – sadece yerel ağda kullanılır" : "GENEL (public) – internette görünür"}</b>
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-red-300">Geçersiz adres. 4 sayı yaz ve her biri 0–255 arasında olsun. Örn: 10.0.0.5</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {["192.168.1.25", "10.0.0.5", "172.16.4.9", "8.8.8.8", "256.1.1.1"].map((x) => (
            <button key={x} onClick={() => setIp(x)} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-zinc-200 hover:bg-white/10">
              {x}
            </button>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-yellow-400/30">
          <div className="text-lg font-bold text-yellow-300">🏠 IP adresi</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>Evin posta adresi gibidir.</li>
            <li>Bulunduğun ağa göre değişebilir.</li>
            <li>Yazılımla verilir (elle ya da DHCP).</li>
            <li>Ağlar arası ulaşmak için kullanılır.</li>
            <li className="font-mono text-yellow-200">192.168.1.25</li>
          </ul>
        </Card>
        <Card className="border-sky-400/30">
          <div className="text-lg font-bold text-sky-300">🪪 MAC adresi</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>Kimlik numarası gibidir.</li>
            <li>Ağ kartına fabrikada yazılır, normalde değişmez.</li>
            <li>Donanıma aittir.</li>
            <li>Aynı ağ içinde teslimat için kullanılır.</li>
            <li className="font-mono text-sky-200">A4:2B:B0:1C:9E:F1</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function V4() {
  const [ip, setIp] = useState("192.168.1.10");
  const [mask, setMask] = useState("255.255.255.0");
  const [ip2, setIp2] = useState("192.168.1.20");
  const ok = isValidIp(ip) && isValidMask(mask);
  const bits = ok ? toInt(ip).toString(2).padStart(32, "0") : "";
  const pre = ok ? prefixOf(mask) : 0;
  const fmt = (b: string) => b.match(/.{8}/g)!;
  const same = ok && isValidIp(ip2) && networkOf(ip, mask) === networkOf(ip2, mask);
  const hosts = ok ? Math.max(0, 2 ** (32 - pre) - 2) : 0;
  const inp = (v: string, set: (s: string) => void, valid: boolean) => <input value={v} onChange={(e) => set(e.target.value.trim())} className={cn("w-44 rounded-md border bg-black px-3 py-2 font-mono text-sm text-white outline-none", valid ? "border-emerald-500/50" : "border-red-500/60")} />;
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 text-sm font-semibold text-white">Subnet Mask hesaplayıcı: IP adresi iki parçaya ayrılır</div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-zinc-400">
            IP adresi
            <div className="mt-1">{inp(ip, setIp, isValidIp(ip))}</div>
          </label>
          <label className="text-xs text-zinc-400">
            Subnet Mask
            <div className="mt-1">{inp(mask, setMask, isValidMask(mask))}</div>
          </label>
          {[["/8", "255.0.0.0"], ["/16", "255.255.0.0"], ["/24", "255.255.255.0"], ["/25", "255.255.255.128"]].map(([l, m]) => (
            <button key={l} onClick={() => setMask(m)} className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 font-mono text-xs text-zinc-200 hover:bg-white/10">
              {l}
            </button>
          ))}
        </div>
        {ok ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2 font-mono text-sm">
              {fmt(bits).map((oct, i) => (
                <div key={i} className="flex rounded-md bg-black px-2 py-1.5">
                  {oct.split("").map((b, j) => (
                    <span key={j} className={i * 8 + j < pre ? "text-yellow-300" : "text-white"}>
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-xs text-zinc-400">
              <span className="text-yellow-300">■ Sarı bitler = AĞ kısmı (mahalle)</span> · <span className="text-white">■ Beyaz bitler = CİHAZ kısmı (kapı numarası)</span> · /{pre}
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Ağ adresi", networkOf(ip, mask)],
                ["Broadcast", broadcastOf(ip, mask)],
                ["İlk – son cihaz", `${toIp(toInt(networkOf(ip, mask)) + 1)} – ${toIp(toInt(broadcastOf(ip, mask)) - 1)}`],
                ["Kullanılabilir cihaz", String(hosts)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-black/50 p-2.5">
                  <div className="text-xs text-zinc-400">{k}</div>
                  <div className="break-all font-mono text-yellow-300">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-red-300">Geçerli bir IP ve Subnet Mask yaz (örn. 255.255.255.0).</p>
        )}
      </Card>
      <Card>
        <div className="mb-2 text-sm font-semibold text-white">Aynı ağda mı? İkinci cihazı dene</div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-zinc-300">{ip}</span>
          <span className="text-zinc-500">ile</span>
          {inp(ip2, setIp2, isValidIp(ip2))}
          <span className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", same ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>{ok && isValidIp(ip2) ? (same ? "✔ AYNI ağda → doğrudan konuşurlar" : "✘ FARKLI ağda → Gateway (router) gerekir") : "Geçerli IP gir"}</span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Kural: Ağ kısımları (sarı bitler) aynıysa cihazlar aynı mahalledir. Farklıysa paket önce mahallenin çıkış kapısına (Default Gateway) gider.</p>
      </Card>
    </div>
  );
}

function V5() {
  const rows = [
    ["21", "FTP", "Dosya aktarımı", "TCP"],
    ["22", "SSH", "Güvenli uzak bağlantı", "TCP"],
    ["53", "DNS", "Alan adı → IP", "UDP (ve TCP)"],
    ["80", "HTTP", "Web (şifresiz)", "TCP"],
    ["443", "HTTPS", "Web (şifreli)", "TCP"],
    ["3389", "RDP", "Uzak masaüstü", "TCP"],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-white/10 bg-black p-4">
        <div className="rounded-xl border border-yellow-400/40 p-3">
          <div className="mb-2 text-center text-sm font-bold text-yellow-300">🏢 Sunucu = Apartman</div>
          <div className="text-center text-xs text-zinc-400">IP adresi: apartmanın adresi</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {rows.map((r) => (
              <div key={r[0]} className="rounded-md border border-white/15 bg-zinc-900 px-2 py-1.5 text-center">
                <div className="font-mono text-sm text-yellow-300">🚪 {r[0]}</div>
                <div className="text-[10px] text-zinc-300">{r[1]}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-xs text-zinc-400">Port: kapı (daire) numarası</div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="px-3 py-2">Port</th>
              <th>Protokol</th>
              <th>Ne için?</th>
              <th>Taşıma</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-white/5">
                <td className="px-3 py-2 font-mono font-bold text-yellow-300">{r[0]}</td>
                <td className="font-semibold text-white">{r[1]}</td>
                <td className="text-zinc-300">{r[2]}</td>
                <td className="text-zinc-400">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-emerald-400/30">
          <div className="font-bold text-emerald-300">TCP – Taahhütlü kargo 📦✔</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>Önce el sıkışır (SYN, SYN-ACK, ACK).</li>
            <li>Her paketin teslimini onaylar, kayıpsa tekrar gönderir.</li>
            <li>Sıra bozulmaz. Yavaş ama güvenilir.</li>
            <li>Web, e-posta, dosya indirme.</li>
          </ul>
        </Card>
        <Card className="border-sky-400/30">
          <div className="font-bold text-sky-300">UDP – Posta kutusuna atılan broşür 📬⚡</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>El sıkışma yok, direkt gönderir.</li>
            <li>Teslim garantisi yok, kayıp olabilir.</li>
            <li>Çok hızlı ve hafif.</li>
            <li>Canlı yayın, online oyun, DNS.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function V6() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-3 text-sm font-semibold text-white">📖 DNS = İnternetin telefon rehberi</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {["google.com yazarsın", "DNS sunucusuna sorulur", "Rehberde IP bulunur: 142.250.187.206", "Tarayıcı o IP'ye bağlanır"].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="rounded-lg border border-yellow-400/30 bg-black px-3 py-2 text-zinc-200">
                <b className="mr-1 text-yellow-300">{i + 1}.</b>
                {t}
              </div>
              {i < 3 && <span className="text-yellow-400">→</span>}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="mb-3 text-sm font-semibold text-white">📮 DHCP DORA = Otel resepsiyonunda oda almak</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["D", "Discover", "“Boş oda var mı?” diye bağırırsın.", "Bilgisayar: DHCP sunucusu arıyorum."],
            ["O", "Offer", "Resepsiyon: “12 numaralı odayı verebilirim.”", "Sunucu: Sana şu IP'yi önerebilirim."],
            ["R", "Request", "“Tamam, 12 numarayı istiyorum.”", "Bilgisayar: Bu IP'yi kabul ediyorum."],
            ["A", "Acknowledge", "“Anahtarın burada, 1 gece kalabilirsin.”", "Sunucu: Onaylandı, 24 saat kira."],
          ].map(([l, n, life, tech]) => (
            <div key={l} className="rounded-xl border border-white/10 bg-black/50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 font-bold text-black">{l}</span>
                <b className="text-white">{n}</b>
              </div>
              <div className="mt-2 text-xs text-yellow-200">🏨 {life}</div>
              <div className="mt-1 text-xs text-zinc-300">💻 {tech}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function V7() {
  const [sel, setSel] = useState<number>(4);
  const l = OSI_LAYERS.find((x) => x.no === sel)!;
  const tcpip = [
    { n: "Uygulama", rows: 3, layers: "7-6-5" },
    { n: "Taşıma", rows: 1, layers: "4" },
    { n: "İnternet", rows: 1, layers: "3" },
    { n: "Ağ Erişimi", rows: 2, layers: "2-1" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-center text-sm font-bold text-yellow-300">OSI (7 katman)</div>
          <div className="space-y-1">
            {OSI_LAYERS.map((x) => (
              <button key={x.no} onClick={() => setSel(x.no)} className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm", sel === x.no ? "border-yellow-400 bg-yellow-400 text-black" : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10")} style={{ height: 44 }}>
                <b>{x.no}</b> {x.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-center text-sm font-bold text-sky-300">TCP/IP (4 katman)</div>
          <div className="space-y-1">
            {tcpip.map((t) => (
              <div key={t.n} className="flex items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/5 text-sm font-semibold text-sky-100" style={{ height: t.rows * 44 + (t.rows - 1) * 4 }}>
                {t.n} <span className="ml-2 text-xs text-zinc-400">(OSI {t.layers})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Card className="border-yellow-400/30">
        <div className="text-sm font-bold text-yellow-300">
          Katman {l.no} – {l.tr} ({l.name})
        </div>
        <p className="mt-1 text-sm text-zinc-200">🏠 {l.life}</p>
        <p className="mt-1 text-sm text-zinc-300">⚙️ {l.tech}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Veri birimi: <b>{l.pdu}</b> · Örnekler: {l.proto} · TCP/IP karşılığı: {l.tcpip}
        </p>
      </Card>
      <Callout icon="💡" title="Kolay hatırlama" tone="blue">
        Yukarıdan aşağı: <b>A</b>ll <b>P</b>eople <b>S</b>eem <b>T</b>o <b>N</b>eed <b>D</b>ata <b>P</b>rocessing (7→1). OSI öğrenmek için bir modeldir; gerçek internet TCP/IP modeline göre çalışır.
      </Callout>
    </div>
  );
}

function V8() {
  const cmds = [
    ["ipconfig", "Benim adresim ne?", "IP, mask, gateway"],
    ["ping", "Karşıdaki cihaz canlı mı?", "Bağlantı + hız"],
    ["tracert", "Paket hangi yoldan gidiyor?", "Router durakları"],
    ["nslookup", "Bu sitenin IP'si ne?", "DNS cevabı"],
    ["netstat -an", "Hangi bağlantılar / portlar açık?", "Portlar ve durumlar"],
    ["arp -a", "Bu IP'nin MAC adresi ne?", "IP–MAC tablosu"],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cmds.map(([c, q, a]) => (
        <Card key={c} className="p-4">
          <code className="rounded bg-black px-2 py-1 text-sm font-bold text-yellow-300">{c}</code>
          <div className="mt-2 text-sm text-white">❓ {q}</div>
          <div className="mt-1 text-xs text-zinc-400">Cevap: {a}</div>
        </Card>
      ))}
    </div>
  );
}

export function ModuleVisual({ id }: { id: string }) {
  const map: Record<string, ReactNode> = { m1: <V1 />, m2: <V2 />, m3: <V3 />, m4: <V4 />, m5: <V5 />, m6: <V6 />, m7: <V7 />, m8: <V8 /> };
  return <>{map[id]}</>;
}
