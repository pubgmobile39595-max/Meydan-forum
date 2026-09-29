const data = require('./data');
const views = require('./views');
const { esc, ago, initials, layout } = views;

module.exports = function(app, session, requireUser) {

app.get('/kayit', function(req, res) {
  var s = session(req, res);
  if (s.userId) return res.redirect('/');
  var c = '<div class="form-box"><h1>Kayit Ol</h1>' +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/kayit">' +
    '<div class="field"><label>Kullanici Adi</label><input type="text" name="username" required minlength="3" maxlength="20"></div>' +
    '<div class="field"><label>E-posta</label><input type="email" name="email" required></div>' +
    '<div class="field"><label>Sifre</label><input type="password" name="password" required minlength="4"></div>' +
    '<button class="btn full" type="submit">Kayit Ol</button></form>' +
    '<p style="margin-top:16px;text-align:center"><a href="/giris" style="color:#7c3aed">Giris yap</a></p></div>';
  res.send(layout({ title: 'Kayit', content: c, s: s }));
});

app.post('/kayit', function(req, res) {
  var b = req.body;
  var u = String(b.username || '').trim();
  var e = String(b.email || '').trim();
  var p = String(b.password || '');
  if (u.length < 3) return res.redirect('/kayit?hata=' + encodeURIComponent('Kullanici adi en az 3 karakter.'));
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return res.redirect('/kayit?hata=' + encodeURIComponent('Sadece harf, rakam, _ .'));
  if (data.users.byName(u)) return res.redirect('/kayit?hata=' + encodeURIComponent('Kullanici adi alinmis.'));
  if (data.users.byEmail(e)) return res.redirect('/kayit?hata=' + encodeURIComponent('E-posta kayitli.'));
  if (p.length < 4) return res.redirect('/kayit?hata=' + encodeURIComponent('Sifre en az 4 karakter.'));
  var nu = data.users.create(u, e, p);
  try { var mailer = require('./mailer'); mailer.welcome(nu); } catch (ex) {}
  var s = session(req, res);
  s.userId = nu.id;
  res.redirect('/');
});

app.get('/giris', function(req, res) {
  var s = session(req, res);
  if (s.userId) return res.redirect('/');
  var c = '<div class="form-box"><h1>Giris Yap</h1>' +
    (req.query.hata ? '<div class="alert err">Hatali giris.</div>' : '') +
    '<form method="post" action="/giris">' +
    '<div class="field"><label>Kullanici Adi veya E-posta</label><input type="text" name="login" required autofocus></div>' +
    '<div class="field"><label>Sifre</label><input type="password" name="password" required></div>' +
    '<button class="btn full" type="submit">Giris Yap</button></form>' +
    '<p style="margin-top:16px;text-align:center"><a href="/kayit" style="color:#7c3aed">Kayit ol</a></p></div>';
  res.send(layout({ title: 'Giris', content: c, s: s }));
});

app.post('/giris', function(req, res) {
  var login = String(req.body.login || '').trim();
  var p = String(req.body.password || '');
  var u = data.users.byName(login) || data.users.byEmail(login);
  if (!u || u.password !== data.hash(p)) return res.redirect('/giris?hata=1');
  var s = session(req, res);
  s.userId = u.id;
  res.redirect('/');
});

app.post('/cikis', function(req, res) {
  var s = session(req, res);
  s.userId = null; s.admin = false;
  res.redirect('/');
});

app.get('/u/:username', function(req, res) {
  var s = session(req, res);
  var u = data.users.byName(req.params.username);
  if (!u) return res.redirect('/');
  var ts = data.topics.byUser(u.id);
  var ps = data.posts.byUser(u.id);
  var list = ts.map(function(t) { return views.topicCard(t, s); }).join('');
  var head = '<div class="profile-head">';
  head += views.avatarImg(u, 90);
  head += '<div style="flex:1">';
  head += '<h1 style="margin:0;font-size:24px">' + esc(u.username);
  var uTitle = data.economy.getTitle(u.id);
  if (uTitle) head += ' <span style="background:' + uTitle.color + ';color:#fff;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;vertical-align:middle">' + views.esc(uTitle.name) + '</span>';
  if (data.economy.isVip(u.id)) head += ' <span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;vertical-align:middle">VIP</span>';
  head += '</h1>';
  if (u.bio) head += '<p style="color:#666;font-size:14px;margin-top:6px">' + esc(u.bio) + '</p>';
  head += '<div style="margin-top:10px">' + views.followBtn(s, u) + views.blockBtn(s, u);
  if (s.userId && s.userId !== u.id && !data.blocks.is(u.id, s.userId)) head += '<a class="btn sm" href="/mesaj/' + esc(u.username) + '" style="margin-left:8px">Mesaj Gonder</a>';
  head += '<a class="btn sm gray" href="/takip/' + esc(u.username) + '" style="margin-left:8px">Takipci/Takip</a>';
  head += '</div>';
  var lvl = data.level(u.id);
  var pct = lvl.next ? Math.min(100, Math.round((lvl.level - lvl.min) / (lvl.next - lvl.min) * 100)) : 100;
  head += '<div style="margin-top:14px">';
  head += '<span style="background:' + lvl.color + ';color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800">' + lvl.name + '</span>';
  head += '<div style="margin-top:8px;font-size:12px;color:#888">Skor: <b style="color:' + lvl.color + '">' + lvl.level + '</b>';
  if (lvl.next) head += ' (' + lvl.nextName + ' icin ' + (lvl.next - lvl.level) + ' kaldi)';
  head += '</div>';
  head += '<div style="background:#f0f0f0;height:8px;border-radius:4px;overflow:hidden;margin-top:6px;max-width:400px">';
  head += '<div style="width:' + pct + '%;height:100%;background:' + lvl.color + '"></div></div>';
  head += '</div>';
  // Rozetler
  var userBadges = u.badges || [];
  var allBadges = data.badges.all();
  if (userBadges.length) {
    head += '<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;color:#666;text-transform:uppercase;margin-bottom:8px">Rozetler (' + userBadges.length + ')</div>';
    head += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    allBadges.forEach(function(b) {
      if (userBadges.indexOf(b.id) > -1) {
        head += '<div title="' + views.esc(b.desc) + '" style="background:#fef3c7;border:1px solid #f59e0b;color:#92400e;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700">' + views.esc(b.icon) + ' ' + views.esc(b.name) + '</div>';
      }
    });
    head += '</div></div>';
  }
  head += '<div class="profile-stats">';
  head += '<span><b>' + (u.reputation || 0) + '</b> itibar</span>';
  head += '<span><b>' + data.economy.points(u.id) + '</b> puan</span>';
  head += '<span><b>' + ts.length + '</b> konu</span>';
  head += '<span><b>' + ps.length + '</b> cevap</span>';
  var fCount = data.follows.followers(u.id).length;
  var gCount = data.follows.following(u.id).length;
  head += '<span><b>' + fCount + '</b> takipci</span>';
  head += '<span><b>' + gCount + '</b> takip</span>';
  head += '<span>Uyelik: ' + new Date(u.createdAt).toLocaleDateString('tr-TR') + '</span>';
  head += '</div></div></div>';
  var content = head + '<h2 class="sec">Konulari</h2>' +
    (list || '<div class="panel" style="text-align:center;padding:30px;color:#888">Henuz konu yok.</div>');
  res.send(layout({ title: u.username, content: content, s: s }));
});

app.get('/ayarlar', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var c = '<div class="form-box" style="max-width:600px"><h1>Hesap Ayarlari</h1>' +
    (req.query.ok ? '<div class="alert ok">Kaydedildi.</div>' : '') +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/ayarlar">' +
    '<div class="field"><label>Kullanici Adi</label><input type="text" value="' + esc(u.username) + '" disabled></div>' +
    '<div class="field"><label>E-posta</label><input type="email" value="' + esc(u.email) + '" disabled></div>' +
    '<div class="field"><label>Hakkinda</label><textarea name="bio" maxlength="300" placeholder="Kendinden bahset...">' + esc(u.bio || '') + '</textarea></div>' +
    '<div class="field"><label>Konum</label><input type="text" name="location" value="' + esc(u.location || '') + '" maxlength="50"></div>' +
    '<div class="field"><label>Website</label><input type="url" name="website" value="' + esc(u.website || '') + '" maxlength="100"></div>' +
    '<div class="field"><label>Avatar (Resim URL)</label><input type="url" name="avatar" value="' + esc(u.avatar || '') + '" placeholder="https://..." maxlength="500"></div>' +
    '<button class="btn full" type="submit">Kaydet</button></form>' +
    '<div class="panel" style="margin-top:20px"><h3 style="margin-bottom:10px">Tarayici Bildirimleri</h3>' +
    '<p style="font-size:13px;color:#666;margin-bottom:12px">Yeni bildirim geldiginde tarayicidan uyari al.</p>' +
    '<button class="btn" onclick="enablePush()" type="button">Bildirimleri Ac</button></div></div>';
  res.send(layout({ title: 'Ayarlar', content: c, s: s }));
});

app.post('/ayarlar', requireUser, function(req, res) {
  var s = session(req, res);
  data.users.update(s.userId, {
    bio: String(req.body.bio || '').substring(0, 300),
    location: String(req.body.location || '').substring(0, 50),
    website: String(req.body.website || '').substring(0, 100),
    avatar: String(req.body.avatar || '').substring(0, 500)
  });
  res.redirect('/ayarlar?ok=1');
});

app.get('/sifre-degistir', requireUser, function(req, res) {
  var s = session(req, res);
  var c = '<div class="form-box"><h1>Sifre Degistir</h1>' +
    (req.query.ok ? '<div class="alert ok">Sifre degistirildi.</div>' : '') +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/sifre-degistir">' +
    '<div class="field"><label>Mevcut Sifre</label><input type="password" name="old" required></div>' +
    '<div class="field"><label>Yeni Sifre</label><input type="password" name="new1" required minlength="4"></div>' +
    '<div class="field"><label>Yeni Sifre (tekrar)</label><input type="password" name="new2" required minlength="4"></div>' +
    '<button class="btn full" type="submit">Degistir</button></form></div>';
  res.send(layout({ title: 'Sifre', content: c, s: s }));
});

app.post('/sifre-degistir', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var old = String(req.body.old || '');
  var n1 = String(req.body.new1 || '');
  var n2 = String(req.body.new2 || '');
  if (u.password !== data.hash(old)) return res.redirect('/sifre-degistir?hata=' + encodeURIComponent('Mevcut sifre hatali.'));
  if (n1.length < 4) return res.redirect('/sifre-degistir?hata=' + encodeURIComponent('Yeni sifre en az 4 karakter.'));
  if (n1 !== n2) return res.redirect('/sifre-degistir?hata=' + encodeURIComponent('Yeni sifreler uyusmuyor.'));
  data.users.update(s.userId, { password: data.hash(n1) });
  res.redirect('/sifre-degistir?ok=1');
});

app.get('/bildirimler', requireUser, function(req, res) {
  var s = session(req, res);
  var list = data.notifications.byUser(s.userId);
  data.notifications.markRead(s.userId);
  var html = list.length ? list.map(function(n) {
    return '<a href="' + esc(n.link) + '" class="panel" style="display:block;margin-bottom:8px;' + (n.read ? '' : 'background:#ede9fe') + '">' +
      '<div style="font-size:14px">' + esc(n.text) + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:4px">' + ago(n.createdAt) + '</div></a>';
  }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Bildirim yok.</div>';
  res.send(layout({ title: 'Bildirimler', content: '<h1 class="page">Bildirimler</h1>' + html, s: s }));
});

app.get('/rozetler', function(req, res) {
  var s = session(req, res);
  var all = data.badges.all();
  var me = s.userId ? data.users.byId(s.userId) : null;
  var myBadges = me && me.badges ? me.badges : [];
  var html = all.map(function(b) {
    var has = myBadges.indexOf(b.id) > -1;
    return '<div class="panel" style="display:flex;gap:14px;align-items:center;margin-bottom:8px;' + (has ? '' : 'opacity:.5') + '">' +
      '<div style="width:50px;height:50px;background:' + (has ? '#fef3c7' : '#f0f0f0') + ';border:2px solid ' + (has ? '#f59e0b' : '#ddd') + ';border-radius:50%;display:grid;place-items:center;font-weight:800;color:' + (has ? '#92400e' : '#999') + ';font-size:18px">' + views.esc(b.icon) + '</div>' +
      '<div style="flex:1"><div style="font-weight:700">' + views.esc(b.name) + (has ? ' <span style="color:#16a34a;font-size:11px">KAZANILDIN</span>' : '') + '</div>' +
      '<div style="font-size:12px;color:#888;margin-top:2px">' + views.esc(b.desc) + '</div></div>' +
      '</div>';
  }).join('');
  var top = data.topUsers(10);
  var lb = top.map(function(u) {
    var cnt = (u.badges || []).length;
    var lvl = data.level(u.id);
    return '<a href="/u/' + views.esc(u.username) + '" class="panel" style="display:flex;gap:14px;align-items:center;margin-bottom:6px">' +
      '<div class="topic-avatar">' + views.initials(u.username) + '</div>' +
      '<div style="flex:1"><div style="font-weight:700">' + views.esc(u.username) + '</div>' +
      '<div style="font-size:12px;color:#888;margin-top:2px"><span style="color:' + lvl.color + ';font-weight:700">' + lvl.name + '</span> · ' + cnt + ' rozet · ' + (u.reputation || 0) + ' itibar</div></div>' +
      '<div style="font-size:20px;font-weight:800;color:#7c3aed">' + lvl.level + '</div></a>';
  }).join('');
  var content = '<h1 class="page">Rozetler ve Seviyeler</h1>';
  content += '<h2 class="sec">Tum Rozetler</h2>' + html;
  content += '<h2 class="sec" style="margin-top:24px">Skor Siralama</h2>' + lb;
  res.send(layout({ title: 'Rozetler', content: content, s: s }));
});

app.get('/ayarlar-bildirim', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  if (!u.prefs) u.prefs = { email: true, browser: true, replies: true, mentions: true, follows: true };
  var c = '<div class="form-box" style="max-width:520px"><h1>Bildirim Tercihleri</h1>' +
    (req.query.ok ? '<div class="alert ok">Kaydedildi.</div>' : '') +
    '<form method="post" action="/ayarlar-bildirim">' +
    '<label style="display:flex;gap:10px;padding:10px 0;cursor:pointer"><input type="checkbox" name="email" value="1" ' + (u.prefs.email ? 'checked' : '') + '> E-posta bildirimleri</label>' +
    '<label style="display:flex;gap:10px;padding:10px 0;cursor:pointer"><input type="checkbox" name="browser" value="1" ' + (u.prefs.browser ? 'checked' : '') + '> Tarayici bildirimleri</label>' +
    '<label style="display:flex;gap:10px;padding:10px 0;cursor:pointer"><input type="checkbox" name="replies" value="1" ' + (u.prefs.replies ? 'checked' : '') + '> Konularima cevap geldiginde</label>' +
    '<label style="display:flex;gap:10px;padding:10px 0;cursor:pointer"><input type="checkbox" name="mentions" value="1" ' + (u.prefs.mentions ? 'checked' : '') + '> Benden bahsedildiginde</label>' +
    '<label style="display:flex;gap:10px;padding:10px 0;cursor:pointer"><input type="checkbox" name="follows" value="1" ' + (u.prefs.follows ? 'checked' : '') + '> Yeni takipci</label>' +
    '<button class="btn full" type="submit" style="margin-top:14px">Kaydet</button></form>' +
    '<div style="margin-top:20px;padding:14px;background:#f8f8f8;border-radius:8px;font-size:12px;color:#666">' +
    'E-posta bildirimleri <b>mails.log</b> dosyasina yazilir (demo).</div></div>';
  res.send(layout({ title: 'Bildirim Ayarlari', content: c, s: s }));
});

app.post('/ayarlar-bildirim', requireUser, function(req, res) {
  var s = session(req, res);
  data.users.update(s.userId, { prefs: {
    email: !!req.body.email,
    browser: !!req.body.browser,
    replies: !!req.body.replies,
    mentions: !!req.body.mentions,
    follows: !!req.body.follows
  }});
  res.redirect('/ayarlar-bildirim?ok=1');
});

app.get('/eposta-loglari', function(req, res) {
  var s = session(req, res);
  if (!s.admin) return res.redirect('/');
  var fs2 = require('fs');
  var path2 = require('path');
  var logPath = path2.join(__dirname, 'mails.log');
  var content = '';
  try { content = fs2.readFileSync(logPath, 'utf8').split('\n').slice(-100).join('\n'); } catch (e) { content = 'Log yok.'; }
  res.send(layout({ title: 'E-posta Loglari', content: '<h1 class="page">E-posta Loglari (son 100)</h1><pre style="background:#1e1e1e;color:#eee;padding:16px;border-radius:8px;overflow-x:auto;font-size:12px;white-space:pre-wrap">' + esc(content) + '</pre>', s: s }));
});

};
