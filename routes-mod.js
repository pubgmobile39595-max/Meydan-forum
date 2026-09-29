const data = require('./data');
const views = require('./views');
const { esc, ago, layout } = views;

module.exports = function(app, session, requireUser) {

// Yasakli kelime kontrolu
app.get('/mod/yasakli-kelimeler', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  var list = data.bannedWords.all();
  var html = list.length ? list.map(function(w) {
    return '<span style="display:inline-flex;gap:6px;align-items:center;background:#fee2e2;color:#b91c1c;padding:6px 12px;border-radius:999px;margin:4px;font-size:13px;font-weight:700">' + esc(w) +
      ' <form method="post" action="/mod/yasakli-sil" style="display:inline"><input type="hidden" name="word" value="' + esc(w) + '"><button style="background:transparent;border:0;color:#b91c1c;cursor:pointer;font-weight:800">x</button></form></span>';
  }).join('') : '<div style="color:#888">Yasakli kelime yok.</div>';
  var c = '<h1 class="page">Yasakli Kelimeler</h1>' +
    (req.query.ok ? '<div class="alert ok">Eklendi.</div>' : '') +
    (req.query.silindi ? '<div class="alert info">Silindi.</div>' : '') +
    '<div class="panel" style="margin-bottom:20px"><form method="post" action="/mod/yasakli-ekle" style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<input type="text" name="word" placeholder="Kelime" required style="flex:1;min-width:200px;padding:11px;border:1px solid #ddd;border-radius:6px">' +
    '<button class="btn" type="submit">Ekle</button></form></div>' +
    '<div class="panel">' + html + '</div>';
  res.send(layout({ title: 'Yasakli Kelimeler', content: c, s: s }));
});

app.post('/mod/yasakli-ekle', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  var word = String(req.body.word || '').trim();
  if (word) {
    data.bannedWords.add(word);
    if (s.admin) data.adminLogs.add(1, 'Yasakli Kelime Ekle', word);
  }
  res.redirect('/mod/yasakli-kelimeler?ok=1');
});

app.post('/mod/yasakli-sil', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  data.bannedWords.remove(String(req.body.word || ''));
  res.redirect('/mod/yasakli-kelimeler?silindi=1');
});

// Onay kuyrugu
app.get('/mod/onay-kuyrugu', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  var list = data.pending.all();
  var html = list.length ? list.map(function(p) {
    var u = data.users.byId(p.userId);
    var c = data.cats.byId(p.data.categoryId);
    return '<div class="panel" style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">' +
      '<div><b style="font-size:15px">' + esc(p.data.title) + '</b>' +
      '<div style="font-size:12px;color:#888;margin-top:3px">' + esc(u ? u.username : '?') + ' - ' + (c ? esc(c.name) : '?') + ' - ' + ago(p.createdAt) + '</div></div>' +
      '<div style="display:flex;gap:6px">' +
      '<form method="post" action="/mod/onayla/' + p.id + '" style="display:inline"><button class="btn green sm" type="submit">Onayla</button></form>' +
      '<form method="post" action="/mod/reddet/' + p.id + '" style="display:inline"><button class="btn red sm" type="submit">Reddet</button></form>' +
      '</div></div>' +
      '<div style="background:#f8f8f8;padding:12px;border-radius:6px;font-size:13px;color:#555;white-space:pre-wrap;max-height:150px;overflow-y:auto">' + esc(p.data.body.substring(0, 500)) + '</div>' +
      '</div>';
  }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Onay bekleyen konu yok.</div>';
  var c = '<h1 class="page">Onay Kuyrugu</h1>' +
    (req.query.onaylandi ? '<div class="alert ok">Konu yayinlandi.</div>' : '') +
    (req.query.reddedildi ? '<div class="alert info">Konu reddedildi.</div>' : '') +
    '<p style="color:#888;font-size:13px;margin-bottom:16px">Yeni uyelerin (10 itibar alti) actigi konular onay bekler.</p>' +
    html;
  res.send(layout({ title: 'Onay Kuyrugu', content: c, s: s }));
});

app.post('/mod/onayla/:id', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  var t = data.pending.approve(parseInt(req.params.id, 10));
  if (t) {
    data.notifications.add(t.userId, 'Konunuz onaylandi: ' + t.title, '/konu/' + t.id + '/' + t.slug);
    data.save();
  }
  if (s.admin) data.adminLogs.add(1, 'Konu Onayla', '#' + req.params.id);
  res.redirect('/mod/onay-kuyrugu?onaylandi=1');
});

app.post('/mod/reddet/:id', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  data.pending.reject(parseInt(req.params.id, 10));
  if (s.admin) data.adminLogs.add(1, 'Konu Reddet', '#' + req.params.id);
  res.redirect('/mod/onay-kuyrugu?reddedildi=1');
});

// Moderator paneli
app.get('/mod', function(req, res) {
  var s = session(req, res);
  if (!s.admin && !(s.userId && data.mods.is(s.userId))) return res.redirect('/');
  var c = '<h1 class="page">Moderator Paneli</h1>' +
    '<div class="stats">' +
    '<div class="stat"><b>' + data.pending.count() + '</b><span>Onay Bekleyen</span></div>' +
    '<div class="stat"><b>' + data.bannedWords.all().length + '</b><span>Yasakli Kelime</span></div>' +
    '<div class="stat"><b>' + data.reports.all().filter(function(r) { return r.status === "bekliyor"; }).length + '</b><span>Sikayetler</span></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' +
    '<a href="/mod/onay-kuyrugu" class="panel" style="display:block;text-align:center;padding:30px"><div style="font-size:40px">Onay</div><div style="font-weight:700;margin-top:8px">Onay Kuyrugu</div></a>' +
    '<a href="/mod/yasakli-kelimeler" class="panel" style="display:block;text-align:center;padding:30px"><div style="font-size:40px">Yasak</div><div style="font-weight:700;margin-top:8px">Yasakli Kelimeler</div></a>' +
    '<a href="/admin?tab=sikayetler" class="panel" style="display:block;text-align:center;padding:30px"><div style="font-size:40px">Sikayet</div><div style="font-weight:700;margin-top:8px">Sikayetler</div></a>' +
    '<a href="/admin?tab=banlar" class="panel" style="display:block;text-align:center;padding:30px"><div style="font-size:40px">Ban</div><div style="font-weight:700;margin-top:8px">Banlar</div></a>' +
    '</div>';
  res.send(layout({ title: 'Moderator', content: c, s: s }));
});

};
