import { useEffect, useRef, useState } from "react";
import { Btn, Card } from "./ui";
import { DNS_RECORDS } from "./DhcpDnsLab";
import { actions } from "../lib/store";
import { isValidIp } from "../lib/net";

const PROMPT = "C:\\Users\\ogrenci>";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Explain {
  cmd: string;
  what: string;
  fields: [string, string][];
  learned: string;
}

const EXPLAIN: Record<string, Explain> = {
  ipconfig: {
    cmd: "ipconfig",
    what: "Bilgisayarının kendi ağ ayarlarını gösterir: 'Ben ağda kimim, adresim ne, çıkış kapım hangisi?'",
    fields: [
      ["IPv4 Address", "Bilgisayarının ağdaki adresi (ev adresi gibi)."],
      ["Subnet Mask", "Hangi adreslerin 'aynı mahalle' sayılacağını belirler."],
      ["Default Gateway", "Ağ dışına çıkarken kullanılan kapı (genelde router)."],
    ],
    learned: "Ağ sorunlarında ilk bakılacak yer: IP adresin var mı? Gateway doğru mu? (169.254.x.x görürsen DHCP çalışmıyor demektir.)",
  },
  "ipconfig /all": {
    cmd: "ipconfig /all",
    what: "ipconfig'in detaylı hâli. MAC adresi, DHCP bilgisi ve DNS sunucusunu da gösterir.",
    fields: [
      ["Physical Address", "MAC adresi: ağ kartının fabrika kimliği."],
      ["DHCP Enabled", "Yes ise IP adresi otomatik (DHCP) alınıyor."],
      ["DNS Servers", "Alan adlarını IP'ye çeviren sunucu."],
      ["Lease Obtained / Expires", "DHCP'den alınan adresin kira süresi."],
    ],
    learned: "Aynı komuta /all ekleyince daha fazla ayrıntı görürsün. Hem IP hem MAC adresini aynı yerde görebilirsin.",
  },
  ping: {
    cmd: "ping",
    what: "Karşı cihaza küçük bir 'Orada mısın?' paketi gönderir ve cevap bekler. Bağlantı var mı, ne kadar hızlı diye bakar.",
    fields: [
      ["Reply from", "Karşı cihaz cevap verdi: bağlantı çalışıyor ✔"],
      ["time=…ms", "Gidiş-dönüş süresi. Küçük olması iyidir."],
      ["TTL", "Paketin ömrü: her router'dan geçince 1 azalır."],
      ["Lost", "Kaybolan paket sayısı. 0% olması beklenir."],
    ],
    learned: "Önce gateway'i (192.168.1.1), sonra internet adresini ping'le. Gateway cevap veriyor ama internet vermiyorsa sorun router'ın ötesindedir.",
  },
  tracert: {
    cmd: "tracert",
    what: "Paketin hedefe giderken hangi router'lardan (duraklardan) geçtiğini gösterir. Yol haritası gibidir.",
    fields: [
      ["1., 2., 3. … (hop)", "Her satır bir router/durak. 1. satır genelde senin gateway'in."],
      ["ms değerleri", "O durağa ulaşma süresi. Birden çok artıyorsa yavaşlama orada olabilir."],
      ["Request timed out (*)", "O durak cevap vermedi (güvenlik gereği olabilir)."],
    ],
    learned: "İnternet tek bir kablo değil, birçok router'ın zinciridir. Yavaşlık veya kopukluk hangi durakta oluyor, tracert ile görürsün.",
  },
  nslookup: {
    cmd: "nslookup",
    what: "DNS sunucusuna sorar: 'Bu alan adının IP adresi nedir?' Telefon rehberinde isim arama gibi.",
    fields: [
      ["Server / Address", "Sorguyu cevaplayan DNS sunucusu."],
      ["Name", "Sorduğun alan adı."],
      ["Addresses", "Alan adının karşılık geldiği IP adres(ler)i."],
    ],
    learned: "Siteye girilemiyorsa nslookup ile DNS çalışıyor mu bak. IP geliyorsa DNS tamam, sorun başka yerde olabilir.",
  },
  netstat: {
    cmd: "netstat -an",
    what: "Bilgisayarının şu anda hangi portları dinlediğini ve kimlerle bağlantı kurduğunu listeler.",
    fields: [
      ["Proto", "TCP veya UDP."],
      ["Local Address", "Senin IP:port bilgin. 0.0.0.0:80 → tüm adreslerde 80'i dinliyor."],
      ["Foreign Address", "Bağlandığın uzak IP:port."],
      ["State", "LISTENING = bekliyor, ESTABLISHED = bağlantı kuruldu."],
    ],
    learned: "Bilgisayarında hangi kapıların açık olduğunu ve kiminle konuştuğunu görürsün. Tanımadığın bir bağlantı güvenlik açısından incelenmelidir.",
  },
  arp: {
    cmd: "arp -a",
    what: "Aynı ağdaki cihazların IP adresi ile MAC adresi eşleşmelerini gösteren tabloyu listeler.",
    fields: [
      ["Internet Address", "Cihazın IP adresi."],
      ["Physical Address", "Aynı cihazın MAC adresi."],
      ["Type: dynamic", "Otomatik öğrenilmiş kayıt."],
    ],
    learned: "Yerel ağda paket, IP adresiyle değil MAC adresiyle teslim edilir. ARP, 'Bu IP kimin?' sorusunun cevabını tutar.",
  },
};

const QUICK = ["ipconfig", "ipconfig /all", "ping 192.168.1.1", "ping google.com", "tracert google.com", "nslookup google.com", "netstat -an", "arp -a"];

const HELP = [
  "Kullanabileceğin komutlar:",
  "  ipconfig            IP ayarlarını göster  (/all: ayrıntılı)",
  "  ping <adres>        Bağlantıyı test et    (örn. ping 192.168.1.1)",
  "  tracert <adres>     Paketin yolunu göster (örn. tracert google.com)",
  "  nslookup <alan adı> DNS sorgusu yap",
  "  netstat -an         Açık portlar ve bağlantılar",
  "  arp -a              IP-MAC eşleşme tablosu",
  "  clear / cls         Ekranı temizle",
];

export function TerminalLab({ moduleId }: { moduleId: string }) {
  const [lines, setLines] = useState<string[]>(["AG CYBER LAB Sanal Terminal [Sürüm 1.0]", "Bu terminal bir simülasyondur; gerçek sisteme komut göndermez.", "Komutları görmek için 'help' yaz ya da aşağıdaki butonlara tıkla.", ""]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<Explain | null>(null);
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const el = endRef.current;
    if (el?.parentElement) el.parentElement.scrollTop = el.parentElement.scrollHeight;
  }, [lines]);

  const out = (...l: string[]) => setLines((p) => [...p, ...l]);

  const resolve = (host: string): string | null => {
    const h = host.toLowerCase().replace(/^www\./, "");
    if (isValidIp(h)) return h;
    if (h === "localhost") return "127.0.0.1";
    return DNS_RECORDS[h] ?? null;
  };

  async function run(raw: string) {
    const cmd = raw.trim();
    out(`${PROMPT}${cmd}`);
    if (!cmd) return;
    setHist((h) => [cmd, ...h]);
    setHi(-1);
    const [c, ...args] = cmd.split(/\s+/);
    const name = c.toLowerCase();
    const ev = (...e: string[]) => actions.addEvents(moduleId, e);
    setBusy(true);
    setExplain(null);
    try {
      if (name === "help" || name === "?") out(...HELP, "");
      else if (name === "clear" || name === "cls") setLines([]);
      else if (name === "ipconfig") {
        const all = args[0]?.toLowerCase() === "/all";
        out(
          "",
          "Windows IP Yapılandırması",
          "",
          "Ethernet adapter Ethernet:",
          "",
          "   Connection-specific DNS Suffix  . : lan",
          ...(all ? ["   Physical Address. . . . . . . . . : A4-2B-B0-1C-9E-F1", "   DHCP Enabled. . . . . . . . . . . : Yes"] : []),
          "   IPv4 Address. . . . . . . . . . . : 192.168.1.10",
          "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
          "   Default Gateway . . . . . . . . . : 192.168.1.1",
          ...(all ? ["   DNS Servers . . . . . . . . . . . : 192.168.1.1", "   Lease Obtained. . . . . . . . . . : Bugün 09:12", "   Lease Expires . . . . . . . . . . : Yarın 09:12"] : []),
          ""
        );
        setExplain(EXPLAIN[all ? "ipconfig /all" : "ipconfig"]);
        ev("cmd_ipconfig");
      } else if (name === "ping") {
        const host = args.find((a) => !a.startsWith("-"));
        if (!host) {
          out("Kullanım: ping <adres>   (örn. ping 192.168.1.1)", "");
        } else {
          const ip = resolve(host);
          if (!ip) {
            out(`Ping request could not find host ${host}. Please check the name and try again.`, "(Alan adı DNS tarafından çözülemedi.)", "");
          } else {
            const local = ip.startsWith("192.168.") || ip.startsWith("127.") || ip.startsWith("10.");
            const known = ip === "192.168.1.1" || ip === "192.168.1.10" || ip === "192.168.1.20" || ip.startsWith("127.") || !local;
            out("", `Pinging ${host}${host !== ip ? ` [${ip}]` : ""} with 32 bytes of data:`);
            let ok = 0;
            for (let i = 0; i < 4; i++) {
              await sleep(650);
              if (!alive.current) return;
              const t = ip === "192.168.1.1" ? 1 + (i % 2) : local ? 1 : 12 + ((i * 7) % 9);
              out(known ? `Reply from ${ip}: bytes=32 time=${t}ms TTL=${local ? 64 : 117}` : `Reply from 192.168.1.10: Destination host unreachable.`);
              if (known) ok++;
            }
            out("", `Ping statistics for ${ip}:`, `    Packets: Sent = 4, Received = ${ok}, Lost = ${4 - ok} (${((4 - ok) * 25).toFixed(0)}% loss)`, "");
            if (!known) out("(Bu IP adresinde cevap veren bir cihaz yok. Ağda böyle bir cihaz olmayabilir.)", "");
            if (known) {
              ev(local ? "cmd_ping_local" : "cmd_ping_domain");
              if (ip === "192.168.1.1") ev("cmd_ping_gw");
              if (!isValidIp(host)) ev("cmd_ping_domain");
            }
            setExplain(EXPLAIN.ping);
          }
        }
      } else if (name === "tracert") {
        const host = args[0];
        const ip = host ? resolve(host) : null;
        if (!host) out("Kullanım: tracert <adres>", "");
        else if (!ip) out(`Unable to resolve target system name ${host}.`, "");
        else {
          out("", `Tracing route to ${host}${host !== ip ? ` [${ip}]` : ""}`, "over a maximum of 30 hops:", "");
          const hops: [string, string][] = [
            ["<1 ms", "192.168.1.1   (router – senin gateway'in)"],
            ["7 ms", "10.20.0.1      (internet sağlayıcın)"],
            ["9 ms", "81.212.45.17   (sağlayıcı omurga ağı)"],
            ["14 ms", "72.14.215.85   (Google ağına giriş)"],
            ["15 ms", `${ip}   (hedef)`],
          ];
          for (let i = 0; i < hops.length; i++) {
            await sleep(700);
            if (!alive.current) return;
            out(`  ${i + 1}    ${hops[i][0].padEnd(7)}${hops[i][0].padEnd(7)}${hops[i][0].padEnd(7)} ${hops[i][1]}`);
          }
          out("", "Trace complete.", "");
          ev("cmd_tracert");
          setExplain(EXPLAIN.tracert);
        }
      } else if (name === "nslookup") {
        const host = args[0]?.toLowerCase();
        if (!host) out("Kullanım: nslookup <alan adı>", "");
        else {
          await sleep(500);
          const ip = DNS_RECORDS[host.replace(/^www\./, "")];
          if (ip) {
            out("", "Server:  router.lan", "Address:  192.168.1.1", "", "Non-authoritative answer:", `Name:    ${host}`, `Addresses:  ${ip}`, "");
            ev("cmd_nslookup");
          } else out("", "Server:  router.lan", "Address:  192.168.1.1", "", `*** router.lan can't find ${host}: Non-existent domain`, "(Böyle bir alan adı yok ya da yanlış yazıldı.)", "");
          setExplain(EXPLAIN.nslookup);
        }
      } else if (name === "netstat") {
        out(
          "",
          "Active Connections",
          "",
          "  Proto  Local Address          Foreign Address        State",
          "  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING",
          "  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING",
          "  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING",
          "  TCP    192.168.1.10:51234     142.250.187.206:443    ESTABLISHED",
          "  TCP    192.168.1.10:51240     140.82.121.4:443       ESTABLISHED",
          "  TCP    192.168.1.10:51302     93.184.216.34:80       TIME_WAIT",
          "  UDP    0.0.0.0:53             *:*",
          "  UDP    192.168.1.10:137       *:*",
          ""
        );
        ev("cmd_netstat");
        setExplain(EXPLAIN.netstat);
      } else if (name === "arp") {
        out(
          "",
          "Interface: 192.168.1.10 --- 0x4",
          "  Internet Address      Physical Address      Type",
          "  192.168.1.1           a4-2b-b0-1c-9e-f1     dynamic",
          "  192.168.1.20          3c-52-82-7a-10-5d     dynamic",
          "  192.168.1.255         ff-ff-ff-ff-ff-ff     static",
          "  224.0.0.22            01-00-5e-00-00-16     static",
          ""
        );
        ev("cmd_arp");
        setExplain(EXPLAIN.arp);
      } else {
        out(`'${c}' is not recognized as an internal or external command.`, "(Yardım için 'help' yaz.)", "");
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const submit = (cmd: string) => {
    if (busy) return;
    setInput("");
    void run(cmd);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q} disabled={busy} onClick={() => submit(q)} className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 px-3 py-1.5 font-mono text-xs text-yellow-200 hover:bg-yellow-400/15 disabled:opacity-40">
            {q}
          </button>
        ))}
        <Btn variant="ghost" className="!py-1.5 text-xs" onClick={() => submit("help")} disabled={busy}>
          help
        </Btn>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900 px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="ml-3 font-mono text-xs text-zinc-400">Komut İstemi – AG CYBER LAB</span>
        </div>
        <div className="h-96 overflow-auto p-3 font-mono text-[13px] leading-relaxed text-zinc-200" onClick={() => document.getElementById("term-input")?.focus()}>
          {lines.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${l.startsWith(PROMPT) ? "text-yellow-300" : ""} ${l.startsWith("(") ? "text-sky-300" : ""}`}>
              {l || "\u00A0"}
            </div>
          ))}
          <div className="flex gap-2">
            <span className="text-yellow-300">{PROMPT}</span>
            <input
              id="term-input"
              autoFocus
              value={input}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(input);
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const n = Math.min(hist.length - 1, hi + 1);
                  if (hist[n]) {
                    setHi(n);
                    setInput(hist[n]);
                  }
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const n = hi - 1;
                  setHi(n);
                  setInput(n >= 0 ? hist[n] : "");
                }
              }}
              className="flex-1 bg-transparent text-white caret-yellow-400 outline-none"
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>

      {explain ? (
        <Card className="space-y-3 border-yellow-400/30">
          <div className="text-sm font-bold text-yellow-300">📘 {explain.cmd} komutu açıklaması</div>
          <div className="text-sm text-zinc-200">
            <b className="text-white">Ne işe yarar?</b> {explain.what}
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-white">Çıktıdaki önemli alanlar</div>
            <ul className="space-y-1 text-sm">
              {explain.fields.map(([k, v]) => (
                <li key={k} className="flex gap-2">
                  <code className="shrink-0 rounded bg-black/60 px-1.5 py-0.5 text-xs text-yellow-300">{k}</code>
                  <span className="text-zinc-300">{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <b>Ne öğrendin?</b> {explain.learned}
          </div>
        </Card>
      ) : (
        <p className="text-sm text-zinc-500">Bir komut çalıştırdığında burada komutun açıklamasını, çıktıdaki önemli alanları ve ne öğrendiğini göreceksin. ↑ tuşu önceki komutları getirir.</p>
      )}
    </div>
  );
}
