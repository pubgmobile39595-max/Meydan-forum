const data = require('./data');
const views = require('./views');
const { esc, ago, layout } = views;

module.exports = function(app, session, requireAdmin, config) {

app.get('/admin', function(req, res) {
  var s = session(req, res);
  if (!s.admin) {
    var c = '<div class="form-box"><h1>Admin</h1>' +
      (req.query.hata ? '<div class="alert err">Hatali sifre.</div>' : '') +
      '<form method="post" action="/admin/login">' +
      '<div class="field"><label>Sifre</label><input type="password" name="sifre" required autofocus></div>' +
      '<button class="btn full" type="submit">Giris</button></form>' +
      '<p style="text-align:center;margin-top:16px;font-size:12px;color:#888">Demo: <b>meydan2024</b></p></div>';
    return res.send(layout({ title: 'Admin', content: c, s: s }));
  }
  var tab = String(req.query.tab || 'dashboard');
  var users = data.users.all();
  var topics = data.topics.all();
  var posts = data.posts.all();
  var cats = data.cats.all();

  var stats = '<div class="stats">';
  stats += '<div class="stat"><b>' + users.length + '</b><span>Kullanici</span></div>';
  stats += '<div class="stat"><b>' + topics.length + '</b><span>Konu</span></div>';
  stats += '<div class="stat"><b>' + posts.length + '</b><span>Cevap</span></div>';
  stats += '<div class="stat"><b>' + cats.length + '</b><span>Kategori</span></div>';
  stats += '</div>';

  var tabs = '<div class="tabs">';
  tabs += '<a class="tab ' + (tab === 'dashboard' ? 'on' : '') + '" href="/admin">Dashboard</a>';
  tabs += '<a class="tab ' + (tab === 'konular' ? 'on' : '') + '" href="/admin?tab=konular">Konular</a>';
  tabs += '<a class="tab ' + (tab === 'kullanicilar' ? 'on' : '') + '" href="/admin?tab=kullanicilar">Kullanicilar</a>';
  tabs += '<a class="tab ' + (tab === 'kategoriler' ? 'on' : '') + '" href="/admin?tab=kategoriler">Kategoriler</a>';
  tabs += '<a class="tab ' + (tab === 'sikayetler' ? 'on' : '') + '" href="/admin?tab=sikayetler">Sikayetler' + (data.reports.all().filter(function(r){return r.status==='bekliyor';}).length ? ' (' + data.reports.all().filter(function(r){return r.status==='bekliyor';}).length + ')' : '') + '</a>';
  tabs += '<a class="tab ' + (tab === 'banlar' ? 'on' : '') + '" href="/admin?tab=banlar">Banlar</a>';
  tabs += '<a class="tab ' + (tab === 'log' ? 'on' : '') + '" href="/admin?tab=log">Log</a>';
  tabs += '<a class="tab ' + (tab === 'yedek' ? 'on' : '') + '" href="/admin?tab=yedek">Yedek</a>';
  tabs += '<a class="tab ' + (tab === 'raporlar' ? 'on' : '') + '" href="/admin?tab=raporlar">Raporlar</a>';
  tabs += '<a class="tab" href="/admin/logout">Cikis</a>';
  tabs += '</div>';

  var tc = '';

  if (tab === 'dashboard') {
    var recent = topics.slice(-5).reverse().map(function(t) {
      return '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><a href="/konu/' + t.id + '/' + t.slug + '">' + esc(t.title) + '</a></div>';
    }).join('');
    var topUsers = users.slice().sort(function(a, b) { return (b.reputation || 0) - (a.reputation || 0); }).slice(0, 5).map(function(u) {
      return '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0">' + esc(u.username) + ' - ' + (u.reputation || 0) + ' itibar</div>';
    }).join('');
    tc = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    tc += '<div class="panel"><h3>Son Konular</h3>' + (recent || '<div style="color:#888;padding:10px">Konu yok.</div>') + '</div>';
    tc += '<div class="panel"><h3>En Aktif Kullanicilar</h3>' + (topUsers || '<div style="color:#888;padding:10px">Kullanici yok.</div>') + '</div>';
    tc += '</div>';
  } else if (tab === 'konular') {
    var rows = topics.map(function(t) {
      var au = data.users.byId(t.userId);
      return '<tr><td>#' + t.id + '</td>' +
        '<td>' + esc(t.title) + '</td>' +
        '<td>' + esc(au ? au.username : '?') + '</td>' +
        '<td>' + (t.pinned ? 'SABIT ' : '') + (t.locked ? 'KILITLI' : '') + '</td>' +
        '<td style="white-space:nowrap">' +
        '<form method="post" action="/admin/konu-pin/' + t.id + '" style="display:inline"><button class="btn sm gray" type="submit">' + (t.pinned ? 'Kaldir' : 'Sabitle') + '</button></form> ' +
        '<form method="post" action="/admin/konu-lock/' + t.id + '" style="display:inline"><button class="btn sm gray" type="submit">' + (t.locked ? 'Ac' : 'Kilitle') + '</button></form> ' +
        '<form method="post" action="/admin/konu-sil/' + t.id + '" style="display:inline" onsubmit="return confirm(\'Silinsin mi?\')"><button class="btn sm red" type="submit">Sil</button></form>' +
        '</td></tr>';
    }).join('');
    tc = '<div class="panel" style="overflow-x:auto"><h3>Konular (' + topics.length + ')</h3>' +
      '<table><thead><tr><th>ID</th><th>Baslik</th><th>Yazar</th><th>Durum</th><th>Islem</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } else if (tab === 'kullanicilar') {
    var rows2 = users.map(function(u) {
      return '<tr><td>#' + u.id + '</td>' +
        '<td><a href="/u/' + esc(u.username) + '">' + esc(u.username) + '</a></td>' +
        '<td>' + esc(u.email) + '</td>' +
        '<td>' + (u.reputation || 0) + '</td>' +
        '<td>' + u.role + '</td>' +
        '<td><form method="post" action="/admin/kullanici-rol/' + u.id + '" style="display:inline"><button class="btn sm gray" type="submit">' + (u.role === 'admin' ? 'Uye Yap' : 'Admin Yap') + '</button></form> ' +
        '<form method="post" action="/admin/mod-toggle/' + u.id + '" style="display:inline"><button class="btn sm ' + (data.mods.is(u.id) ? 'red' : 'gray') + '" type="submit">' + (data.mods.is(u.id) ? 'Mod Kaldir' : 'Mod Yap') + '</button></form></td></tr>';
    }).join('');
    tc = '<div class="panel" style="overflow-x:auto"><h3>Kullanicilar</h3>' +
      '<table><thead><tr><th>ID</th><th>Kullanici</th><th>E-posta</th><th>Itibar</th><th>Rol</th><th>Islem</th></tr></thead><tbody>' + rows2 + '</tbody></table></div>';
  } else if (tab === 'kategoriler') {
    var rows3 = cats.map(function(c) {
      var n = data.topics.byCat(c.id).length;
      return '<tr><td>#' + c.id + '</td>' +
        '<td>' + esc(c.name) + '</td>' +
        '<td>' + esc(c.desc) + '</td>' +
        '<td>' + n + '</td>' +
        '<td><form method="post" action="/admin/kategori-sil/' + c.id + '" style="display:inline" onsubmit="return confirm(\'Silinsin mi?\')"><button class="btn sm red" type="submit">Sil</button></form></td></tr>';
    }).join('');
    tc = '<div class="panel" style="margin-bottom:20px"><h3>Yeni Kategori</h3>' +
      '<form method="post" action="/admin/kategori-ekle" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">' +
      '<input type="text" name="name" placeholder="Ad" required style="flex:1;min-width:150px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      '<input type="text" name="emoji" placeholder="Kisa ad" value="Kat" style="width:100px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      '<input type="text" name="desc" placeholder="Aciklama" style="flex:2;min-width:200px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      '<button class="btn" type="submit">Ekle</button></form></div>' +
      '<div class="panel" style="overflow-x:auto"><h3>Kategoriler</h3>' +
      '<table><thead><tr><th>ID</th><th>Ad</th><th>Aciklama</th><th>Konu</th><th>Islem</th></tr></thead><tbody>' + rows3 + '</tbody></table></div>';
  } else if (tab === 'sikayetler') {
    var reps = data.reports.all().slice().sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
    var rowsR = reps.map(function(r) {
      var reporter = data.users.byId(r.reporterId);
      var target = '';
      if (r.type === 'topic') { var t2 = data.topics.byId(r.targetId); target = t2 ? '<a href="/konu/' + t2.id + '/' + t2.slug + '">' + esc(t2.title) + '</a>' : 'Silinmis konu'; }
      else if (r.type === 'post') { var p2 = data.posts.byId(r.targetId); target = p2 ? '<i>' + esc(p2.body.substring(0, 60)) + '</i>' : 'Silinmis cevap'; }
      else if (r.type === 'user') { var u2 = data.users.byId(r.targetId); target = u2 ? '<a href="/u/' + esc(u2.username) + '">' + esc(u2.username) + '</a>' : 'Silinmis kullanici'; }
      return '<tr><td>#' + r.id + '</td>' +
        '<td>' + (reporter ? esc(reporter.username) : '?') + '</td>' +
        '<td>' + r.type + '</td>' +
        '<td>' + target + '</td>' +
        '<td>' + esc(r.reason) + '</td>' +
        '<td>' + ago(r.createdAt) + '</td>' +
        '<td>' + (r.status === 'bekliyor' ? '<span class="tag">Bekliyor</span>' : '<span class="tag" style="background:#dcfce7;color:#15803d">' + r.status + '</span>') + '</td>' +
        '<td style="white-space:nowrap">' +
        (r.status === 'bekliyor' ? '<form method="post" action="/admin/sikayet-onayla/' + r.id + '" style="display:inline"><button class="btn sm red" type="submit">Onayla</button></form> <form method="post" action="/admin/sikayet-reddet/' + r.id + '" style="display:inline"><button class="btn sm gray" type="submit">Reddet</button></form>' : '<form method="post" action="/admin/sikayet-sil/' + r.id + '" style="display:inline"><button class="btn sm gray" type="submit">Sil</button></form>') +
        '</td></tr>';
    }).join('');
    tc = '<div class="panel" style="overflow-x:auto"><h3>Sikayetler (' + reps.length + ')</h3>' +
      '<table><thead><tr><th>ID</th><th>Sikayet Eden</th><th>Tip</th><th>Hedef</th><th>Sebep</th><th>Tarih</th><th>Durum</th><th>Islem</th></tr></thead>' +
      '<tbody>' + (rowsR || '<tr><td colspan="8" style="text-align:center;padding:30px;color:#888">Sikayet yok.</td></tr>') + '</tbody></table></div>';
  } else if (tab === 'banlar') {
    var allBans = data.bans ? [] : [];
    var banRows = users.filter(function(u) { return data.bans.is(u.id); }).map(function(u) {
      var info = data.bans.info(u.id);
      return '<tr><td>' + esc(u.username) + '</td>' +
        '<td>' + esc(info.reason) + '</td>' +
        '<td>' + (info.until ? new Date(info.until).toLocaleDateString('tr-TR') : 'Sinirsiz') + '</td>' +
        '<td>' + ago(info.bannedAt) + '</td>' +
        '<td><form method="post" action="/admin/unban/' + u.id + '" style="display:inline"><button class="btn sm gray" type="submit">Ban Kaldir</button></form></td></tr>';
    }).join('');
    tc = '<div class="panel" style="margin-bottom:20px"><h3>Kullanici Banla</h3>' +
      '<form method="post" action="/admin/ban" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">' +
      '<select name="userId" required style="flex:1;min-width:150px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      users.map(function(u) { return '<option value="' + u.id + '">' + esc(u.username) + '</option>'; }).join('') +
      '</select>' +
      '<input type="text" name="reason" placeholder="Sebep" required style="flex:2;min-width:150px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      '<input type="number" name="days" placeholder="Gun (0=kalici)" value="7" min="0" style="width:140px;padding:10px;border:1px solid #ddd;border-radius:6px">' +
      '<button class="btn red" type="submit">Banla</button></form></div>' +
      '<div class="panel" style="overflow-x:auto"><h3>Aktif Banlar</h3>' +
      '<table><thead><tr><th>Kullanici</th><th>Sebep</th><th>Bitis</th><th>Ban Tarihi</th><th>Islem</th></tr></thead>' +
      '<tbody>' + (banRows || '<tr><td colspan="5" style="text-align:center;padding:30px;color:#888">Ban yok.</td></tr>') + '</tbody></table></div>';
  } else if (tab === 'log') {
    var logs = data.adminLogs.all();
    var logRows = logs.slice(0, 100).map(function(l) {
      var au = data.users.byId(l.adminId);
      return '<tr><td>' + ago(l.createdAt) + '</td><td>' + (au ? esc(au.username) : 'Sistem') + '</td><td>' + esc(l.action) + '</td><td>' + esc(l.detail) + '</td></tr>';
    }).join('');
    tc = '<div class="panel" style="overflow-x:auto"><h3>Admin Log (' + logs.length + ')</h3>' +
      '<table><thead><tr><th>Tarih</th><th>Admin</th><th>Islem</th><th>Detay</th></tr></thead>' +
      '<tbody>' + (logRows || '<tr><td colspan="4" style="text-align:center;padding:30px;color:#888">Log yok.</td></tr>') + '</tbody></table></div>';
  } else if (tab === 'yedek') {
    tc = '<div class="panel" style="margin-bottom:20px"><h3>Yedek Al</h3>' +
      '<p style="color:#888;font-size:13px;margin:10px 0">Tum veriler JSON olarak indirilir.</p>' +
      '<a class="btn" href="/admin/yedek-indir">Yedek Indir</a></div>' +
      '<div class="panel"><h3>Toplu Bildirim</h3>' +
      '<form method="post" action="/admin/toplu-bildirim" style="margin-top:10px">' +
      '<div class="field"><label>Baslik</label><input type="text" name="baslik" required></div>' +
      '<div class="field"><label>Mesaj</label><textarea name="metin" required style="min-height:80px"></textarea></div>' +
      '<button class="btn" type="submit">Tum Kullanicilara Gonder</button></form></div>';
  } else if (tab === 'raporlar') {
    var totalVotes = data.votes.count ? 0 : 0;
    var allVotes = 0;
    topics.forEach(function(t) { allVotes += data.votes.count('topic', t.id); });
    var today = new Date().toISOString().substring(0, 10);
    var todayTopics = topics.filter(function(t) { return t.createdAt.substring(0, 10) === today; }).length;
    var todayPosts = posts.filter(function(p) { return p.createdAt.substring(0, 10) === today; }).length;
    var todayUsers = users.filter(function(u) { return u.createdAt.substring(0, 10) === today; }).length;
    tc = '<div class="stats">';
    tc += '<div class="stat"><b>' + todayTopics + '</b><span>Bugun Konu</span></div>';
    tc += '<div class="stat"><b>' + todayPosts + '</b><span>Bugun Cevap</span></div>';
    tc += '<div class="stat"><b>' + todayUsers + '</b><span>Bugun Uye</span></div>';
    tc += '<div class="stat"><b>' + allVotes + '</b><span>Toplam Oy</span></div>';
    tc += '</div>';
    tc += '<div class="panel"><h3>En Cok Goruntulenen Konular</h3>';
    var topViews = topics.slice().sort(function(a, b) { return (b.views || 0) - (a.views || 0); }).slice(0, 10);
    topViews.forEach(function(t) {
      tc += '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between">' +
        '<a href="/konu/' + t.id + '/' + t.slug + '">' + esc(t.title) + '</a>' +
        '<b>' + (t.views || 0) + '</b></div>';
    });
    tc += '</div>';
  }

  var content = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">' +
    '<h1 class="page" style="margin:0">Admin Panel</h1>' +
    '<a class="btn gray sm" href="/">Site</a></div>';
  content += stats + tabs + tc;
  res.send(layout({ title: 'Admin', content: content, s: s }));
});

app.post('/admin/login', function(req, res) {
  var s = session(req, res);
  if (String(req.body.sifre || '') === config.ADMIN_PASS) { s.admin = true; return res.redirect('/admin'); }
  res.redirect('/admin?hata=1');
});

app.get('/admin/logout', function(req, res) {
  var s = session(req, res);
  s.admin = false;
  res.redirect('/');
});

app.post('/admin/konu-sil/:id', requireAdmin, function(req, res) {
  data.topics.remove(parseInt(req.params.id, 10));
  res.redirect('/admin?tab=konular');
});

app.post('/admin/konu-pin/:id', requireAdmin, function(req, res) {
  var t = data.topics.byId(parseInt(req.params.id, 10));
  if (t) data.topics.update(t.id, { pinned: !t.pinned });
  res.redirect('/admin?tab=konular');
});

app.post('/admin/konu-lock/:id', requireAdmin, function(req, res) {
  var t = data.topics.byId(parseInt(req.params.id, 10));
  if (t) data.topics.update(t.id, { locked: !t.locked });
  res.redirect('/admin?tab=konular');
});

app.post('/admin/kullanici-rol/:id', requireAdmin, function(req, res) {
  var u = data.users.byId(parseInt(req.params.id, 10));
  if (u) data.users.update(u.id, { role: u.role === 'admin' ? 'user' : 'admin' });
  res.redirect('/admin?tab=kullanicilar');
});

app.post('/admin/kategori-ekle', requireAdmin, function(req, res) {
  var n = String(req.body.name || '').trim();
  if (!n) return res.redirect('/admin?tab=kategoriler');
  data.cats.add({
    slug: data.slugify(n),
    name: n,
    emoji: String(req.body.emoji || 'Kat').trim() || 'Kat',
    desc: String(req.body.desc || '').trim()
  });
  res.redirect('/admin?tab=kategoriler');
});

app.post('/admin/kategori-sil/:id', requireAdmin, function(req, res) {
  data.cats.remove(parseInt(req.params.id, 10));
  res.redirect('/admin?tab=kategoriler');
});

app.post('/admin/sikayet-onayla/:id', requireAdmin, function(req, res) {
  data.reports.update(parseInt(req.params.id, 10), { status: 'onaylandi' });
  res.redirect('/admin?tab=sikayetler');
});

app.post('/admin/sikayet-reddet/:id', requireAdmin, function(req, res) {
  data.reports.update(parseInt(req.params.id, 10), { status: 'reddedildi' });
  res.redirect('/admin?tab=sikayetler');
});

app.post('/admin/sikayet-sil/:id', requireAdmin, function(req, res) {
  data.reports.remove(parseInt(req.params.id, 10));
  res.redirect('/admin?tab=sikayetler');
});

app.post('/admin/ban', requireAdmin, function(req, res) {
  var s = session(req, res);
  var uid = parseInt(req.body.userId, 10);
  var reason = String(req.body.reason || '').substring(0, 200);
  var days = parseInt(req.body.days, 10) || 0;
  if (uid && reason) {
    data.bans.ban(uid, reason, days, s.admin ? 1 : 0);
    data.adminLogs.add(1, 'Ban', 'Kullanici #' + uid + ' - ' + reason);
  }
  res.redirect('/admin?tab=banlar');
});

app.post('/admin/unban/:id', requireAdmin, function(req, res) {
  var uid = parseInt(req.params.id, 10);
  data.bans.unban(uid);
  data.adminLogs.add(1, 'Unban', 'Kullanici #' + uid);
  res.redirect('/admin?tab=banlar');
});

app.get('/admin/yedek-indir', requireAdmin, function(req, res) {
  var path = require('path');
  var fs = require('fs');
  var files = ['u.json', 't.json', 'p.json', 'v.json', 'c.json', 'n.json', 'r.json', 'b.json', 'f.json', 'm.json', 'bl.json', 'ban.json', 'rep.json', 'log.json'];
  var backup = { tarih: new Date().toISOString(), veriler: {} };
  files.forEach(function(f) {
    var p = path.join(__dirname, f);
    if (fs.existsSync(p)) { try { backup.veriler[f] = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {} }
  });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=meydan-yedek-' + Date.now() + '.json');
  res.send(JSON.stringify(backup, null, 2));
});

app.post('/admin/toplu-bildirim', requireAdmin, function(req, res) {
  var baslik = String(req.body.baslik || '').trim();
  var metin = String(req.body.metin || '').trim();
  if (!baslik || !metin) return res.redirect('/admin?tab=yedek');
  var users = data.users.all();
  users.forEach(function(u) {
    data.notifications.add(u.id, baslik + ': ' + metin, '/');
  });
  data.save();
  data.adminLogs.add(1, 'Toplu Bildirim', baslik);
  res.redirect('/admin?tab=yedek&ok=1');
});


app.post('/admin/mod-toggle/:id', requireAdmin, function(req, res) {
  var uid = parseInt(req.params.id, 10);
  if (data.mods.is(uid)) {
    data.mods.remove(uid);
    data.adminLogs.add(1, 'Mod Kaldir', '#' + uid);
  } else {
    data.mods.add(uid);
    data.notifications.add(uid, 'Moderator olarak atandiniz!', '/mod');
    data.save();
    data.adminLogs.add(1, 'Mod Ata', '#' + uid);
  }
  res.redirect('/admin?tab=kullanicilar');
});

};
