export interface OsiLayer {
  no: number;
  name: string;
  tr: string;
  pdu: string;
  life: string;
  tech: string;
  proto: string;
  tcpip: string;
}

export const OSI_LAYERS: OsiLayer[] = [
  { no: 7, name: "Application", tr: "Uygulama", pdu: "Veri", life: "Mektubu yazdığın an: mesajı hazırlıyorsun.", tech: "Tarayıcı, e-posta gibi uygulamalar ağı bu katmandan kullanır. Mesaj burada oluşur.", proto: "HTTP, DNS, FTP, SSH", tcpip: "Uygulama" },
  { no: 6, name: "Presentation", tr: "Sunum", pdu: "Veri", life: "Mektubu karşı tarafın anlayacağı dile çevirip şifrelemek.", tech: "Veri biçimlendirilir, gerekirse şifrelenir veya sıkıştırılır (örn. HTTPS'in şifrelemesi).", proto: "TLS, JPEG, UTF-8", tcpip: "Uygulama" },
  { no: 5, name: "Session", tr: "Oturum", pdu: "Veri", life: "Telefonda 'Alo' diyerek konuşmayı başlatmak, sonunda 'Hoşça kal' demek.", tech: "İki bilgisayar arasındaki konuşma (oturum) açılır, yönetilir ve kapatılır.", proto: "NetBIOS, RPC", tcpip: "Uygulama" },
  { no: 4, name: "Transport", tr: "Taşıma", pdu: "Segment", life: "Uzun mektubu sayfalara bölüp numaralamak ve hangi daireye gideceğini (port) yazmak.", tech: "Veri parçalanır, port numaraları eklenir. TCP sırayı ve teslimi garanti eder, UDP etmez.", proto: "TCP, UDP", tcpip: "Taşıma" },
  { no: 3, name: "Network", tr: "Ağ", pdu: "Paket", life: "Zarfın üstüne şehir ve ev adresini yazmak.", tech: "Kaynak ve hedef IP adresleri eklenir. Router'lar bu adrese bakıp paketi doğru yöne gönderir.", proto: "IP, ICMP", tcpip: "İnternet" },
  { no: 2, name: "Data Link", tr: "Veri Bağlantısı", pdu: "Çerçeve (Frame)", life: "Apartman kapıcısı: zarfı doğru daireye (cihaza) teslim eder.", tech: "MAC adresleri eklenir. Aynı ağ içinde switch, çerçeveyi doğru cihaza ulaştırır.", proto: "Ethernet, Wi‑Fi, MAC", tcpip: "Ağ Erişimi" },
  { no: 1, name: "Physical", tr: "Fiziksel", pdu: "Bit (1 ve 0)", life: "Kargo kamyonunun gittiği yol.", tech: "Bitler elektrik sinyali, ışık veya radyo dalgası olarak kablo/Wi‑Fi üzerinden geçer.", proto: "Kablo, Wi‑Fi, Fiber", tcpip: "Ağ Erişimi" },
];
