const views = require('./views');
const { layout } = views;

module.exports = function(app, session) {

app.get('/hakkimizda', function(req, res) {
  var s = session(req, res);
  var c = '<div class="panel" style="max-width:800px;margin:0 auto;padding:30px">' +
    '<h1>Hakkimizda</h1>' +
    '<p style="line-height:1.8;color:#555;margin-top:14px">Meydan, 2024 yilinda kurulan yeni nesil bir tartisma platformudur. Amacimiz, Turkiye\'de ozgurce fikirlerin paylasildigi, kaliteli tartismalarin yapildigi bir topluluk olusturmaktir.</p>' +
    '<h3 style="margin-top:20px">Vizyonumuz</h3>' +
    '<p style="line-height:1.8;color:#555">Turkiye\'nin en buyuk ve en saygin tartisma platformu olmak.</p>' +
    '<h3 style="margin-top:20px">Misyonumuz</h3>' +
    '<p style="line-height:1.8;color:#555">Kullanicilarimiza kaliteli, hizli ve guvenli bir tartisma ortami sunmak. Her fikre saygi duyan, bilgiye dayali tartismalarin yapildigi bir topluluk olusturmak.</p>' +
    '<h3 style="margin-top:20px">Bize Ulasin</h3>' +
    '<p style="line-height:1.8;color:#555">E-posta: destek@meydan.com</p>' +
    '</div>';
  res.send(layout({ title: 'Hakkimizda', content: c, s: s }));
});

app.get('/kurallar', function(req, res) {
  var s = session(req, res);
  var c = '<div class="panel" style="max-width:800px;margin:0 auto;padding:30px">' +
    '<h1>Topluluk Kurallari</h1>' +
    '<ol style="line-height:2;color:#555;margin-top:14px;padding-left:20px">' +
    '<li><b>Saygili ol.</b> Kufur, hakaret, nefret soylemi yasaktir.</li>' +
    '<li><b>Konu disi yazma.</b> Her konu kendi kategorisinde acilmalidir.</li>' +
    '<li><b>Spam yapma.</b> Ayni icerigi tekrar tekrar paylasma.</li>' +
    '<li><b>Reklam yasak.</b> Ucretli tanitim icerikleri paylasma.</li>' +
    '<li><b>Kisisel bilgi paylasma.</b> Kendi veya baskalarinin ozel bilgilerini paylasma.</li>' +
    '<li><b>Telif haklarina saygi goster.</b> Baskalarinin icerigini izinsiz paylasma.</li>' +
    '<li><b>Yanlis bilgi yayma.</b> Dogrulanmamis bilgileri kaynak belirtmeden paylasma.</li>' +
    '<li><b>Kural ihlallerini bildir.</b> Sikayet sistemi ile bize bildir.</li>' +
    '</ol>' +
    '<div style="margin-top:24px;padding:14px;background:#fee2e2;color:#b91c1c;border-radius:8px">' +
    '<b>Uyari:</b> Kurallara uymayan kullanicilar uyari alir, tekrarda banlanir.</div>' +
    '</div>';
  res.send(layout({ title: 'Kurallar', content: c, s: s }));
});

app.get('/gizlilik', function(req, res) {
  var s = session(req, res);
  var c = '<div class="panel" style="max-width:800px;margin:0 auto;padding:30px">' +
    '<h1>Gizlilik Politikasi</h1>' +
    '<p style="line-height:1.8;color:#555;margin-top:14px">Meydan olarak kullanicilarimizin gizliligine onem veriyoruz. Bu politika, hangi bilgilerin nasil toplandigini ve kullanildigini aciklar.</p>' +
    '<h3 style="margin-top:20px">Toplanan Bilgiler</h3>' +
    '<ul style="line-height:1.8;color:#555;padding-left:20px"><li>Kullanici adi ve e-posta</li><li>Sifre (hash olarak saklanir)</li><li>Konu ve cevaplariniz</li><li>Oturum bilgileri</li></ul>' +
    '<h3 style="margin-top:20px">Kullanim Amaci</h3>' +
    '<ul style="line-height:1.8;color:#555;padding-left:20px"><li>Hesap yonetimi</li><li>Bildirim gonderimi</li><li>Topluluk guvenligi</li><li>Yasal zorunluluklar</li></ul>' +
    '<h3 style="margin-top:20px">Bilgi Paylasimi</h3>' +
    '<p style="line-height:1.8;color:#555">Kisisel bilgileriniz ucuncu taraflarla paylasilmaz, satilmaz. Yasal zorunluluk halinde yetkili kurumlarla paylasilabilir.</p>' +
    '<h3 style="margin-top:20px">Cerezler</h3>' +
    '<p style="line-height:1.8;color:#555">Sitemiz oturum yonetimi ve tema tercihi icin cerez kullanir.</p>' +
    '<h3 style="margin-top:20px">Haklariniz</h3>' +
    '<p style="line-height:1.8;color:#555">Hesabinizi ve verilerinizi silme, duzeltme hakkiniz vardir. destek@meydan.com adresine yazabilirsiniz.</p>' +
    '</div>';
  res.send(layout({ title: 'Gizlilik', content: c, s: s }));
});

app.get('/sss', function(req, res) {
  var s = session(req, res);
  var c = '<div class="panel" style="max-width:800px;margin:0 auto;padding:30px">' +
    '<h1>Sikca Sorulan Sorular</h1>' +
    '<div style="margin-top:20px">' +
    '<h3>Nasil uye olurum?</h3><p style="color:#555;line-height:1.7;margin-bottom:16px">Sag ust koseden Kayit Ol butonuna tiklayin, formu doldurun.</p>' +
    '<h3>Konu nasil acarim?</h3><p style="color:#555;line-height:1.7;margin-bottom:16px">Giris yaptiktan sonra ust menuden + Konu butonuna tiklayin.</p>' +
    '<h3>Sifremi unuttum, ne yapmaliyim?</h3><p style="color:#555;line-height:1.7;margin-bottom:16px">Simdilik admin ile iletisime gecin: destek@meydan.com</p>' +
    '<h3>Banlandim, nasil itiraz ederim?</h3><p style="color:#555;line-height:1.7;margin-bottom:16px">Ban suresini bekleyin veya destek@meydan.com adresine itiraz gonderin.</p>' +
    '<h3>Reklam verebilir miyim?</h3><p style="color:#555;line-height:1.7;margin-bottom:16px">Reklamlar kurallara aykiridir. Is birligi icin iletisime gecin.</p>' +
    '</div></div>';
  res.send(layout({ title: 'SSS', content: c, s: s }));
});

app.get('/iletisim', function(req, res) {
  var s = session(req, res);
  var c = '<div class="panel" style="max-width:600px;margin:0 auto;padding:30px;text-align:center">' +
    '<h1 style="font-size:26px;margin-bottom:10px">Bize Ulasin</h1>' +
    '<p style="color:#666;margin-bottom:24px">Sorulariniz, onerileriniz veya VIP uyelik icin bize ulasin.</p>' +
    '<div style="display:flex;flex-direction:column;gap:14px;margin-top:20px">' +
    '<a href="https://t.me/Cipherteam394" target="_blank" style="background:#0088cc;color:#fff;padding:16px;border-radius:10px;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px">📱 Telegram: @Cipherteam394</a>' +
    '<a href="mailto:globalticaret42@gmail.com" style="background:#7c3aed;color:#fff;padding:16px;border-radius:10px;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px">📧 globalticaret42@gmail.com</a>' +
    '</div>' +
    '<div style="margin-top:24px;padding:14px;background:#f8f8f8;border-radius:8px;font-size:13px;color:#666">' +
    '<b>Calisma Saatleri:</b> Her gun 09:00 - 22:00<br>' +
    '<b>Yanit Suresi:</b> Ortalama 1-2 saat' +
    '</div></div>';
  res.send(layout({ title: 'Iletisim', content: c, s: s }));
});

};
