const fs = require('fs');

// routes-forum.js — @bahsetme + mail
let t = fs.readFileSync('routes-forum.js', 'utf8');
if (t.indexOf('processMentions') === -1) {
  // Konu açma
  t = t.replace(
    "  data.badges.check(s.userId);\n  res.redirect('/konu/' + t.id + '/' + t.slug);",
    "  data.processMentions(body, s.userId, '/konu/' + t.id + '/' + t.slug);\n  data.badges.check(s.userId);\n  res.redirect('/konu/' + t.id + '/' + t.slug);"
  );
  // Cevap
  t = t.replace(
    "  data.badges.check(s.userId);\n  if (t.userId !== s.userId) {",
    "  data.processMentions(body, s.userId, '/konu/' + t.id + '/' + t.slug);\n  data.badges.check(s.userId);\n  if (t.userId !== s.userId) {"
  );
  // Cevap bildirimine mail de ekle
  t = t.replace(
    "    data.notifications.add(t.userId, u.username + ' konunuza cevap yazdi: ' + t.title, '/konu/' + t.id + '/' + t.slug);\n    data.save();",
    "    data.notifications.add(t.userId, u.username + ' konunuza cevap yazdi: ' + t.title, '/konu/' + t.id + '/' + t.slug);\n    try { var mailer = require('./mailer'); var tu = data.users.byId(t.userId); if (tu) mailer.newReply(tu, t, u); } catch (e) {}\n    data.save();"
  );
  fs.writeFileSync('routes-forum.js', t);
  console.log('forum OK');
} else console.log('forum var');

// routes-auth.js — hos geldin maili + bildirim tercihleri
let a = fs.readFileSync('routes-auth.js', 'utf8');
if (a.indexOf('ayarlar-bildirim') === -1) {
  a = a.replace(
    "  var nu = data.users.create(u, e, p);",
    "  var nu = data.users.create(u, e, p);\n  try { var mailer = require('./mailer'); mailer.welcome(nu); } catch (ex) {}"
  );
  const ek = `
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
`;
  a = a.replace('\n};', ek + '\n};');
  fs.writeFileSync('routes-auth.js', a);
  console.log('auth OK');
} else console.log('auth var');
