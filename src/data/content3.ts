import type { ModuleDef, TaskCtx } from "./types";

const has = (c: TaskCtx, e: string) => c.events.includes(e);
const need = (c: TaskCtx, list: [string, string][]) => list.filter(([e]) => !has(c, e)).map(([, t]) => t);

export const m7: ModuleDef = {
  id: "m7",
  no: 7,
  title: "Ağda Veri İletimi",
  tagline: "Mesajın yolculuğu: paketler ve katmanlar",
  intro: "Uzun bir mektubu tek zarfa sığdıramazsan sayfalara bölüp numaralarsın ve ayrı zarflarla gönderirsin. Alıcı numaralara bakıp sırayla birleştirir. Bilgisayar ağlarında veri de tam olarak böyle gider.",
  topics: [
    { title: "Paket nedir?", what: "Ağda taşınan küçük veri parçasıdır. İçinde hem veri hem adres bilgisi (başlık) bulunur.", why: "Ağdaki her şey paketlerle taşınır; paket ağın temel birimidir.", life: "Üzerinde adres ve sıra numarası yazan küçük bir kargo kolisi.", tech: "Paket = Başlık (kaynak/hedef IP, sıra no…) + Veri (payload)." },
    { title: "Veri paketlere neden ayrılır?", what: "Büyük veri küçük parçalara bölünerek gönderilir.", why: "Küçük paketler hata olursa sadece o parçanın yeniden gönderilmesini sağlar, hat bir kişiye kilitlenmez ve farklı yollardan gidebilir.", life: "Kamyon yerine 10 küçük araçla taşıma: biri arızalanırsa sadece onun yükü tekrar gönderilir.", tech: "Ethernet'te paket boyutu yaklaşık 1500 baytla sınırlıdır (MTU)." },
    { title: "Paketler ağda nasıl ilerler?", what: "Her paket kaynaktan çıkar, switch ve router'lardan geçerek hedefe gider.", why: "Her cihaz paketin başlığına bakıp bir sonraki adımı belirler.", life: "Kargo koli: sevkiyat merkezi → şube → kapı.", tech: "Switch MAC'e, router IP'ye bakar. Paketler farklı yollardan gidebilir ve karışık sırayla ulaşabilir; alıcı sıra numarasıyla toplar." },
    { title: "OSI modeli nedir?", what: "Ağ iletişimini 7 katmana bölen kavramsal bir modeldir.", why: "Karmaşık işi küçük görevlere ayırır; sorun giderirken 'hangi katmanda sorun var?' diye düşünmeyi sağlar.", life: "Mektup gönderme: yazma (7), çevirme (6), konuşma başlatma (5), sayfalama (4), adres yazma (3), kapıcı (2), yol (1).", tech: "7 Application · 6 Presentation · 5 Session · 4 Transport · 3 Network · 2 Data Link · 1 Physical. Gönderirken yukarıdan aşağı, alırken aşağıdan yukarı çalışır." },
    { title: "TCP/IP modeli nedir?", what: "Gerçek internetin kullandığı 4 katmanlı modeldir.", why: "OSI teoriktir; internet TCP/IP ile çalışır.", life: "OSI ayrıntılı eğitim haritası, TCP/IP ise sahada kullanılan sade haritadır.", tech: "Uygulama · Taşıma · İnternet · Ağ Erişimi (4 katman)." },
    { title: "OSI ve TCP/IP arasındaki temel farklar", what: "OSI 7, TCP/IP 4 katmandır. OSI'nin üst 3 katmanı TCP/IP'de tek 'Uygulama' katmanıdır; alt 2 katman 'Ağ Erişimi'nde birleşir.", why: "İki model de aynı olayı anlatır; sadece ayrıntı düzeyi farklıdır.", life: "Aynı yolculuk, biri 7 durak biri 4 durak olarak anlatılıyor.", tech: "OSI öğretmek için, TCP/IP uygulamak için kullanılır. Katmanlar aynı işleri yapar.", tip: "Sınavlarda OSI, uygulamada TCP/IP geçer; ikisini eşleştirmeyi bil." },
  ],
  instructor: {
    start: "Öğrencilerden uzun bir mesajı WhatsApp'ta gönderdiğinde ne olduğunu düşünmelerini iste: 'Tek parça mı gidiyor?' Paket fikrini buradan aç.",
    example: "Mektubu sayfalara bölüp numaralamak = paketleme. Zarfın üstüne adres yazmak = IP başlığı. Kapıcı = switch.",
    emphasize: ["Veri paketlere bölünür, her pakette sıra no ve adres var.", "Paketler karışık gelse de alıcı sıralar.", "OSI: gönderirken 7→1, alırken 1→7."],
    confusions: ["Paketlerin hep aynı yoldan gittiği sanılır.", "OSI'nin gerçekte uygulandığı sanılır; internetin gerçek modeli TCP/IP'dir.", "Her katmanın ayrı bir cihaz olduğu sanılır; katmanlar yazılım/donanım görevleridir."],
    summary: "'Mesaj paketlere bölünür, her pakete adres yazılır, router/switch yönlendirir, alıcı sıraya dizip birleştirir. Bu işlem 7 katmanda adım adım olur.'",
  },
  labKind: "transmission",
  tasks: [
    {
      id: "t1",
      title: "Bir mesaj gönder",
      desc: "PC1'den PC2'ye bir mesaj gönder ve paketlerin Switch ve Router'dan geçişini izle.",
      hint: "'1) Mesaj → paketler' sekmesinde 'Mesajı gönder'e bas.",
      check: (c) => (has(c, "msg_sent") ? { ok: true, msg: "Mesaj PC1 → Switch → Router → PC2 yolunu izledi." } : { ok: false, msg: "Henüz mesaj göndermedin." }),
    },
    {
      id: "t2",
      title: "Mesajı birden fazla pakete ayır",
      desc: "Paket boyutunu küçült ve mesajın kaç pakete ayrıldığını gör.",
      hint: "Kaydırıcıyı sola çek (örn. 5 karakter) ve gönder. Mesaj uzunsa en az 2 paket oluşur.",
      check: (c) => (has(c, "msg_multi_packets") ? { ok: true, msg: "Mesaj birden fazla pakete ayrıldı. Her paket sıra numarasıyla etiketlendi." } : { ok: false, msg: "Mesaj tek pakete sığdı. Paket boyutunu küçült ya da mesajı uzat." }),
    },
    {
      id: "t3",
      title: "Karışık gelen paketleri sıraya diz",
      desc: "'Paketler karışık ulaşsın' seçeneğini aç, gönder ve mesajın doğru birleştiğini kontrol et.",
      hint: "Seçeneği işaretle, paket boyutunu küçük tut (en az 3 paket) ve gönder.",
      check: (c) => (has(c, "shuffled_reassembled") ? { ok: true, msg: "Paketler karışık gelse de sıra numaraları sayesinde mesaj doğru birleşti." } : { ok: false, msg: "Karışık paket denemesi yok. Seçeneği aç ve en az 3 pakete bölünecek bir mesaj gönder." }),
    },
    {
      id: "t4",
      title: "OSI katmanlarını baştan sona izle",
      desc: "OSI sekmesinde mesajın gönderen ve alıcı tarafındaki tüm 7 katman yolculuğunu sonuna kadar izle.",
      hint: "'2) OSI katmanları' sekmesinde 'Mesajı gönder, katmanları izle'ye bas. 14. adıma kadar ilerle.",
      check: (c) => (has(c, "osi_walkthrough") ? { ok: true, msg: "Veri gönderilirken zarflara sarıldı (kapsülleme) ve alıcıda açıldı. Her katmanın görevi farklıdır." } : { ok: false, msg: "OSI yolculuğunun sonuna gelmedin. 7. katmandan 1.'ye, sonra 1.'den 7.'ye adım adım ilerle." }),
    },
  ],
  quiz: [
    { kind: "mc", q: "Büyük bir veri ağda neden küçük paketlere bölünür?", options: ["Daha güzel göründüğü için", "Kayıp parçanın tekrar gönderilmesi kolaylaşır ve hat paylaşılır", "Switch yalnızca küçük paket anlar", "Şifreleme için"], answer: 1, explain: "Küçük paketler hatalı parçanın yeniden gönderilmesini kolaylaştırır; hat adil paylaşılır." },
    { kind: "tf", q: "Paketler her zaman gönderildikleri sırayla alıcıya ulaşır.", options: ["Doğru", "Yanlış"], answer: 1, explain: "Paketler farklı yollardan gidebilir ve karışık gelebilir. Alıcı sıra numaralarına bakarak doğru sıraya dizer." },
    { kind: "mc", q: "OSI modelinin katman sayısı kaçtır?", options: ["4", "5", "7", "9"], answer: 2, explain: "OSI 7 katmandır. TCP/IP modeli ise 4 katmandır." },
    { kind: "scenario", q: "Paketin IP adreslerine bakıp yönünü belirleyen cihaz ve katman hangisidir?", options: ["Switch – Katman 2", "Router – Katman 3 (Network)", "Kablo – Katman 7", "Modem – Katman 5"], answer: 1, explain: "Router IP adreslerini okur; IP adresleri Katman 3 (Network) görevidir. Switch ise Katman 2'de MAC adresine bakar." },
    { kind: "mc", q: "TCP ve UDP OSI'nin hangi katmanındadır?", options: ["Application", "Transport", "Network", "Physical"], answer: 1, explain: "TCP ve UDP, Katman 4 olan Transport (Taşıma) katmanında çalışır." },
  ],
};

export const m8: ModuleDef = {
  id: "m8",
  no: 8,
  title: "Temel Ağ Komutları",
  tagline: "Ağ doktorunun stetoskopu: terminal komutları",
  intro: "Doktor hastayı muayene ederken önce nabzına, ateşine bakar. Ağ sorunlarında da birkaç basit komutla ağın durumunu görebilirsin. Bu modülde gerçek terminal görünümlü bir simülasyonda bu komutları çalıştıracaksın.",
  topics: [
    { title: "ipconfig", what: "Bilgisayarının IP adresi, Subnet Mask ve Gateway bilgilerini gösterir. (Linux/macOS: ip a / ifconfig)", why: "Sorun gidermede ilk adımdır: 'Ağda adresim var mı?'", life: "Kimliğine bakmak: 'Ben kimim, nerede oturuyorum?'", tech: "ipconfig /all MAC adresi, DHCP ve DNS bilgisini de verir." },
    { title: "ping", what: "Karşı cihaza 'Orada mısın?' paketi gönderir ve cevap süresini ölçer.", why: "Bağlantının çalışıp çalışmadığını ve hızını test etmek için.", life: "Kapıyı çalıp 'Evde kimse var mı?' demek.", tech: "ICMP Echo Request/Reply kullanır. Önce gateway'i, sonra internet adresini ping'le." },
    { title: "tracert", what: "Paketin hedefe giderken uğradığı router duraklarını gösterir. (Linux: traceroute)", why: "Yavaşlık veya kopukluğun nerede olduğunu bulmak için.", life: "Navigasyonda yolun duraklarını görmek.", tech: "TTL değerini 1'den başlatarak her router'dan cevap toplar." },
    { title: "nslookup", what: "DNS sunucusuna alan adının IP adresini sorar.", why: "Siteye girilemiyorsa DNS çalışıyor mu görmek için.", life: "Telefon rehberinde isim aratmak.", tech: "Çıktıda sorguyu cevaplayan DNS sunucusu ve bulunan IP adresleri görünür." },
    { title: "netstat", what: "Açık portları ve aktif bağlantıları listeler. -an = hepsi, sayısal.", why: "Bilgisayarın kiminle konuştuğunu görmek ve güvenlik kontrolü için.", life: "Evin açık kapılarını ve içeri kimin girdiğini kontrol etmek.", tech: "LISTENING = bekliyor, ESTABLISHED = bağlantı kurulu." },
    { title: "arp", what: "IP adresi ile MAC adresi eşleşmelerini gösterir (arp -a).", why: "Yerel ağda cihazın MAC adresini bulmak ve ağ sorunlarını anlamak için.", life: "Mahalle rehberi: 'Bu ev numarasında kim oturuyor?'", tech: "ARP, aynı ağdaki IP için MAC adresini sorup tabloda saklar." },
  ],
  instructor: {
    start: "Önce 'Ağ bozulduğunda ne yaparsınız?' diye sor. Çoğu 'modemi kapatıp açarım' der. 'Peki neyin bozuk olduğunu nasıl anlarız?' sorusuyla komutlara geç.",
    example: "Doktor muayenesi: ipconfig = kimlik, ping = nabız, tracert = yol haritası, nslookup = rehber, netstat = açık kapılar, arp = mahalle listesi.",
    emphasize: ["Sorun gidermede sıra: ipconfig → ping gateway → ping internet → nslookup.", "Her komutun cevapladığı soruyu bil.", "Terminal gerçek sisteme komut göndermiyor; güvenle deneyebilirler."],
    confusions: ["ping başarısız = internet yok sanılır; bazı cihazlar ping'e cevap vermez.", "nslookup ile ping karıştırılır.", "Linux komutlarının farklı olduğu unutulur (ip a, traceroute)."],
    summary: "'Önce adresime bakarım (ipconfig), sonra gateway'e ping atarım, sonra internete, sonra DNS'e. Adım adım ilerlersem sorunun yerini bulurum.'",
  },
  labKind: "terminal",
  tasks: [
    {
      id: "t1",
      title: "Kendi IP ayarlarına bak ve gateway'i ping'le",
      desc: "ipconfig çalıştır, Default Gateway adresini oku ve ping 192.168.1.1 komutuyla gateway'e ulaş.",
      hint: "Önce 'ipconfig' yaz, sonra 'ping 192.168.1.1'.",
      check: (c) => {
        const m = need(c, [["cmd_ipconfig", "ipconfig komutunu çalıştır"], ["cmd_ping_gw", "ping 192.168.1.1 komutunu çalıştır"]]);
        return m.length ? { ok: false, msg: `Eksik: ${m.join(" ve ")}. Gateway'e ulaşamıyorsan sorun yerel ağdadır.` } : { ok: true, msg: "Gateway cevap verdi: yerel ağ ve router sağlıklı." };
      },
    },
    {
      id: "t2",
      title: "Alan adının IP'sini bul ve internete ping at",
      desc: "nslookup google.com ile IP'yi bul, sonra ping google.com ile bağlantıyı dene.",
      hint: "'nslookup google.com' ve ardından 'ping google.com' çalıştır.",
      check: (c) => {
        const m = need(c, [["cmd_nslookup", "nslookup google.com çalıştır"], ["cmd_ping_domain", "ping google.com çalıştır"]]);
        return m.length ? { ok: false, msg: `Eksik: ${m.join(" ve ")}. nslookup DNS'i, ping ise bağlantıyı test eder.` } : { ok: true, msg: "DNS isim → IP çevirisini yaptı, ping de internete ulaşıldığını gösterdi." };
      },
    },
    {
      id: "t3",
      title: "Paketin yolunu izle",
      desc: "tracert google.com komutuyla paketin hangi duraklardan geçtiğini gör.",
      hint: "'tracert google.com' yaz ve satırların tek tek gelmesini bekle.",
      check: (c) => (has(c, "cmd_tracert") ? { ok: true, msg: "İlk durak senin gateway'in (192.168.1.1); sonrası internet sağlayıcı ve hedef ağdır." } : { ok: false, msg: "tracert henüz çalıştırılmadı (ya da bitmeden çıkıldı)." }),
    },
    {
      id: "t4",
      title: "Bağlantıları ve ARP tablosunu incele",
      desc: "netstat -an ile açık portları, arp -a ile IP–MAC eşleşmelerini gör.",
      hint: "İki komutu da çalıştır: 'netstat -an' ve 'arp -a'.",
      check: (c) => {
        const m = need(c, [["cmd_netstat", "netstat -an çalıştır"], ["cmd_arp", "arp -a çalıştır"]]);
        return m.length ? { ok: false, msg: `Eksik: ${m.join(" ve ")}.` } : { ok: true, msg: "netstat hangi portların açık olduğunu, arp ise IP–MAC eşleşmesini gösterdi." };
      },
    },
  ],
  quiz: [
    { kind: "mc", q: "Bilgisayarın kendi IP adresini ve gateway'ini görmek için hangi komut kullanılır?", options: ["ping", "ipconfig", "tracert", "arp"], answer: 1, explain: "ipconfig bilgisayarın ağ ayarlarını gösterir." },
    { kind: "tf", q: "tracert, paketin hedefe giderken geçtiği router duraklarını gösterir.", options: ["Doğru", "Yanlış"], answer: 0, explain: "tracert her bir durak (hop) için cevap süresini listeler." },
    { kind: "mc", q: "Bir sitenin IP adresini DNS'ten sormak için hangi komut kullanılır?", options: ["netstat", "nslookup", "ipconfig", "arp"], answer: 1, explain: "nslookup DNS sunucusuna alan adının IP'sini sorar." },
    { kind: "scenario", q: "İnternete girilemiyor. ping 192.168.1.1 cevap veriyor ama ping google.com veremiyor. Sorun nerededir?", options: ["Yerel ağ ve router'da", "Router'ın ötesinde (internet/DNS)", "Bilgisayarın ekranında", "Kablonun rengi"], answer: 1, explain: "Gateway cevap veriyorsa yerel ağ sağlıklıdır. Sorun router'ın ötesinde, internet hattında veya DNS'te olabilir." },
    { kind: "mc", q: "'ESTABLISHED' durumu netstat çıktısında neyi ifade eder?", options: ["Port dinleniyor", "Bağlantı kurulmuş", "Bağlantı reddedilmiş", "Port kapalı"], answer: 1, explain: "ESTABLISHED = aktif bağlantı. LISTENING ise port bağlantı bekliyor demektir." },
  ],
};
