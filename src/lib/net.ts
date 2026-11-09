// Ağ simülasyon motoru: IP hesapları, yol bulma, ping mantığı, DHCP
export type DType = "pc" | "server" | "switch" | "router" | "modem" | "ap" | "firewall" | "internet";

export interface Device {
  id: string;
  type: DType;
  name: string;
  x: number;
  y: number;
  ip: string;
  mask: string;
  gw: string;
  ip2?: string; // router ikinci arayüz
  mac: string;
  on: boolean;
  dhcpMode?: boolean; // istemci DHCP'den IP alsın
  dhcpServer?: boolean; // router DHCP dağıtsın
  block?: boolean; // firewall trafiği engellesin
  lease?: "dhcp" | "apipa" | "static";
}
export interface Link {
  id: string;
  a: string;
  b: string;
  up: boolean;
}
export interface LabState {
  devices: Device[];
  links: Link[];
  seq: number;
}

export const TYPE_LABEL: Record<DType, string> = {
  pc: "Bilgisayar",
  server: "Sunucu",
  switch: "Switch",
  router: "Router",
  modem: "Modem",
  ap: "Access Point",
  firewall: "Firewall",
  internet: "İnternet",
};

export const hasIp = (t: DType) => t === "pc" || t === "server" || t === "router" || t === "internet";
export const isHost = (t: DType) => t === "pc" || t === "server";

export function isValidIp(ip: string): boolean {
  const p = ip.trim().split(".");
  if (p.length !== 4) return false;
  return p.every((x) => /^\d{1,3}$/.test(x) && Number(x) <= 255);
}
export function isValidMask(m: string): boolean {
  if (!isValidIp(m)) return false;
  const bin = toInt(m).toString(2).padStart(32, "0");
  return /^1*0*$/.test(bin);
}
export function toInt(ip: string): number {
  return ip.split(".").reduce((a, b) => ((a << 8) | Number(b)) >>> 0, 0) >>> 0;
}
export function toIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}
export function networkOf(ip: string, mask: string): string {
  return toIp((toInt(ip) & toInt(mask)) >>> 0);
}
export function broadcastOf(ip: string, mask: string): string {
  return toIp(((toInt(ip) & toInt(mask)) | (~toInt(mask) >>> 0)) >>> 0);
}
export function prefixOf(mask: string): number {
  return toInt(mask).toString(2).split("1").length - 1;
}
export function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function randomMac(): string {
  const h = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase();
  const first = (Math.floor(Math.random() * 64) * 4).toString(16).padStart(2, "0").toUpperCase();
  return `${first}:${h()}:${h()}:${h()}:${h()}:${h()}`;
}

export function mkDevice(type: DType, id: string, name: string, x: number, y: number, over: Partial<Device> = {}): Device {
  const base: Device = {
    id,
    type,
    name,
    x,
    y,
    ip: "",
    mask: hasIp(type) ? "255.255.255.0" : "",
    gw: "",
    mac: randomMac(),
    on: true,
    dhcpMode: false,
    lease: "static",
  };
  if (type === "internet") {
    base.ip = "8.8.8.8";
    base.mask = "255.0.0.0";
  }
  return { ...base, ...over };
}
export const mkLink = (id: string, a: string, b: string): Link => ({ id, a, b, up: true });

export const emptyLab = (): LabState => ({ devices: [], links: [], seq: 1 });

// ---------- Çakışma ----------
export function findConflicts(s: LabState): Set<string> {
  const map = new Map<string, string[]>();
  s.devices.forEach((d) => {
    if (!d.on || !hasIp(d.type) || d.type === "internet" || !isValidIp(d.ip)) return;
    map.set(d.ip, [...(map.get(d.ip) || []), d.id]);
  });
  const out = new Set<string>();
  map.forEach((ids) => {
    if (ids.length > 1) ids.forEach((i) => out.add(i));
  });
  return out;
}

// ---------- Yol bulma ----------
interface PathOpts {
  ignoreBlock?: boolean;
  ignoreOff?: boolean;
  ignoreCut?: boolean;
}
export function findPath(s: LabState, from: string, to: string, o: PathOpts = {}): string[] | null {
  const byId = new Map(s.devices.map((d) => [d.id, d]));
  const prev = new Map<string, string | null>([[from, null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    const curDev = byId.get(cur)!;
    // uç cihazlar (pc, server, internet) trafiği aktarmaz
    if (cur !== from && (curDev.type === "pc" || curDev.type === "server" || curDev.type === "internet")) continue;
    for (const l of s.links) {
      if (!l.up && !o.ignoreCut) continue;
      const nxt = l.a === cur ? l.b : l.b === cur ? l.a : null;
      if (!nxt || prev.has(nxt)) continue;
      const nd = byId.get(nxt);
      if (!nd) continue;
      if (!nd.on && !o.ignoreOff) continue;
      if (nd.type === "firewall" && nd.block && !o.ignoreBlock) continue;
      prev.set(nxt, cur);
      q.push(nxt);
    }
  }
  if (!prev.has(to)) return null;
  const path: string[] = [];
  let c: string | null = to;
  while (c) {
    path.unshift(c);
    c = prev.get(c) ?? null;
  }
  return path;
}

export interface SendResult {
  ok: boolean;
  code: string;
  path: string[];
  failAt?: string;
  back: boolean;
  title: string;
  lines: string[];
  events: string[];
}

const res = (r: Partial<SendResult> & Pick<SendResult, "ok" | "code" | "title" | "lines">): SendResult => ({
  path: [],
  back: false,
  events: [],
  ...r,
});

// ping / veri gönderimi simülasyonu
export function simulateSend(s: LabState, srcId: string, dstId: string, kind: "ping" | "data"): SendResult {
  const src = s.devices.find((d) => d.id === srcId);
  const dst = s.devices.find((d) => d.id === dstId);
  const verb = kind === "ping" ? "Ping" : "Veri paketi";
  if (!src || !dst) return res({ ok: false, code: "missing", title: "Cihaz seçilmedi", lines: ["Önce kaynak ve hedef cihazı seç."] });
  if (src.id === dst.id) return res({ ok: false, code: "self", title: "Kaynak ve hedef aynı", lines: ["Kendi kendine paket göndermenin anlamı yok. Farklı bir hedef seç."] });
  const head = `${verb}: ${src.name} → ${dst.name}`;
  if (!src.on)
    return res({ ok: false, code: "src_off", path: [src.id], failAt: src.id, title: head, lines: [`${src.name} kapalı. Kapalı bir cihaz paket gönderemez. Önce cihazı aç.`], events: ["fail_offline"] });

  const conflicts = findConflicts(s);
  if (!isValidIp(src.ip)) {
    const extra = src.dhcpMode ? " DHCP modundasın ama IP alınamadı: ağda çalışan bir DHCP sunucusu (router) yok ya da ulaşılamıyor." : " Cihaza bir IP adresi ver (ya da DHCP kullan).";
    return res({ ok: false, code: "no_ip", path: [src.id], failAt: src.id, title: head, lines: [`${src.name} cihazının geçerli bir IP adresi yok.${extra}`, "IP adresi olmayan cihaz ağda 'adressiz ev' gibidir: kimse ona paket gönderemez, o da gönderemez."], events: ["fail_no_ip"] });
  }
  if (!isValidIp(dst.ip))
    return res({ ok: false, code: "dst_no_ip", path: [src.id], failAt: src.id, title: head, lines: [`${dst.name} cihazının geçerli bir IP adresi yok; paketin gideceği adres belli değil.`], events: ["fail_no_ip"] });
  if (!isValidMask(src.mask))
    return res({ ok: false, code: "bad_mask", path: [src.id], failAt: src.id, title: head, lines: [`${src.name} için Subnet Mask geçersiz (örnek: 255.255.255.0).`] });

  if (conflicts.has(src.id) || conflicts.has(dst.id)) {
    const who = conflicts.has(src.id) ? src : dst;
    const other = s.devices.filter((d) => d.id !== who.id && d.on && d.ip === who.ip).map((d) => d.name).join(", ");
    return res({
      ok: false,
      code: "conflict",
      path: [src.id],
      failAt: who.id,
      title: head,
      lines: [`IP ÇAKIŞMASI! ${who.name} ve ${other} aynı IP adresini (${who.ip}) kullanıyor.`, "Aynı adreste iki ev olduğunu düşün: kargocu paketi hangisine bıraksın? Paketler karışır ve bağlantı güvenilmez olur.", "Çözüm: Cihazlardan birinin IP adresini değiştir."],
      events: ["conflict_seen", "fail_conflict"],
    });
  }

  const sameNet = isValidIp(dst.ip) && networkOf(src.ip, src.mask) === networkOf(dst.ip, src.mask);
  const lines: string[] = [];
  lines.push(`${src.name}: ${src.ip} (ağ: ${networkOf(src.ip, src.mask)})`);
  lines.push(`${dst.name}: ${dst.ip} → ${sameNet ? "aynı ağda, paket doğrudan gönderilir." : "FARKLI ağda, paket gateway'e (router) verilmelidir."}`);

  let route: string[] | null = null;
  let viaRouter: Device | undefined;

  if (!sameNet) {
    if (!isValidIp(src.gw)) {
      lines.push(`${src.name} cihazında Default Gateway tanımlı değil. Cihaz, ağ dışına çıkış kapısını bilmiyor.`);
      lines.push("Çözüm: Gateway alanına router'ın IP adresini yaz (örn. 192.168.1.1).");
      return res({ ok: false, code: "no_gateway", path: [src.id], failAt: src.id, title: head, lines, events: ["fail_gateway"] });
    }
    if (networkOf(src.gw, src.mask) !== networkOf(src.ip, src.mask)) {
      lines.push(`Gateway (${src.gw}) ${src.name} ile aynı ağda değil. Gateway, kendi ağındaki router'ın adresi olmalıdır.`);
      return res({ ok: false, code: "bad_gateway", path: [src.id], failAt: src.id, title: head, lines, events: ["fail_gateway"] });
    }
    const routers = s.devices.filter((d) => d.type === "router" && (d.ip === src.gw || d.ip2 === src.gw));
    if (!routers.length) {
      lines.push(`Gateway olarak yazılan ${src.gw} adresine sahip bir router bulunamadı.`);
      return res({ ok: false, code: "gateway_missing", path: [src.id], failAt: src.id, title: head, lines, events: ["fail_gateway"] });
    }
    for (const r of routers) {
      const p = findPath(s, src.id, r.id);
      if (p) {
        viaRouter = r;
        route = p;
        break;
      }
    }
    if (!viaRouter) {
      const r = routers[0];
      const diag = diagnose(s, src.id, r.id);
      lines.push(`Gateway (${r.name}) ağa bağlı görünmüyor veya ulaşılamıyor.`);
      lines.push(diag.text);
      return res({ ok: false, code: "gateway_unreachable", path: diag.path, failAt: diag.failAt, title: head, lines, events: diag.events });
    }
    lines.push(`Paket önce gateway'e (${viaRouter.name} – ${src.gw}) gönderilir.`);
    const p2 = findPath(s, viaRouter.id, dst.id);
    if (!p2) {
      const diag = diagnose(s, viaRouter.id, dst.id);
      lines.push(`Router'dan ${dst.name} cihazına giden yol kesik.`);
      lines.push(diag.text);
      const full = [...(route as string[]), ...diag.path.slice(1)];
      return res({ ok: false, code: diag.code, path: full, failAt: diag.failAt, title: head, lines, events: diag.events });
    }
    route = [...(route as string[]), ...p2.slice(1)];
  } else {
    route = findPath(s, src.id, dst.id);
    if (!route) {
      const diag = diagnose(s, src.id, dst.id);
      lines.push(diag.text);
      return res({ ok: false, code: diag.code, path: diag.path, failAt: diag.failAt, title: head, lines, events: diag.events });
    }
  }

  // Dönüş yolu: hedef cevap verebilmeli
  if (isHost(dst.type) && !(networkOf(dst.ip, dst.mask) === networkOf(src.ip, dst.mask)) && !isValidIp(dst.gw)) {
    lines.push(`Paket ${dst.name} cihazına ulaştı ama cevap dönemedi: ${dst.name} cihazında da Gateway tanımlı değil.`);
    lines.push("İletişim iki yönlüdür: gönderen de alan da dönüş yolunu bilmelidir.");
    return res({ ok: false, code: "reply_fail", path: route, failAt: dst.id, title: head, lines, events: ["fail_gateway", "fail_reply"] });
  }

  const names = route.map((id) => s.devices.find((d) => d.id === id)!.name);
  lines.push(`Paketin yolu: ${names.join(" → ")}`);
  lines.push(kind === "ping" ? `${dst.name} cevap verdi (Echo Reply). Bağlantı çalışıyor ✔` : `${dst.name} veriyi aldı ✔`);
  const events = ["packet_ok", `ok:${src.id}:${dst.id}`];
  if (dst.type === "internet") events.push("ok_internet");
  events.push(sameNet ? "ok_same" : "ok_cross");
  if (src.type === "pc" && dst.type === "pc") events.push("ok_pc_pc");
  return res({ ok: true, code: "ok", path: route, back: true, title: head, lines, events });
}

function diagnose(s: LabState, a: string, b: string): { text: string; path: string[]; failAt?: string; code: string; events: string[] } {
  const name = (id: string) => s.devices.find((d) => d.id === id)?.name ?? id;
  const p1 = findPath(s, a, b, { ignoreBlock: true });
  if (p1) {
    const fw = p1.find((id) => s.devices.find((d) => d.id === id)?.type === "firewall" && s.devices.find((d) => d.id === id)?.block);
    if (fw) {
      const i = p1.indexOf(fw);
      return { text: `${name(fw)} (Firewall) trafiği engelliyor. Firewall güvenlik görevlisi gibidir; kuralı "izin ver" yapmadıkça paket geçemez.`, path: p1.slice(0, i + 1), failAt: fw, code: "firewall", events: ["fail_firewall"] };
    }
  }
  const p2 = findPath(s, a, b, { ignoreOff: true, ignoreBlock: true });
  if (p2) {
    const off = p2.find((id) => !s.devices.find((d) => d.id === id)!.on);
    if (off) {
      const i = p2.indexOf(off);
      return { text: `${name(off)} kapalı (devre dışı). Yol üzerindeki cihaz çalışmazsa paket ilerleyemez.`, path: p2.slice(0, i + 1), failAt: off, code: "device_off", events: ["fail_offline"] };
    }
  }
  const p3 = findPath(s, a, b, { ignoreCut: true, ignoreOff: true, ignoreBlock: true });
  if (p3) {
    for (let i = 0; i < p3.length - 1; i++) {
      const l = s.links.find((l) => (l.a === p3[i] && l.b === p3[i + 1]) || (l.b === p3[i] && l.a === p3[i + 1]));
      if (l && !l.up) return { text: `${name(p3[i])} ile ${name(p3[i + 1])} arasındaki kablo çıkarılmış (bağlantı kopuk).`, path: p3.slice(0, i + 1), failAt: p3[i], code: "cable_cut", events: ["fail_offline"] };
    }
  }
  return { text: `${name(a)} ile ${name(b)} arasında hiçbir kablo/cihaz yolu yok. Cihazlar birbirine (switch/router üzerinden) bağlı değil. Önce kabloyla bağla.`, path: [a], failAt: a, code: "no_route", events: ["fail_noroute"] };
}

// ---------- DHCP ----------
export function renewDhcp(s: LabState): { state: LabState; assigned: number; messages: string[] } {
  const devices = s.devices.map((d) => ({ ...d }));
  const st: LabState = { ...s, devices };
  const servers = devices.filter((d) => d.type === "router" && d.dhcpServer && d.on && isValidIp(d.ip));
  const messages: string[] = [];
  let assigned = 0;
  for (const c of devices) {
    if (!isHost(c.type) || !c.dhcpMode) continue;
    let server: Device | undefined;
    if (c.on) server = servers.find((r) => findPath(st, c.id, r.id));
    if (server) {
      const net = networkOf(server.ip, server.mask || "255.255.255.0");
      const base = toInt(net);
      const used = new Set(devices.filter((d) => d.id !== c.id && isValidIp(d.ip)).map((d) => d.ip));
      let ip = c.lease === "dhcp" && isValidIp(c.ip) && networkOf(c.ip, "255.255.255.0") === net && !used.has(c.ip) ? c.ip : "";
      for (let i = 100; !ip && i < 200; i++) {
        const cand = toIp(base + i);
        if (!used.has(cand)) ip = cand;
      }
      c.ip = ip;
      c.mask = "255.255.255.0";
      c.gw = server.ip;
      c.lease = "dhcp";
      assigned++;
      messages.push(`${c.name} → ${ip} (DHCP: ${server.name})`);
    } else if (c.on) {
      c.ip = `169.254.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
      c.mask = "255.255.0.0";
      c.gw = "";
      c.lease = "apipa";
      messages.push(`${c.name} → DHCP sunucusu bulunamadı, kendi kendine ${c.ip} (APIPA) adresini aldı. Bu adres internete çıkamaz.`);
    }
  }
  return { state: st, assigned, messages };
}

// Yeni cihaz için varsayılan ayarlar
export function nextDefaults(s: LabState, type: DType, blank: boolean): Partial<Device> {
  if (type === "internet") return {};
  if (type === "router") {
    const used = new Set(s.devices.map((d) => d.ip));
    for (let n = 1; n < 50; n++) {
      const ip = `192.168.${n}.1`;
      if (!used.has(ip)) return { ip, mask: "255.255.255.0" };
    }
    return {};
  }
  if (blank || !hasIp(type)) return {};
  const used = new Set(s.devices.map((d) => d.ip));
  const start = type === "server" ? 200 : 10;
  for (let n = start; n < start + 40; n++) {
    const ip = `192.168.1.${n}`;
    if (!used.has(ip)) return { ip, mask: "255.255.255.0", gw: "192.168.1.1" };
  }
  return {};
}

export function addDevice(s: LabState, type: DType, x: number, y: number, blank: boolean): { state: LabState; id: string } {
  const n = s.seq;
  const countOfType = s.devices.filter((d) => d.type === type).length + 1;
  const names: Record<DType, string> = { pc: "PC", server: "Sunucu", switch: "Switch", router: "Router", modem: "Modem", ap: "AP", firewall: "Firewall", internet: "İnternet" };
  const id = `${type}${n}`;
  const dev = mkDevice(type, id, `${names[type]}${type === "internet" ? "" : countOfType}`, x, y, nextDefaults(s, type, blank));
  return { state: { ...s, devices: [...s.devices, dev], seq: n + 1 }, id };
}

export function componentOf(s: LabState, start: string): Set<string> {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    for (const l of s.links) {
      const n = l.a === c ? l.b : l.b === c ? l.a : null;
      if (n && !seen.has(n)) {
        seen.add(n);
        q.push(n);
      }
    }
  }
  return seen;
}
