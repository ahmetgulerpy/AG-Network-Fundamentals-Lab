import { emptyLab, mkDevice, mkLink, type LabState } from "../lib/net";
import type { LabConfig } from "./types";

const L = (devices: ReturnType<typeof mkDevice>[], links: [string, string][], seq = 30): LabState => ({
  devices,
  links: links.map(([a, b], i) => mkLink(`k${i + 1}`, a, b)),
  seq,
});

export const labM1: LabConfig = {
  palette: ["pc", "server", "switch"],
  blank: false,
  initial: emptyLab,
  sample: () =>
    L(
      [
        mkDevice("pc", "pc1", "PC1", 200, 240, { ip: "192.168.1.10", gw: "192.168.1.1" }),
        mkDevice("switch", "sw1", "Switch1", 480, 240),
        mkDevice("pc", "pc2", "PC2", 760, 240, { ip: "192.168.1.11", gw: "192.168.1.1" }),
      ],
      [
        ["pc1", "sw1"],
        ["sw1", "pc2"],
      ]
    ),
  hint: "İpucu: Bilgisayar butonunu iki kez tıkla, sonra 'Kablo çek' aracıyla iki cihazı birleştir.",
  steps: ["Bir bilgisayar ekle (Bilgisayar butonuna tıkla).", "İkinci bir bilgisayar ekle.", "'Kablo çek' aracını seç; sırayla iki bilgisayara tıkla.", "Kaynak ve hedefi seç, 'Veri gönder' ile paketin gidişini izle."],
};

const homeSample = () =>
  L(
    [
      mkDevice("internet", "net", "İnternet", 70, 250),
      mkDevice("modem", "modem", "Modem", 230, 250),
      mkDevice("router", "router", "Router", 400, 250, { ip: "192.168.1.1" }),
      mkDevice("switch", "sw1", "Switch", 570, 250),
      mkDevice("ap", "ap1", "AP", 400, 90),
      mkDevice("pc", "pc1", "PC1", 780, 110, { ip: "192.168.1.10", gw: "192.168.1.1" }),
      mkDevice("pc", "pc2", "PC2", 800, 250, { ip: "192.168.1.11", gw: "192.168.1.1" }),
      mkDevice("pc", "pc3", "Laptop", 560, 90, { ip: "192.168.1.12", gw: "192.168.1.1" }),
      mkDevice("server", "srv", "Yazıcı Sunucusu", 780, 390, { ip: "192.168.1.200", gw: "192.168.1.1" }),
    ],
    [
      ["net", "modem"],
      ["modem", "router"],
      ["router", "sw1"],
      ["router", "ap1"],
      ["sw1", "pc1"],
      ["sw1", "pc2"],
      ["ap1", "pc3"],
      ["sw1", "srv"],
    ]
  );

export const labM2: LabConfig = {
  palette: ["internet", "modem", "router", "switch", "ap", "pc"],
  blank: false,
  initial: emptyLab,
  sample: homeSample,
  hint: "Sürükle-bırak yap, kablo çek. Zincir: İnternet → Modem → Router → Switch → Bilgisayar. Zorlanırsan 'Örnek ağı yükle'.",
  steps: ["İnternet, Modem, Router, Switch ve en az 2 bilgisayarı çalışma alanına yerleştir.", "Kablo aracıyla zinciri bağla.", "PC'den İnternet'e ping gönder; paketin yolunu izle.", "Router'ı (veya Modem'i) kapat, tekrar gönder ve farkı gözle."],
};

export const labM3: LabConfig = {
  palette: ["pc", "server", "switch", "router"],
  blank: true,
  initial: () =>
    L(
      [
        mkDevice("router", "router", "Router", 480, 110, { ip: "192.168.1.1" }),
        mkDevice("switch", "sw1", "Switch", 480, 270),
        mkDevice("pc", "pc1", "PC1", 250, 400),
        mkDevice("pc", "pc2", "PC2", 710, 400),
      ],
      [
        ["router", "sw1"],
        ["sw1", "pc1"],
        ["sw1", "pc2"],
      ]
    ),
  hint: "PC1'e tıkla, sağdaki panelden IP adresi yaz. DHCP için Router'ı seçip DHCP sunucusunu aç.",
  steps: ["PC1'e 192.168.1.10, PC2'ye 192.168.1.20 IP adresi ver; MAC adreslerine bak.", "Aralarında ping at ve adres tablosunu incele.", "PC2'ye de 192.168.1.10 ver: IP çakışmasını gör.", "Router'da DHCP'yi aç, PC'leri 'DHCP' moduna al; otomatik IP'leri izle."],
};

export const labM4: LabConfig = {
  palette: ["pc", "switch", "router"],
  blank: true,
  initial: () =>
    L(
      [
        mkDevice("pc", "pc1", "PC1", 110, 130),
        mkDevice("pc", "pc2", "PC2", 110, 360),
        mkDevice("switch", "swA", "Switch A", 300, 245),
        mkDevice("router", "router", "Router", 480, 245, { ip: "192.168.1.1", ip2: "192.168.2.1" }),
        mkDevice("switch", "swB", "Switch B", 660, 245),
        mkDevice("pc", "pc3", "PC3", 850, 245, { ip: "192.168.2.30" }),
      ],
      [
        ["pc1", "swA"],
        ["pc2", "swA"],
        ["swA", "router"],
        ["router", "swB"],
        ["swB", "pc3"],
      ]
    ),
  hint: "Sol ağ: 192.168.1.x (Router arayüzü 192.168.1.1) · Sağ ağ: 192.168.2.x (Router arayüzü 192.168.2.1)",
  steps: ["PC1 → 192.168.1.10, PC2 → 192.168.1.20; ikisinde de mask 255.255.255.0. Ping at.", "PC3 farklı ağda (192.168.2.30). PC1'den PC3'e ping at: neden olmadığını oku.", "PC1 gateway = 192.168.1.1 yaz, tekrar dene (hâlâ olmuyor mu? neden?).", "PC3 gateway = 192.168.2.1 yaz: iki yönlü yol tamamlanınca ping başarılı olur."],
};
