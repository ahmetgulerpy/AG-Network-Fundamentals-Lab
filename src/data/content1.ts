import type { ModuleDef, TaskCtx } from "./types";
import { labM1, labM2, labM3 } from "./labs";
import { componentOf, isValidIp, isValidMask, networkOf, type Device } from "../lib/net";

const pcs = (c: TaskCtx): Device[] => (c.lab?.devices ?? []).filter((d) => d.type === "pc");
const has = (c: TaskCtx, e: string) => c.events.includes(e);

export const m1: ModuleDef = {
  id: "m1",
  no: 1,
  title: "Ağ Nedir?",
  tagline: "Bilgisayarlar birbiriyle nasıl konuşur?",
  intro: "Telefonla bir arkadaşını aradığını düşün. İkiniz arasında bir hat (bağlantı) var ve konuşabiliyorsunuz. Bilgisayar ağı da aynı şeydir: cihazların birbiriyle konuşabilmesi için kurulan bağlantılar bütünü.",
  topics: [
    { title: "Bilgisayar ağı nedir?", what: "İki veya daha fazla cihazın (bilgisayar, telefon, yazıcı…) veri alışverişi yapabilmesi için birbirine bağlanmasıdır.", why: "Cihazların tek başına yapamadığı işleri birlikte yapabilmesi için: dosya paylaşmak, internete girmek, yazıcıyı ortak kullanmak.", life: "Bir mahallede evler yollarla birbirine bağlıdır. Yollar sayesinde komşular birbirine gidip gelebilir. Ağ, cihazların mahallesidir.", tech: "Cihazlar kablo (Ethernet) veya kablosuz (Wi‑Fi) ile bağlanır ve 'paket' denen küçük veri parçalarıyla konuşur." },
    { title: "Neden ağa ihtiyaç duyarız?", what: "Ağ olmadan her bilgisayar kendi başına bir ada gibidir.", why: "Paylaşım (dosya, yazıcı, internet), iletişim (mesaj, görüntülü görüşme) ve merkezi yönetim için.", life: "Her eve ayrı bir yazıcı almak yerine bir yazıcıyı tüm aile kullanır. Bunu ağ mümkün kılar.", tech: "Bir ağdaki tüm cihazlar tek bir internet bağlantısını, tek bir yazıcıyı veya tek bir dosya sunucusunu paylaşabilir." },
    { title: "LAN (Yerel Ağ)", what: "Ev, ofis veya okul gibi küçük bir alandaki cihazların ağıdır. LAN = Local Area Network.", why: "Yakındaki cihazlar hızlı ve ucuz şekilde haberleşsin diye.", life: "Bir apartmanın içindeki daireler arası iç telefon hattı gibidir. Sadece o binadakiler kullanır.", tech: "Genelde switch ve router ile kurulur. Hız yüksektir (100 Mbps – 10 Gbps)." },
    { title: "WAN (Geniş Alan Ağı)", what: "Şehirleri, ülkeleri birbirine bağlayan büyük ağdır. WAN = Wide Area Network.", why: "Uzaktaki LAN'ların birbirine bağlanabilmesi için.", life: "Şehirler arası otoyollar gibidir. Evlerin içindeki yollar LAN, şehirleri bağlayan otoyollar WAN'dır.", tech: "Genelde internet sağlayıcılarının (operatör) hatlarıyla kurulur. İnternet en büyük WAN'dır." },
    { title: "WLAN (Kablosuz LAN)", what: "LAN'ın kablosuz (Wi‑Fi) olan hâlidir.", why: "Telefon, tablet, laptop gibi hareketli cihazlar kablo takmadan bağlansın diye.", life: "Kablolu telefon yerine telsiz telefon kullanmak gibi: aynı konuşma, kablo yok.", tech: "Access Point radyo dalgalarıyla (2.4 GHz / 5 GHz) cihazlara bağlanır. Kablolu ağa göre biraz daha yavaş ve dinlemeye açıktır." , tip: "Wi‑Fi ≠ internet. Wi‑Fi sadece cihazını router'a bağlar; internet ise router'ın ötesindedir." },
    { title: "İnternet ve yerel ağ farkı", what: "Yerel ağ senin evindeki/ofisindeki cihazlardır. İnternet, dünyadaki milyonlarca ağın birbirine bağlandığı dev ağdır.", why: "Farkı bilmek, sorunun nerede olduğunu bulmak için önemlidir (ağ mı bozuk, internet mi?).", life: "Evin içi senin yerel ağındır. Evden çıkıp ana caddeye (internete) çıkan kapı ise router'dır.", tech: "Wi‑Fi'a bağlısın ama internet yoksa yazıcıya ulaşabilirsin: yerel ağ çalışıyor, internet çalışmıyor." },
    { title: "İstemci (Client) ve Sunucu (Server)", what: "İstemci hizmet isteyen, sunucu hizmet veren bilgisayardır.", why: "İşi paylaştırmak için: bir bilgisayar (sunucu) bilgileri tutar, diğerleri (istemciler) ister.", life: "Lokantada sen müşterisin (istemci), mutfak yemeği hazırlar (sunucu). Sen sipariş verirsin, o getirir.", tech: "Tarayıcın istemcidir; web sitesinin bulunduğu bilgisayar sunucudur. İstek gider, cevap döner." },
    { title: "Evimizdeki ağ nasıl çalışır?", what: "Evde modem/router, telefon, TV ve bilgisayarlardan oluşan küçük bir LAN vardır.", why: "Tüm cihazların aynı internet bağlantısını kullanabilmesi için.", life: "Evdeki tek su sayacından tüm musluklara su dağıtılır. Router da tek internet hattını tüm cihazlara dağıtır.", tech: "Operatör hattı → Modem → Router (Wi‑Fi dağıtır) → Cihazlar. Router her cihaza bir IP adresi verir." },
  ],
  instructor: {
    start: "Derse 'Evinizde kaç cihaz internete bağlı?' diye sorarak başla. Öğrenciler telefon, TV, bilgisayar sayacak. 'Hepsi nasıl aynı internete bağlanıyor?' sorusu merak uyandırır.",
    example: "Mahalle benzetmesi: evler = cihazlar, sokaklar = kablolar, mahalle = LAN, şehirler arası otoyol = WAN.",
    emphasize: ["Ağ = bağlı cihazlar topluluğu.", "LAN küçük alan, WAN büyük alan.", "İstemci isteyen, sunucu veren taraftır."],
    confusions: ["Wi‑Fi ile internet aynı şey sanılır. Wi‑Fi sadece bağlantı yöntemidir.", "Sunucunun mutlaka dev bir makine olduğu sanılır; sunucu bir rol, her bilgisayar sunucu olabilir.", "Router'ın içindeki Wi‑Fi'ın interneti sağladığı sanılır; internetin kaynağı operatördür."],
    summary: "'Ağ, cihazların birbiriyle konuşması için kurulan bağlantılardır. Küçük olana LAN, büyük olana WAN deriz. İsteyen istemci, veren sunucudur.'",
  },
  labKind: "network",
  lab: labM1,
  tasks: [
    {
      id: "t1",
      title: "İki bilgisayar oluştur",
      desc: "Çalışma alanına en az iki bilgisayar yerleştir.",
      hint: "Cihaz çubuğundaki 'Bilgisayar' butonuna tıkla veya çalışma alanına sürükle.",
      check: (c) => {
        const n = pcs(c).length;
        return n >= 2 ? { ok: true, msg: `Harika! ${n} bilgisayar oluşturdun.` } : { ok: false, msg: `Şu an ${n} bilgisayar var. Ağ en az iki cihazla başlar; ikinci bilgisayarı da ekle.` };
      },
    },
    {
      id: "t2",
      title: "İki bilgisayarı aynı ağa bağla",
      desc: "'Kablo çek' aracıyla iki bilgisayarı doğrudan veya bir switch üzerinden birbirine bağla.",
      hint: "Kablo çek aracını seç → ilk bilgisayara tıkla → ikinci cihaza tıkla.",
      check: (c) => {
        const lab = c.lab;
        const p = pcs(c);
        if (p.length < 2) return { ok: false, msg: "Önce en az iki bilgisayar oluşturmalısın (Görev 1)." };
        if (!lab || lab.links.length === 0) return { ok: false, msg: "Hiç kablo yok. Bağlantı olmadan cihazlar birbirini göremez. 'Kablo çek' aracını kullan." };
        for (const a of p) {
          const comp = componentOf(lab, a.id);
          if (p.some((b) => b.id !== a.id && comp.has(b.id))) return { ok: true, msg: "Bilgisayarlar birbirine bağlı. Artık aynı ağdalar!" };
        }
        return { ok: false, msg: "Kablolar var ama bilgisayarlar birbirine ulaşan bir yolda değil. Bilgisayarları aynı switch'e veya birbirine bağla." };
      },
    },
    {
      id: "t3",
      title: "Bir bilgisayardan diğerine veri gönder",
      desc: "Kaynak ve hedef seçip 'Veri gönder' (ya da Ping) butonuna bas. Paketin gidip geldiğini izle.",
      hint: "Paket gönder bölümünde Kaynak = PC1, Hedef = PC2 seç.",
      check: (c) => {
        if (has(c, "ok_pc_pc")) return { ok: true, msg: "Veri PC'den PC'ye başarıyla ulaştı! Sarı nokta giden paket, yeşil nokta cevaptı." };
        if (has(c, "fail_noroute") || has(c, "fail_offline")) return { ok: false, msg: "Paket gönderdin ama ulaşmadı: kabloların veya cihazların durumunu kontrol et (günlükteki açıklamayı oku)." };
        return { ok: false, msg: "Henüz iki bilgisayar arasında başarılı bir veri gönderimi yok. Önce bağla, sonra 'Veri gönder'e bas." };
      },
    },
  ],
  quiz: [
    { kind: "mc", q: "Bir evdeki Wi‑Fi bağlı telefon, yazıcı ve laptoptan oluşan ağ hangisidir?", options: ["WAN", "LAN/WLAN", "İnternet", "Sunucu"], answer: 1, explain: "Küçük bir alandaki cihazlar LAN'dır; kablosuz bağlandıkları için WLAN olarak da adlandırılır." },
    { kind: "tf", q: "Wi‑Fi ile internet aynı şeydir.", options: ["Doğru", "Yanlış"], answer: 1, explain: "Wi‑Fi sadece cihazı router'a kablosuz bağlar. İnternet ise router'ın ötesindeki dünya çapında ağdır. Wi‑Fi'a bağlı olup internet olmayabilir." },
    { kind: "mc", q: "Tarayıcınla bir web sitesini açtığında tarayıcın ne rolündedir?", options: ["Sunucu", "İstemci (Client)", "Router", "Switch"], answer: 1, explain: "Hizmeti isteyen taraf istemcidir. Siteyi barındıran bilgisayar ise sunucudur." },
    { kind: "scenario", q: "Evde internet gitti ama ağdaki yazıcıya hâlâ yazdırabiliyorsun. Ne olmuştur?", options: ["Yerel ağ çalışıyor, internet bağlantısı kopmuş", "Yazıcı internete bağlı", "Tüm ağ bozulmuş", "Bilgisayar sunucu olmuş"], answer: 0, explain: "Yazıcıya ulaşmak yerel ağ (LAN) gerektirir. İnternet kopsa bile LAN çalışmaya devam eder." },
    { kind: "tf", q: "Şehirleri birbirine bağlayan büyük ağlara WAN denir.", options: ["Doğru", "Yanlış"], answer: 0, explain: "WAN = Wide Area Network (Geniş Alan Ağı). İnternet en büyük WAN örneğidir." },
  ],
};

export const m2: ModuleDef = {
  id: "m2",
  no: 2,
  title: "Ağ Cihazları",
  tagline: "Modem, router, switch… Kim ne iş yapar?",
  intro: "Bir şehri düşün: giriş kapısı, trafik polisi, kavşaklar, güvenlik görevlileri var. Ağda da her cihazın bir görevi vardır. Hepsini ezberlemek yerine 'kim hangi işi yapıyor' diye düşüneceğiz.",
  topics: [
    { title: "Modem", what: "Evini internet sağlayıcının hattına bağlayan cihazdır.", why: "Operatörün hattındaki sinyal (fiber, ADSL) bilgisayarların anlayacağı dile çevrilmelidir.", life: "Yabancı bir dili bilmeyen turistin yanındaki çevirmen gibi: dışarıdaki dili evin diline çevirir.", tech: "Hat sinyalini dijital veriye çevirir (modülasyon/demodülasyon). Çoğu evde modem ve router tek kutudur." },
    { title: "Router", what: "Farklı ağları birbirine bağlayan ve paketlerin gideceği yolu belirleyen cihazdır.", why: "Evdeki ağı internete bağlamak ve paketi doğru yöne göndermek için.", life: "Kavşaktaki trafik polisi gibi: araba (paket) hangi yola gidecek karar verir.", tech: "IP adreslerine bakar, yönlendirme yapar. Ayrıca DHCP ile IP dağıtır, NAT ile tek internet IP'sini paylaştırır, Wi‑Fi yayabilir." },
    { title: "Switch", what: "Aynı ağdaki kablolu cihazları birbirine bağlayan dağıtım kutusudur.", why: "Router'ın port sayısı yetmez; çok cihazı bağlamak ve aralarında hızlı iletişim için.", life: "Apartmandaki kapıcı: zarfı zile basarak doğru daireye iletir, herkesin kapısını çalmaz.", tech: "Paketin MAC adresine bakar ve sadece doğru porta gönderir. (Eski 'hub' ise herkese gönderirdi.)" , tip: "Switch aynı ağ içinde, router ağlar arasında çalışır." },
    { title: "Access Point (AP)", what: "Kablolu ağı kablosuz (Wi‑Fi) hâle getiren cihazdır.", why: "Telefon ve laptoplar kablosuz bağlanabilsin, geniş alanda Wi‑Fi olsun diye.", life: "Evin her odasına konulan telsiz anten gibi: sinyali kablosuz ulaştırır.", tech: "Ethernet kablosuyla switch/router'a bağlanır, radyo dalgalarıyla yayın yapar (SSID = Wi‑Fi adı)." },
    { title: "Firewall (Güvenlik duvarı)", what: "Gelen ve giden trafiği kurallara göre kontrol eden güvenlik cihazı/yazılımıdır.", why: "Zararlı bağlantıları engellemek, sadece izin verilen trafiğin geçmesi için.", life: "Sitenin girişindeki güvenlik görevlisi: listede adı olan girer, olmayan girmez.", tech: "Kaynak/hedef IP, port ve protokol'e göre 'izin ver / engelle' kuralları uygular." },
    { title: "Ethernet kablosu", what: "Bilgisayarı ve ağ cihazlarını fiziksel olarak birbirine bağlayan kablodur.", why: "Kablolu bağlantı daha hızlı, kararlı ve güvenlidir.", life: "Evleri birbirine bağlayan yol gibidir. Yol ne kadar iyiyse trafik o kadar rahat akar.", tech: "Çoğunlukla Cat5e/Cat6 bükümlü çift kablo, RJ45 konnektör. En fazla yaklaşık 100 metre." },
    { title: "Cihazların görevleri – özet", what: "İnternet → Modem → Router → Switch → Bilgisayarlar. Wi‑Fi için Router/Switch'e AP eklenir.", why: "Zinciri bilirsen bir sorun olduğunda hangi cihazın arızalı olduğunu bulabilirsin.", life: "Su şebekesi gibi: ana boru (modem), vana (router), dağıtım (switch), musluk (bilgisayar).", tech: "Zincirdeki bir cihaz çökerse onun ardındaki tüm cihazlar etkilenir. Bunu laboratuvarda deneyeceksin!" },
  ],
  instructor: {
    start: "'Evdeki o küçük ışıklı kutu ne işe yarıyor?' diye sor. Çoğu kişi 'modem' der; modem ve router farkını merak ettir.",
    example: "Şehir benzetmesi: modem şehrin giriş kapısı, router trafik polisi, switch apartman kapıcısı, firewall güvenlik görevlisi, AP anten.",
    emphasize: ["Her cihazın tek bir ana görevi vardır.", "Zincirde bir cihaz giderse arkasındakiler etkilenir.", "Switch aynı ağda, Router ağlar arasında çalışır."],
    confusions: ["Modem ile router karıştırılır: modem hatta bağlar, router yönlendirir.", "Switch ile router karıştırılır.", "Hub ile switch aynı sanılır: hub herkese gönderir, switch yalnızca hedefe."],
    summary: "'Modem dışarıya bağlar, router yol gösterir, switch cihazları toplar, AP Wi‑Fi yayar, firewall korur. Kablo hepsini taşır.'",
  },
  labKind: "network",
  lab: labM2,
  tasks: [
    {
      id: "t1",
      title: "Basit bir ev ağı kur",
      desc: "İnternet, Modem, Router, Switch ve en az 2 bilgisayarı yerleştirip hepsini birbirine bağla.",
      hint: "Zincir: İnternet – Modem – Router – Switch – Bilgisayarlar. 'Örnek ağı yükle' ile örneği görebilirsin.",
      check: (c) => {
        const lab = c.lab;
        if (!lab) return { ok: false, msg: "Çalışma alanı boş." };
        const cnt = (t: string) => lab.devices.filter((d) => d.type === t).length;
        const miss: string[] = [];
        if (!cnt("internet")) miss.push("İnternet");
        if (!cnt("modem")) miss.push("Modem");
        if (!cnt("router")) miss.push("Router");
        if (!cnt("switch")) miss.push("Switch");
        if (cnt("pc") < 2) miss.push(`${2 - cnt("pc")} bilgisayar daha`);
        if (miss.length) return { ok: false, msg: `Eksik cihazlar: ${miss.join(", ")}.` };
        const comp = componentOf(lab, lab.devices.find((d) => d.type === "internet")!.id);
        const off = lab.devices.filter((d) => !comp.has(d.id));
        if (off.length) return { ok: false, msg: `Bu cihazlar ağa bağlı değil: ${off.map((d) => d.name).join(", ")}. Kablo çek aracıyla zincire ekle.` };
        return { ok: true, msg: "Ev ağı hazır! Tüm cihazlar tek bir ağ içinde birbirine bağlı." };
      },
    },
    {
      id: "t2",
      title: "Paketin internete giden yolunu izle",
      desc: "Bir bilgisayardan İnternet cihazına ping gönder ve paketin hangi cihazlardan geçtiğini izle.",
      hint: "Kaynak = PC, Hedef = İnternet. Olay günlüğünde yolu oku. Hata alırsan açıklamayı oku.",
      check: (c) => {
        if (has(c, "ok_internet")) return { ok: true, msg: "Paket PC → Switch → Router → Modem → İnternet yolunu izledi ve cevap döndü. Zincirin her halkası çalışıyor." };
        if (has(c, "fail_gateway")) return { ok: false, msg: "Paket internete çıkamadı: bilgisayarın gateway'i (router'ın IP'si) hatalı veya boş. Bilgisayarın Gateway alanına router IP'sini yaz." };
        return { ok: false, msg: "İnternet'e başarılı bir ping yok. Kaynak olarak bilgisayar, hedef olarak İnternet'i seçip 'Ping gönder'e bas." };
      },
    },
    {
      id: "t3",
      title: "Bir cihazı devre dışı bırak ve farkı gözle",
      desc: "Yoldaki bir cihazı (örn. Router veya Modem) kapat ve tekrar ping gönder. Ne değişti?",
      hint: "Router'a tıkla → sağ panelde 'Açık' butonuna bas. Sonra tekrar ping gönder.",
      check: (c) => {
        if (has(c, "fail_offline")) return { ok: true, msg: "Gördüğün gibi yol üzerindeki bir cihaz kapanınca paket ilerleyemedi. Bu yüzden ağ tasarımında kritik cihazların yedeği olur." };
        return { ok: false, msg: "Henüz kapalı bir cihaz yüzünden başarısız olan bir paket yok. Önce bir cihazı kapat, sonra ping gönder." };
      },
    },
  ],
  quiz: [
    { kind: "mc", q: "Paketlerin hangi yöne gideceğine karar veren, 'trafik polisi' gibi çalışan cihaz hangisidir?", options: ["Switch", "Router", "Ethernet kablosu", "Access Point"], answer: 1, explain: "Router IP adreslerine bakarak paketleri farklı ağlara yönlendirir." },
    { kind: "tf", q: "Switch, aldığı paketi ağdaki tüm cihazlara kopyalar.", options: ["Doğru", "Yanlış"], answer: 1, explain: "Switch MAC adresini öğrenir ve paketi sadece ilgili porta gönderir. Her cihaza kopyalayan eski 'hub' cihazıdır." },
    { kind: "mc", q: "Kablolu ağı kablosuz (Wi‑Fi) yapmak için hangi cihaz kullanılır?", options: ["Firewall", "Modem", "Access Point", "Switch"], answer: 2, explain: "Access Point, kablolu ağa bağlanıp radyo dalgalarıyla Wi‑Fi yayını yapar." },
    { kind: "scenario", q: "Router'ın fişi çekildi. Router'ın arkasındaki hiçbir bilgisayar internete çıkamıyor. Neden?", options: ["Bilgisayarlar bozuldu", "Zincirdeki cihaz çalışmayınca arkasındakiler de etkilenir", "Wi‑Fi şifresi değişti", "Switch hepsini engelledi"], answer: 1, explain: "Router yol üzerindeki kritik halkadır. O çalışmazsa paketler internete ulaşamaz." },
    { kind: "mc", q: "Zararlı bağlantıları kurallara göre engelleyen 'güvenlik görevlisi' hangisidir?", options: ["Firewall", "Modem", "Switch", "Kablo"], answer: 0, explain: "Firewall; IP, port ve protokole göre trafiğe izin verir veya engeller." },
  ],
};

export const m3: ModuleDef = {
  id: "m3",
  no: 3,
  title: "IP Adresi ve MAC Adresi",
  tagline: "Cihazların adresi ve kimlik numarası",
  intro: "Bir kargocu paketi teslim ederken hem ev adresine (nereye) hem de kapıdaki isme (kime) bakar. Bilgisayar ağında da iki kimlik vardır: IP adresi ve MAC adresi.",
  topics: [
    { title: "IP adresi nedir?", what: "Ağdaki her cihazın sahip olduğu mantıksal adrestir.", why: "Paketin doğru cihaza ulaşması için bir adres gerekir.", life: "IP adresini bir evin adresi gibi düşün. Nasıl ki kargocu paketi doğru eve ulaştırmak için adres kullanıyorsa, bilgisayarlar da doğru cihaza ulaşabilmek için IP adreslerini kullanır.", tech: "Örnek: 192.168.1.10. Cihaz hangi ağa bağlanırsa o ağın adres aralığından bir IP alır." },
    { title: "IPv4 nedir?", what: "IP adresinin en çok kullanılan sürümüdür. 4 sayıdan oluşur (her biri 0–255).", why: "32 bitlik bu yapı yaklaşık 4,3 milyar adres sağlar.", life: "Telefon numarası gibi: sabit uzunlukta ve kurallı yazılır.", tech: "192.168.1.10 → her sayı 8 bit (bir oktet). Adresler azaldığı için daha uzun IPv6 geliştirildi." },
    { title: "IP adresi neden gereklidir?", what: "IP adresi olmadan cihaz ağda görünmez, kimse ona paket gönderemez.", why: "Gönderen ve alanın kim olduğunu belirtmek için.", life: "Adresi olmayan eve kargo teslim edilemez.", tech: "Her paketin başlığına kaynak IP ve hedef IP yazılır." },
    { title: "Özel IP ve genel IP", what: "Özel IP sadece yerel ağda geçerlidir; genel IP internette tektir.", why: "IPv4 adresleri az olduğu için evlerde özel adresler kullanılır, çıkışta tek genel IP paylaşılır.", life: "Apartmandaki daire numaraları (1, 2, 3) her apartmanda tekrar eder (özel). Ama apartmanın sokak adresi benzersizdir (genel).", tech: "Özel aralıklar: 10.x.x.x, 172.16–31.x.x, 192.168.x.x. Router NAT ile özel adresleri tek genel IP'ye çevirir." },
    { title: "MAC adresi nedir?", what: "Ağ kartının fabrikada atanmış fiziksel kimlik numarasıdır.", why: "Aynı yerel ağ içinde paketin hangi donanıma teslim edileceğini bilmek için.", life: "T.C. kimlik numarası gibi: kişi taşınsa da (adres değişse de) kimliği değişmez.", tech: "48 bitlik, 6 çiftli adres: A4:2B:B0:1C:9E:F1. Switch bu adrese bakarak çalışır." },
    { title: "IP ve MAC arasındaki fark", what: "IP mantıksal ve değişebilir; MAC fiziksel ve (normalde) sabittir.", why: "İki katmanlı sistem sayesinde hem ağlar arası hem ağ içi teslimat yapılır.", life: "IP: nerede oturduğun (ev adresi). MAC: sen kimsin (kimlik no).", tech: "Ağlar arası yolculuk IP ile, aynı ağ içi son teslimat MAC ile yapılır. ARP, IP'den MAC'i bulur.", tip: "IP = nerede? MAC = kim? Taşınınca IP değişir, MAC değişmez." },
    { title: "Statik ve dinamik IP", what: "Statik IP elle girilen sabit adrestir; dinamik IP otomatik verilen değişebilir adrestir.", why: "Sunucu, yazıcı gibi cihazlar hep aynı adreste bulunmalı; normal cihazlar için otomatik kolaylık sağlar.", life: "Statik: kendi evinin kalıcı adresi. Dinamik: otelde her gelişte farklı oda numarası.", tech: "Dinamik IP DHCP ile alınır. Ağ ayarlarında 'IP adresini otomatik al' seçeneği budur." },
    { title: "DHCP nedir?", what: "Ağdaki cihazlara otomatik IP adresi (ve gateway, DNS) dağıtan servistir.", why: "Her cihaza elle IP yazmak zahmetli ve hataya açıktır; çakışma riski artar.", life: "Otel resepsiyonu: gelen müşteriye boş bir oda anahtarı verir.", tech: "Genelde router DHCP sunucusudur. Adres havuzundan bir IP'yi belirli süreliğine 'kiralar'." },
  ],
  instructor: {
    start: "Öğrencilerden bir kargo gönderecekmiş gibi zarfa ne yazılması gerektiğini söylemelerini iste: 'ad-soyad' ve 'adres'. IP ve MAC'e geçişi buradan yap.",
    example: "IP = ev adresi (taşınınca değişir), MAC = kimlik numarası (değişmez), DHCP = otel resepsiyonu.",
    emphasize: ["IPv4: 4 sayı, her biri 0–255.", "Aynı IP iki cihazda olamaz.", "192.168.x.x, 10.x.x.x özel adreslerdir.", "DHCP IP'leri otomatik dağıtır."],
    confusions: ["MAC adresinin internette kullanıldığı sanılır: yalnızca yerel ağda çalışır.", "Evdeki 192.168.1.x adresinin internetteki adres olduğu sanılır: o özeldir.", "DHCP ile DNS karıştırılır: DHCP IP verir, DNS isim çözer."],
    summary: "'IP adresi cihazın nerede olduğunu, MAC adresi kim olduğunu söyler. IP'yi elle (statik) veya DHCP ile (otomatik) alabilirsin.'",
  },
  labKind: "network",
  lab: labM3,
  tasks: [
    {
      id: "t1",
      title: "Bilgisayarlara doğru IP adreslerini ata",
      desc: "Tüm bilgisayarlara aynı ağdan (192.168.1.x), birbirinden farklı ve geçerli IP adresleri ver. Mask: 255.255.255.0",
      hint: "PC1: 192.168.1.10, PC2: 192.168.1.20. IP kutusu yeşilse adres geçerlidir. Her cihazın kapısı ayrı olmalı.",
      check: (c) => {
        const p = pcs(c);
        if (p.length < 2) return { ok: false, msg: "En az 2 bilgisayar olmalı." };
        const bad = p.filter((d) => !isValidIp(d.ip) || d.ip.startsWith("169.254"));
        if (bad.length) return { ok: false, msg: `${bad.map((d) => d.name).join(", ")} için geçerli bir IP adresi yok. IP adresi olmayan cihaz ağda görünmez.` };
        if (new Set(p.map((d) => d.ip)).size !== p.length) return { ok: false, msg: "İki bilgisayar aynı IP'yi kullanıyor (çakışma). Her cihazın adresi benzersiz olmalı." };
        if (p.some((d) => !isValidMask(d.mask))) return { ok: false, msg: "Subnet Mask geçersiz. 255.255.255.0 kullan." };
        const nets = new Set(p.map((d) => networkOf(d.ip, d.mask)));
        if (nets.size > 1) return { ok: false, msg: "Bilgisayarlar farklı ağlarda. 192.168.1.x aralığında kalmalısın ki aynı mahallede olsunlar." };
        return { ok: true, msg: `Tüm bilgisayarlar ${[...nets][0]} ağında ve adresleri benzersiz.` };
      },
    },
    {
      id: "t2",
      title: "IP çakışmasını oluştur ve gör",
      desc: "İki bilgisayara aynı IP adresini ver. Kırmızı uyarıyı gör, ping at ve nedenini oku. Sonra düzelt.",
      hint: "PC2'nin IP'sini PC1 ile aynı yap. Sonra Paket gönder ile ping dene.",
      check: (c) => (has(c, "conflict_seen") ? { ok: true, msg: "IP çakışmasını gördün: aynı adreste iki cihaz olunca paketler karışır. Çözüm: birinin adresini değiştirmek (ya da DHCP kullanmak)." } : { ok: false, msg: "Henüz çakışma oluşturmadın. İki bilgisayara aynı IP'yi yazman gerekiyor." }),
    },
    {
      id: "t3",
      title: "DHCP ile otomatik IP dağıt",
      desc: "Router'da DHCP sunucusunu aç ve en az bir bilgisayarı DHCP moduna alarak otomatik IP almasını sağla.",
      hint: "Router'a tıkla → 'DHCP sunucusu: AÇIK' yap. PC'ye tıkla → 'DHCP (otomatik)' seç.",
      check: (c) => {
        const r = c.lab?.devices.find((d) => d.type === "router");
        const leased = pcs(c).filter((d) => d.dhcpMode && d.lease === "dhcp" && isValidIp(d.ip));
        if (leased.length && r?.dhcpServer) return { ok: true, msg: `${leased.map((d) => `${d.name}=${d.ip}`).join(", ")} adreslerini DHCP'den otomatik aldı. Elle yazmana gerek kalmadı!` };
        if (!r?.dhcpServer) return { ok: false, msg: "Router'da DHCP sunucusu kapalı. Kapalıyken bilgisayarlar IP alamaz (169.254.x.x adresine düşer)." };
        return { ok: false, msg: "Bilgisayar DHCP moduna alınmamış ya da IP alamamış. PC'yi seçip 'DHCP (otomatik)' seçeneğini işaretle." };
      },
    },
  ],
  quiz: [
    { kind: "mc", q: "Aşağıdakilerden hangisi geçerli bir IPv4 adresidir?", options: ["192.168.1.300", "192.168.1.25", "192.168.1", "192.168.1.25.7"], answer: 1, explain: "IPv4 tam 4 sayıdan oluşur ve her sayı 0–255 arasındadır." },
    { kind: "tf", q: "MAC adresi, cihazın bulunduğu ağa göre sürekli değişir.", options: ["Doğru", "Yanlış"], answer: 1, explain: "MAC adresi ağ kartına fabrikada yazılır ve normalde sabittir. Değişen IP adresidir." },
    { kind: "mc", q: "192.168.1.15 adresi ne tür bir IP'dir?", options: ["Genel (public) IP", "Özel (private) IP", "MAC adresi", "Alan adı"], answer: 1, explain: "192.168.x.x aralığı özel adreslere aittir; sadece yerel ağda geçerlidir." },
    { kind: "scenario", q: "Bir bilgisayar 169.254.x.x adresi aldı ve internete çıkamıyor. En olası neden?", options: ["DHCP sunucusuna ulaşamadı", "MAC adresi bozuldu", "Kablo çok uzun", "Firewall kapalı"], answer: 0, explain: "DHCP'den cevap alamayan cihaz kendine 169.254.x.x (APIPA) adresi verir. Bu adresle internete çıkılamaz." },
    { kind: "mc", q: "Ağdaki cihazlara otomatik IP adresi dağıtan servis hangisidir?", options: ["DNS", "DHCP", "HTTP", "FTP"], answer: 1, explain: "DHCP (Dynamic Host Configuration Protocol) IP, gateway ve DNS bilgisini otomatik dağıtır. DNS ise isimleri IP'ye çevirir." },
  ],
};
