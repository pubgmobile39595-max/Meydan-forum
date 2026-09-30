const data = require('./data');
const views = require('./views');
const settings = require('./settings');
const { esc, layout } = views;

module.exports = function(app, session) {

function requireAdmin(req, res, next) {
  var s = session(req, res);
  if (!s.admin) return res.redirect('/admin');
  next();
}

app.get('/admin/ayarlar', requireAdmin, function(req, res) {
  var s = session(req, res);
  var st = settings.load();

  function f(label, name, value, type) {
    type = type || 'text';
    var h = '<div style="margin-bottom:14px"><label style="display:block;font-weight:700;margin-bottom:6px;font-size:13px">' + esc(label) + '</label>';
    if (type === 'textarea') h += '<textarea name="' + name + '" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;min-height:80px;font-family:inherit">' + esc(value || '') + '</textarea>';
    else if (type === 'checkbox') h += '<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="' + name + '" ' + (value ? 'checked' : '') + ' style="width:18px;height:18px"> Acik</label>';
    else if (type === 'color') h += '<input type="color" name="' + name + '" value="' + esc(value || '#7c3aed') + '" style="width:80px;height:44px;border:1px solid #ddd;border-radius:6px;cursor:pointer">';
    else h += '<input type="' + type + '" name="' + name + '" value="' + esc(value || '') + '" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px">';
    h += '</div>';
    return h;
  }

  var c = '<h1 class="page">Site Ayarlari</h1>';
  if (req.query.ok) c += '<div class="alert ok" style="margin-bottom:16px">Ayarlar kaydedildi.</div>';
  if (req.query.hata) c += '<div class="alert err" style="margin-bottom:16px">Hata: ' + esc(req.query.hata) + '</div>';

  c += '<div class="panel"><form method="post" action="/admin/ayarlar-kaydet">';
  c += '<h3 style="margin-bottom:14px">Kimlik</h3>';
  c += f('Site Adi', 'siteName', st.siteName);
  c += f('Slogan', 'siteTagline', st.siteTagline);
  c += f('Site Aciklamasi', 'siteDescription', st.siteDescription, 'textarea');
  c += f('Logo Emoji', 'logoEmoji', st.logoEmoji);

  c += '<h3 style="margin:24px 0 14px">Tema</h3>';
  c += f('Ana Renk', 'primaryColor', st.primaryColor, 'color');
  c += f('Ikincil Renk', 'secondaryColor', st.secondaryColor, 'color');

  c += '<h3 style="margin:24px 0 14px">Iletisim</h3>';
  c += f('Telegram', 'telegram', st.telegram);
  c += f('Telegram Link', 'telegramUrl', st.telegramUrl);
  c += f('E-posta', 'email', st.email, 'email');
  c += f('Footer Yazisi', 'footerText', st.footerText);

  c += '<h3 style="margin:24px 0 14px">Ozellikler</h3>';
  c += f('Bakim Modu', 'maintenanceMode', st.maintenanceMode, 'checkbox');
  c += f('Kayit Acik', 'registrationOpen', st.registrationOpen, 'checkbox');
  c += f('Konu Acma Acik', 'topicsOpen', st.topicsOpen, 'checkbox');
  c += f('Yorum Acik', 'commentsOpen', st.commentsOpen, 'checkbox');
  c += f('Hosgeldin Mesaji', 'welcomeMessage', st.welcomeMessage, 'textarea');

  c += '<button class="btn full" type="submit" style="margin-top:20px">KAYDET</button></form></div>';

  c += '<div class="panel" style="margin-top:20px"><h3 style="margin-bottom:14px">Admin Sifre Degistir</h3><form method="post" action="/admin/sifre-degistir">';
  c += '<div style="margin-bottom:14px"><label style="display:block;font-weight:700;margin-bottom:6px;font-size:13px">Mevcut Sifre</label><input type="password" name="mevcut" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px"></div>';
  c += '<div style="margin-bottom:14px"><label style="display:block;font-weight:700;margin-bottom:6px;font-size:13px">Yeni Sifre</label><input type="password" name="yeni" required minlength="6" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px"></div>';
  c += '<div style="margin-bottom:14px"><label style="display:block;font-weight:700;margin-bottom:6px;font-size:13px">Yeni Sifre (tekrar)</label><input type="password" name="yeni2" required minlength="6" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px"></div>';
  c += '<button class="btn" type="submit">Sifreyi Degistir</button></form></div>';

  c += '<div style="margin-top:16px"><a href="/admin">&larr; Admin Panele Don</a></div>';
  res.send(layout({ title: 'Ayarlar', content: c, s: s }));
});

app.post('/admin/ayarlar-kaydet', requireAdmin, function(req, res) {
  var b = req.body || {};
  settings.update({
    siteName: String(b.siteName || '').trim() || 'Meydan',
    siteTagline: String(b.siteTagline || '').trim(),
    siteDescription: String(b.siteDescription || '').trim(),
    logoEmoji: String(b.logoEmoji || '').trim(),
    primaryColor: String(b.primaryColor || '#7c3aed').trim(),
    secondaryColor: String(b.secondaryColor || '#6d28d9').trim(),
    telegram: String(b.telegram || '').trim(),
    telegramUrl: String(b.telegramUrl || '').trim(),
    email: String(b.email || '').trim(),
    footerText: String(b.footerText || '').trim(),
    maintenanceMode: !!b.maintenanceMode,
    registrationOpen: !!b.registrationOpen,
    topicsOpen: !!b.topicsOpen,
    commentsOpen: !!b.commentsOpen,
    welcomeMessage: String(b.welcomeMessage || '').trim()
  });
  res.redirect('/admin/ayarlar?ok=1');
});

app.post('/admin/sifre-degistir', requireAdmin, function(req, res) {
  var b = req.body || {};
  var st = settings.load();
  if (String(b.mevcut || '') !== st.adminPassword) return res.redirect('/admin/ayarlar?hata=mevcut-sifre-yanlis');
  if (String(b.yeni || '').length < 6) return res.redirect('/admin/ayarlar?hata=sifre-cok-kisa');
  if (b.yeni !== b.yeni2) return res.redirect('/admin/ayarlar?hata=sifreler-eslesmedi');
  settings.update({ adminPassword: String(b.yeni) });
  res.redirect('/admin/ayarlar?ok=1');
});

};
