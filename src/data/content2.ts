import type { ModuleDef, TaskCtx } from "./types";
import { labM4 } from "./labs";

const has = (c: TaskCtx, e: string) => c.events.includes(e);
const dev = (c: TaskCtx, id: string) => c.lab?.devices.find((d) => d.id === id);

export const m4: ModuleDef = {
  id: "m4",
  no: 4,
  title: "Subnet Mask ve Gateway",
  tagline: "Aynı mahallede miyiz, yoksa başka şehirde mi?",
  intro: "Mahalle içinde komşuna yürüyerek gidersin. Başka şehirdeki birine ise önce otogara (çıkış kapısına) gitmen gerekir. Bilgisayarlar da hedefin 'aynı mahallede' olup olmadığına karar verir. Bu kararı Subnet Mask ile verir, çıkış kapısı ise Gateway'dir.",
  topics: [
    { title: "Subnet Mask nedir?", what: "IP adresinin hangi kısmının 'ağ', hangi kısmının 'cihaz' olduğunu söyleyen sayıdır. Örn: 255.255.255.0", why: "Bir cihazın hedefin aynı ağda olup olmadığını anlaması için.", life: "Adresin 'mahalle' ve 'kapı numarası' kısımlarını ayıran çizgi gibi: 'Atatürk Mah.' mahalle (ağ), 'No: 10' kapı (cihaz).", tech: "255.255.255.0 → ilk 3 sayı ağ, son sayı cihazdır. 192.168.1.10 ve 192.168.1.20 aynı ağdadır (192.168.1.x)." },
    { title: "Subnet Mask neden kullanılır?", what: "Büyük ağı küçük, yönetilebilir parçalara ayırmak ve ağ ile cihaz kısmını belirlemek için kullanılır.", why: "Ağı düzenli tutar, trafiği azaltır, güvenliği artırır.", life: "Büyük bir şehri mahallelere bölmek gibi: her mahallenin kendi düzeni vardır.", tech: "Bilgisayar, kendi IP'si ile hedef IP'yi mask ile karşılaştırır. Ağ kısmı aynıysa doğrudan gönderir, değilse gateway'e verir." },
    { title: "Default Gateway nedir?", what: "Kendi ağının dışına çıkmak için kullanılan kapıdır (genellikle router'ın IP adresi).", why: "Farklı ağdaki veya internetteki cihazlara ulaşabilmek için.", life: "Mahalleden çıkış kapısı / otogar. Başka şehre gitmek isteyen herkes önce oraya gider.", tech: "Örn. 192.168.1.1. Hedef farklı ağdaysa paket gateway'e gönderilir, gerisini router halleder." },
    { title: "Ağ adresi ve cihaz adresi", what: "Ağ adresi mahallenin adıdır (192.168.1.0), cihaz adresi kapı numarasıdır (…10).", why: "Doğru ağa ve o ağdaki doğru cihaza ulaşmak için iki bilgi gerekir.", life: "Adres: 'Gül Mahallesi (ağ), No:10 (cihaz)'.", tech: "192.168.1.10 + 255.255.255.0 → Ağ adresi: 192.168.1.0, cihaz kısmı: 10, yayın (broadcast): 192.168.1.255." },
    { title: "Aynı ağdaki cihazlar nasıl anlaşır?", what: "Aynı ağdaki cihazlar gateway'e gerek duymadan doğrudan konuşur.", why: "Hızlı ve basittir.", life: "Aynı apartmandaki komşuya merdivenle çıkıp zili çalarsın.", tech: "Cihaz hedefin MAC adresini ARP ile öğrenir, paketi switch aracılığıyla doğrudan teslim eder." },
    { title: "Farklı ağdaki cihazlara nasıl ulaşılır?", what: "Paket önce Default Gateway'e gönderilir; router onu doğru ağa yönlendirir.", why: "Ağlar birbirinden ayrı olduğu için aralarında bir 'köprü' gerekir.", life: "Başka şehirdeki arkadaşa mektup atmak: önce postaneye (gateway) verirsin, postane yönlendirir.", tech: "Gateway yoksa cihaz 'bu ağın dışına nasıl çıkarım?' sorusunu cevaplayamaz ve iletişim kurulmaz. Dönüş için karşı tarafın da gateway'i olmalıdır.", tip: "İletişim iki yönlüdür: gidiş yolu kadar dönüş yolu da hazır olmalı." },
  ],
  instructor: {
    start: "Tahtaya '192.168.1.10' yaz ve 'Bu adres iki parça içeriyor: mahalle ve kapı numarası' de. Mask'in bu iki parçayı ayırdığını göster.",
    example: "Mahalle/kapı numarası ve otogar benzetmesi. Aynı mahalle = doğrudan, farklı mahalle = otogar (gateway).",
    emphasize: ["255.255.255.0 = ilk 3 sayı ağ.", "Aynı ağ → gateway gerekmez.", "Farklı ağ → Gateway şart.", "Gateway, kendi ağındaki router adresidir."],
    confusions: ["Gateway'in hedef cihazın adresi olduğu sanılır; oysa çıkış kapısıdır.", "Gateway'i farklı ağdan bir adres yapmak (örn. 192.168.2.1'i PC1'e yazmak) hatadır.", "Mask'in ikili sistemle zorunlu anlatılacağı sanılır; ilk sürümde sadece /24 yeterlidir."],
    summary: "'Mask hedefin aynı mahallede olup olmadığını söyler. Aynı mahalledeyse direkt gidilir, değilse paket gateway'e verilir.'",
  },
  labKind: "network",
  lab: labM4,
  tasks: [
    {
      id: "t1",
      title: "İki bilgisayarı aynı ağa koy",
      desc: "PC1 = 192.168.1.10, PC2 = 192.168.1.20, ikisinde de Subnet Mask 255.255.255.0 ayarla ve PC1'den PC2'ye ping at.",
      hint: "PC1'e tıkla, sağ panelde IP ve Mask yaz. Sonra PC2 için tekrarla. Ping için Kaynak=PC1, Hedef=PC2.",
      check: (c) => {
        const a = dev(c, "pc1");
        const b = dev(c, "pc2");
        if (!a || !b) return { ok: false, msg: "PC1 veya PC2 silinmiş. 'Sıfırla' ile başlangıç ağına dön." };
        if (a.ip !== "192.168.1.10") return { ok: false, msg: `PC1 IP adresi 192.168.1.10 olmalı (şu an: ${a.ip || "boş"}).` };
        if (b.ip !== "192.168.1.20") return { ok: false, msg: `PC2 IP adresi 192.168.1.20 olmalı (şu an: ${b.ip || "boş"}).` };
        if (a.mask !== "255.255.255.0" || b.mask !== "255.255.255.0") return { ok: false, msg: "İki bilgisayarda da Subnet Mask 255.255.255.0 olmalı." };
        if (!has(c, "ok:pc1:pc2") && !has(c, "ok:pc2:pc1")) return { ok: false, msg: "Ayarlar doğru. Şimdi PC1'den PC2'ye ping at: ikisi de 192.168.1.x ağında, gateway gerekmeden konuşmalılar." };
        return { ok: true, msg: "Aynı ağdalar (192.168.1.0): ping başarılı ve gateway'e hiç ihtiyaç duyulmadı." };
      },
    },
    {
      id: "t2",
      title: "Gateway olmadan farklı ağa ulaşmayı dene",
      desc: "PC1'in Gateway alanını boş bırak ve PC3'e (192.168.2.30) ping at. Neden başarısız olduğunu günlükten oku.",
      hint: "Kaynak=PC1, Hedef=PC3. PC1 IP'si ayarlı olmalı, Gateway boş kalmalı.",
      check: (c) => (has(c, "fail_gateway") ? { ok: true, msg: "Doğru gözlem: PC3 farklı ağda (192.168.2.x). PC1 ağ dışına çıkış kapısını (gateway) bilmediği için paketi gönderemedi." } : { ok: false, msg: "Henüz gateway yüzünden başarısız bir deneme yok. PC1 IP'sini ayarla, Gateway'i boş bırak ve PC3'e ping at." }),
    },
    {
      id: "t3",
      title: "Gateway ekle ve tekrar dene",
      desc: "PC1'in Gateway'ine 192.168.1.1, PC3'ün Gateway'ine 192.168.2.1 yaz; PC1'den PC3'e tekrar ping at.",
      hint: "Gidiş için PC1'in gateway'i, dönüş için PC3'ün gateway'i gerekir. Router iki ağa da bağlı: 192.168.1.1 ve 192.168.2.1.",
      check: (c) => {
        const a = dev(c, "pc1");
        const z = dev(c, "pc3");
        if (!a || !z) return { ok: false, msg: "PC1 veya PC3 silinmiş. Sıfırla." };
        if (a.gw !== "192.168.1.1") return { ok: false, msg: `PC1 Gateway = 192.168.1.1 olmalı (router'ın PC1 tarafındaki adresi). Şu an: ${a.gw || "boş"}.` };
        if (z.gw !== "192.168.2.1") return { ok: false, msg: `PC3 Gateway = 192.168.2.1 olmalı (router'ın PC3 tarafındaki adresi). Şu an: ${z.gw || "boş"}. Cevabın dönebilmesi için karşı tarafın da çıkış kapısı olmalı.` };
        if (!has(c, "ok:pc1:pc3") && !has(c, "ok:pc3:pc1")) return { ok: false, msg: "Gateway'ler doğru! Şimdi PC1'den PC3'e ping at ve paketin router üzerinden geçişini izle." };
        return { ok: true, msg: "Başardın! Paket PC1 → Switch A → Router → Switch B → PC3 yolunu izledi. Gateway farklı ağlar arasındaki köprüdür." };
      },
    },
  ],
  quiz: [
    { kind: "mc", q: "192.168.1.10 ve 192.168.1.20 adresleri 255.255.255.0 mask ile aynı ağda mıdır?", options: ["Evet, ağ kısmı 192.168.1", "Hayır, son sayılar farklı", "Sadece router varsa", "Bilinemez"], answer: 0, explain: "Mask 255.255.255.0 ilk üç sayının ağ kısmı olduğunu söyler. Her ikisi de 192.168.1 olduğu için aynı ağdadır." },
    { kind: "tf", q: "Aynı ağdaki iki bilgisayarın konuşması için Default Gateway şarttır.", options: ["Doğru", "Yanlış"], answer: 1, explain: "Aynı ağdaki cihazlar doğrudan konuşur. Gateway sadece ağ dışına çıkarken gerekir." },
    { kind: "mc", q: "Default Gateway genellikle hangi cihazın IP adresidir?", options: ["Switch", "Router", "Yazıcı", "Hedef bilgisayar"], answer: 1, explain: "Gateway, ağdan çıkış kapısı olan router'ın o ağdaki adresidir." },
    { kind: "scenario", q: "PC1 (192.168.1.10) PC3'e (192.168.2.30) ping atamıyor, PC1'de Gateway boş. Ne yapmalısın?", options: ["Mask'i 0.0.0.0 yap", "PC1'e Gateway olarak 192.168.1.1 yaz", "PC3'ü kapat", "Kabloyu değiştir"], answer: 1, explain: "Farklı ağdaki hedefe çıkmak için PC1 'çıkış kapısını' bilmelidir. Karşı tarafın da (PC3) gateway'i olmalıdır ki cevap dönebilsin." },
    { kind: "mc", q: "192.168.1.10 / 255.255.255.0 için ağ adresi hangisidir?", options: ["192.168.1.255", "192.168.1.0", "192.168.0.0", "192.168.1.10"], answer: 1, explain: "Cihaz kısmı (son sayı) sıfırlanınca ağ adresi bulunur: 192.168.1.0. 192.168.1.255 ise yayın (broadcast) adresidir." },
  ],
};

export const m5: ModuleDef = {
  id: "m5",
  no: 5,
  title: "Port ve Protokoller",
  tagline: "Apartmanın hangi kapısı, hangi dil?",
  intro: "Bir apartmana (sunucu) kargo gelince sadece apartman adresi yetmez; hangi daireye (port) gideceği de gerekir. Ayrıca konuşmanın hangi dilde (protokol) yapılacağı da önemlidir. Bu modülde 'kapı numaralarını' ve 'konuşma kurallarını' öğreneceksin.",
  topics: [
    { title: "Port nedir?", what: "Bir cihazdaki farklı servisleri ayırt eden 0–65535 arası kapı numarasıdır.", why: "Aynı bilgisayarda hem web sitesi hem uzak bağlantı hem e-posta çalışabilir. Veri hangisine gidecek?", life: "Apartman = bilgisayar (IP), daire numarası = port. Kargo hem apartman adresine hem daire numarasına bakar.", tech: "Bağlantı: IP:port şeklinde yazılır, örn. 93.184.216.34:443." },
    { title: "Protokol nedir?", what: "İki cihazın nasıl konuşacağını belirleyen kurallar bütünüdür.", why: "Herkes farklı dilde konuşursa kimse anlaşamaz; ortak kurallar gerekir.", life: "Telefonla konuşurken önce 'Alo' denir, sırayla konuşulur. Bu görgü kuralları protokoldür.", tech: "HTTP, FTP, DNS, SSH gibi her biri belirli işi yapan kurallar setidir." },
    { title: "TCP nedir?", what: "Güvenilir, bağlantı kurarak çalışan taşıma protokolüdür.", why: "Verinin eksiksiz ve sıralı ulaşması gerektiği durumlar için (web, e-posta, dosya).", life: "Taahhütlü kargo: teslim edildiğine dair imza alınır, kaybolursa tekrar gönderilir.", tech: "Önce 3'lü el sıkışma: SYN → SYN-ACK → ACK. Sonra veri gönderilir, her parça onaylanır." },
    { title: "UDP nedir?", what: "Hızlı ama garanti vermeyen, bağlantısız taşıma protokolüdür.", why: "Küçük kayıpların sorun olmadığı ve hızın önemli olduğu durumlar için (canlı yayın, oyun, DNS).", life: "Posta kutusuna broşür atmak: hızlı, ama okundu mu bilinmez.", tech: "El sıkışma yok, onay yok, yeniden gönderme yok. Başlığı küçüktür, bu yüzden hafiftir." },
    { title: "TCP ve UDP arasındaki fark", what: "TCP güvenilir ama yavaş, UDP hızlı ama garantisiz.", why: "Uygulama ihtiyacına göre doğru olanı seçmek için.", life: "TCP: imzalı kargo. UDP: broşür dağıtımı.", tech: "TCP: bağlantı + onay + sıralama. UDP: sadece gönder. Dosya indirirken TCP, canlı maçta UDP daha uygundur.", tip: "UDP 'kötü' değildir; sadece farklı iş içindir." },
    { title: "HTTP ve HTTPS", what: "HTTP web sayfalarının taşındığı protokoldür (port 80). HTTPS onun şifreli hâlidir (port 443).", why: "Web sayfalarını istemek ve göndermek için; HTTPS ise bilgilerin başkaları tarafından okunmaması için.", life: "HTTP: açık kartpostal, herkes okuyabilir. HTTPS: mühürlü zarf, sadece alıcı açabilir.", tech: "HTTPS = HTTP + TLS şifreleme. Tarayıcıdaki kilit simgesi HTTPS'in işaretidir. Şifre girilen sitelerde HTTPS şarttır." },
    { title: "DNS", what: "Alan adlarını (google.com) IP adreslerine çeviren sistemdir (port 53, genelde UDP).", why: "İnsanlar isimleri, bilgisayarlar sayıları hatırlar.", life: "Telefon rehberi: 'Ahmet' ismini aratıp numarasını bulursun.", tech: "Tarayıcı önce DNS sunucusuna 'google.com kim?' diye sorar, IP gelince o IP'ye bağlanır." },
    { title: "FTP ve SSH", what: "FTP dosya aktarımı için (port 21), SSH ise güvenli uzak terminal bağlantısı için (port 22) kullanılır.", why: "Uzaktaki sunucuya dosya yüklemek veya komut çalıştırmak için.", life: "FTP: kargo deposuna koli bırakmak. SSH: uzaktaki depoya özel, şifreli bir telefon hattıyla bağlanıp yönetmek.", tech: "FTP şifreleri düz metin gönderir (güvensiz). SSH baştan şifrelidir ve tercih edilir. RDP (3389) ise Windows uzak masaüstüdür." },
    { title: "Bilmen gereken temel portlar", what: "FTP 21 · SSH 22 · DNS 53 · HTTP 80 · HTTPS 443 · RDP 3389", why: "Firewall kurallarında, sorun gidermede ve güvenlikte bu numaralar sık geçer.", life: "Bir apartmanın en çok kullanılan daire numaralarını bilmek gibi.", tech: "Bu numaralar 'well-known port' (bilinen port) denir ve 0–1023 arasındadır (RDP hariç). Test için laboratuvarı kullan." },
  ],
  instructor: {
    start: "Apartman benzetmesiyle başla: 'Bir kargocu sadece apartmanın adresini bilirse ne olur?' Cevap: daire numarasını da bilmeli. Bu port'tur.",
    example: "Port = daire no, TCP = imzalı kargo, UDP = broşür, HTTPS = mühürlü zarf, DNS = telefon rehberi.",
    emphasize: ["Port numaralarını tablodan ezberletme, laboratuvarda kullandıkça öğrensinler.", "TCP: güvenilir; UDP: hızlı.", "HTTPS = HTTP + şifreleme."],
    confusions: ["Port'un fiziksel bir soket olduğu sanılır; yazılımsal numaradır.", "TCP'nin her zaman daha iyi olduğu sanılır.", "HTTPS'in site güvenli demek olduğu sanılır: sadece bağlantı şifrelidir, site kötü niyetli olabilir."],
    summary: "'IP cihazı, port servisi gösterir. TCP güvenilir, UDP hızlıdır. HTTP 80, HTTPS 443, SSH 22, FTP 21, DNS 53, RDP 3389.'",
  },
  labKind: "protocol",
  tasks: [
    {
      id: "t1",
      title: "HTTP ve HTTPS bağlantısı kur",
      desc: "Laboratuvarda hem HTTP (80) hem HTTPS (443) bağlantısını başlat ve TCP el sıkışmasını izle. İkisini de tamamla.",
      hint: "1) Bağlantı kur sekmesinde HTTP kartını seç, başlat. Sonra HTTPS ile tekrarla.",
      check: (c) => {
        const h = has(c, "svc_http");
        const s = has(c, "svc_https");
        if (h && s) return { ok: true, msg: "İkisini de yaptın! Fark: HTTPS'te TCP el sıkışmasından sonra bir de TLS şifreleme anlaşması var." };
        if (!h && !s) return { ok: false, msg: "Henüz bir bağlantı tamamlamadın. HTTP'yi seçip bağlantıyı başlat ve animasyonun bitmesini bekle." };
        return { ok: false, msg: h ? "HTTP tamam, şimdi HTTPS (443) bağlantısını da kur." : "HTTPS tamam, şimdi HTTP (80) bağlantısını da kur." };
      },
    },
    {
      id: "t2",
      title: "UDP ile örnek veri gönder",
      desc: "UDP sekmesinde bir mesajı gönder. Paket kaybı açıkken kaybolan paketi gözlemle.",
      hint: "'2) UDP ile veri gönder' sekmesinde mesaj yaz ve gönder. Animasyonun sonuna kadar izle.",
      check: (c) => (has(c, "udp_loss") ? { ok: true, msg: "UDP paketi kaybolunca hiç yeniden gönderilmedi ve mesaj eksik ulaştı. Hız için verilen bir ödünüdür." } : has(c, "udp_sent") ? { ok: true, msg: "UDP verisi el sıkışmasız gönderildi. (Bir de 'Paket kaybı olsun' seçeneğiyle dene!)" } : { ok: false, msg: "UDP gönderimi tamamlanmadı. UDP sekmesinde 'UDP ile gönder'e bas ve animasyon bitene kadar bekle." }),
    },
    {
      id: "t3",
      title: "DNS sorgusunu çalıştır",
      desc: "Bir alan adını (örn. google.com) sorgula ve IP adresine nasıl dönüştüğünü izle.",
      hint: "'3) DNS sorgusu' sekmesinde bir alan adı seçip 'DNS sorgusu yap'a bas.",
      check: (c) => (has(c, "dns_resolved") ? { ok: true, msg: "İsim IP'ye çevrildi. DNS olmasaydı her siteyi IP numarasıyla yazmak zorunda kalırdık." } : { ok: false, msg: "Henüz tamamlanmış bir DNS sorgusu yok. Sorguyu başlat ve animasyonun sonunu bekle." }),
    },
    {
      id: "t4",
      title: "Kapalı bir portu dene",
      desc: "Sunucuda bir portu 'Kapalı' yap ve o servise bağlanmayı dene. Ne olduğunu gözlemle.",
      hint: "Port kartında '🔓 Açık' butonuna bas → '🔒 Kapalı' olsun. Sonra o servisin bağlantısını başlat.",
      check: (c) => (has(c, "port_closed") ? { ok: true, msg: "Port kapalıyken sunucu bağlantıyı reddetti (RST). Firewall kuralları bu mantıkla çalışır: kapı kapalıysa giriş yok." } : { ok: false, msg: "Henüz kapalı bir porta bağlanmayı denemedin." }),
    },
  ],
  quiz: [
    { kind: "mc", q: "HTTPS hangi port numarasını kullanır?", options: ["80", "21", "443", "22"], answer: 2, explain: "HTTPS 443, HTTP 80, FTP 21, SSH 22'dir." },
    { kind: "tf", q: "UDP, verinin karşıya ulaştığını garanti eder.", options: ["Doğru", "Yanlış"], answer: 1, explain: "UDP onay mekanizması içermez; paket kaybolursa yeniden göndermez. Bu yüzden hızlıdır ama garanti vermez." },
    { kind: "mc", q: "TCP bağlantısı kurulurken yapılan 3'lü el sıkışma sırası hangisidir?", options: ["ACK → SYN → SYN-ACK", "SYN → SYN-ACK → ACK", "SYN → ACK → FIN", "GET → 200 → OK"], answer: 1, explain: "İstemci SYN gönderir, sunucu SYN-ACK ile cevaplar, istemci ACK ile onaylar." },
    { kind: "scenario", q: "Canlı bir maç yayını izliyorsun. Bir iki paket kaybolsa da yayın akmaya devam etmeli. Hangi protokol daha uygundur?", options: ["TCP", "UDP", "FTP", "SSH"], answer: 1, explain: "Canlı yayında hız önemlidir; eski kaybolmuş paketi tekrar beklemek yayını kasar. UDP bunun için uygundur." },
    { kind: "mc", q: "Uzak masaüstü (RDP) için kullanılan port hangisidir?", options: ["22", "53", "3389", "80"], answer: 2, explain: "RDP varsayılan olarak 3389 portunu kullanır. SSH ise 22'dir." },
  ],
};

export const m6: ModuleDef = {
  id: "m6",
  no: 6,
  title: "DNS ve DHCP",
  tagline: "İsimleri adrese, cihazları adreslere bağlayan sistemler",
  intro: "Bir otele girip oda istiyorsun (DHCP) ve rehberden bir arkadaşının numarasını arıyorsun (DNS). Bu iki servis ağın günlük hayatı kolaylaştıran sessiz kahramanlarıdır.",
  topics: [
    { title: "DNS nedir?", what: "Alan adlarını (google.com) IP adreslerine çeviren sistemdir.", why: "İnsanlar sayıları değil isimleri hatırlar.", life: "Telefon rehberi: ismi yazarsın, numarayı bulursun.", tech: "DNS sunucusu 'isim → IP' kayıtlarını tutar. İstemci UDP 53 üzerinden sorar." },
    { title: "DNS neden gereklidir?", what: "DNS olmasa her siteye IP numarasıyla girmek zorunda kalırdık.", why: "Sitelerin IP'si değişebilir, isim sabit kalır. Kullanım kolaylığı sağlar.", life: "Arkadaşının yeni numarası olsa da rehberde adı aynı kalır.", tech: "Site taşınıp IP değişince sadece DNS kaydı güncellenir; kullanıcılar fark etmez." },
    { title: "Sitenin IP adresi nasıl bulunur?", what: "Tarayıcı → yerel DNS sunucusu → (gerekirse) Kök, TLD, yetkili DNS → IP cevabı.", why: "Hiçbir sunucu dünyadaki tüm kayıtları bilmez; sorular zincir hâlinde çözülür.", life: "Rehberde yoksa 'şehir rehberine', oradan 'mahalle muhtarına' sorulur.", tech: "Sonuç önbellekte (cache) tutulur; aynı site ikinci kez çok hızlı çözülür." },
    { title: "DHCP nedir?", what: "Cihazlara otomatik IP, Subnet Mask, Gateway ve DNS bilgisi veren servistir.", why: "Elle ayar yapma zahmetini ve IP çakışması riskini ortadan kaldırır.", life: "Otel resepsiyonu: müşteriye boş bir oda verir; kalma süresi dolunca oda başkasına verilir.", tech: "Router genellikle DHCP sunucusudur. Adres havuzundan kira (lease) süresiyle IP verir." },
    { title: "DHCP cihazlara nasıl IP dağıtır?", what: "Cihaz 'bana adres lazım' diye bağırır, sunucu havuzdan birini seçip önerir.", why: "Aynı adresin iki cihaza verilmemesi için sunucu hangi adresin kullanıldığını takip eder.", life: "Resepsiyon, oda listesine bakarak boş odayı verir.", tech: "Cevap alınamazsa cihaz 169.254.x.x (APIPA) adresi alır. Bu, 'DHCP çalışmıyor' işaretidir." },
    { title: "DHCP DORA aşamaları", what: "Discover → Offer → Request → Acknowledge. 4 adımda IP alınır.", why: "Birden fazla DHCP sunucusu olsa bile düzenli ve çakışmasız dağıtım için.", life: "1) 'Oda var mı?' 2) 'Şu oda var.' 3) 'Tamam o olsun.' 4) 'İşte anahtarın.'", tech: "İlk iki mesaj yayın (broadcast) olarak gider çünkü istemcinin henüz IP'si yoktur (0.0.0.0).", tip: "DORA'yı ezberlemek için baş harfleri kullan: D-O-R-A." },
  ],
  instructor: {
    start: "'Telefona numarayı hatırlıyor musun yoksa ismi mi?' diye sor. Rehber fikrini buradan DNS'e bağla. DHCP için de otel resepsiyonu benzetmesini kullan.",
    example: "DNS = telefon rehberi. DHCP = otel resepsiyonu (DORA = 4 adımlık oda alma).",
    emphasize: ["DNS isim → IP çevirir.", "DHCP IP + gateway + DNS dağıtır.", "DORA: 4 adım, baş harfler."],
    confusions: ["DNS ile DHCP birbirine karıştırılır.", "DNS sorgusunun tek sunucuya gittiği sanılır.", "169.254.x.x adresi 'normal' sanılır."],
    summary: "'DHCP bana adres verir, DNS bana isimden adresi bulur. İkisi de sayesinde ağı elle yapılandırmak zorunda kalmam.'",
  },
  labKind: "dhcpdns",
  tasks: [
    {
      id: "t1",
      title: "DHCP DORA'yı gerçekleştir",
      desc: "DHCP sekmesinde 'Otomatik IP iste' butonuna bas ve 4 adımı sonuna kadar izle.",
      hint: "DHCP sunucusu AÇIK olsun, 'Otomatik IP iste (DHCP)' butonuna bas ve animasyonun bitmesini bekle.",
      check: (c) => (has(c, "dhcp_dora_done") ? { ok: true, msg: "Bilgisayar Discover → Offer → Request → Acknowledge adımlarıyla otomatik IP aldı." } : { ok: false, msg: "DORA tamamlanmadı. Sunucu AÇIK olmalı ve animasyon sonuna kadar izlenmeli." }),
    },
    {
      id: "t2",
      title: "Bir alan adını IP'ye çevir",
      desc: "DNS sekmesinde bir alan adı gir (örn. google.com) ve DNS cevabını izle.",
      hint: "'2) DNS' sekmesini aç, alan adını yaz, 'DNS sorgusu yap'a bas.",
      check: (c) => (has(c, "dns_resolved") ? { ok: true, msg: "DNS sunucusu alan adını IP adresine çevirdi ve tarayıcı artık bağlanabilir." } : { ok: false, msg: "Geçerli bir alan adı için tamamlanmış sorgu yok. Listedeki alan adlarından birini seç (google.com gibi) ve bekle." }),
    },
    {
      id: "t3",
      title: "Önbellek (cache) hızını gör",
      desc: "Aynı alan adını iki kez sorgula. İkincisinde cevabın önbellekten geldiğini gözlemle.",
      hint: "Aynı alan adı için iki kez 'DNS sorgusu yap'a bas. İlk animasyon bitince ikincisini başlat.",
      check: (c) => (has(c, "dns_cache_hit") ? { ok: true, msg: "İkinci sorguda cevap hemen önbellekten geldi. DNS bu sayede hızlı çalışır." } : { ok: false, msg: "Önbellekten gelen bir cevap görmedin. İlk sorgunun bitmesini bekle, sonra aynı alan adını tekrar sor." }),
    },
    {
      id: "t4",
      title: "DHCP sunucusu kapalıyken ne olur?",
      desc: "DHCP sunucusunu KAPAT ve IP istemeyi dene. Bilgisayarın hangi adresi aldığını yaz.",
      hint: "'DHCP sunucusu: AÇIK' butonuna tıklayıp KAPALI yap, sonra IP iste.",
      check: (c) => (has(c, "dhcp_server_off_tested") ? { ok: true, msg: "Sunucu cevap vermeyince bilgisayar 169.254.x.x (APIPA) adresini aldı. Bu adres internete çıkamaz; 'DHCP çalışmıyor' demektir." } : { ok: false, msg: "Henüz kapalı sunucuyla deneme yapılmadı. Sunucuyu KAPAT ve animasyonu sonuna kadar izle." }),
    },
  ],
  quiz: [
    { kind: "mc", q: "DHCP DORA adımlarının doğru sırası hangisidir?", options: ["Offer, Discover, Request, Ack", "Discover, Offer, Request, Acknowledge", "Request, Offer, Discover, Ack", "Discover, Request, Offer, Ack"], answer: 1, explain: "D-O-R-A: Discover (keşfet), Offer (teklif), Request (istek), Acknowledge (onay)." },
    { kind: "tf", q: "DNS sunucusunun görevi cihazlara IP adresi dağıtmaktır.", options: ["Doğru", "Yanlış"], answer: 1, explain: "IP dağıtan DHCP'dir. DNS ise alan adlarını IP adreslerine çevirir." },
    { kind: "mc", q: "Tarayıcıya 'wikipedia.org' yazıldığında ilk olarak hangi servis devreye girer?", options: ["DHCP", "DNS", "FTP", "ARP-SSH"], answer: 1, explain: "Tarayıcı site IP adresini bilmediği için önce DNS'e sorar." },
    { kind: "scenario", q: "Bilgisayarın IP adresi 169.254.33.7. Bu ne anlama gelir?", options: ["İnternet çok hızlı", "DHCP sunucusundan cevap alınamadı", "Firewall açık", "Gateway doğru"], answer: 1, explain: "DHCP sunucusu bulunamayınca cihaz kendine 169.254.x.x adresi verir (APIPA). Bu adresle internete çıkamazsın." },
    { kind: "tf", q: "Aynı alan adı ikinci kez sorulduğunda DNS cevabı önbellekten verebilir.", options: ["Doğru", "Yanlış"], answer: 0, explain: "DNS sunucuları cevabı bir süre önbellekte tutar; bu da tekrarlayan sorguları hızlandırır." },
  ],
};
