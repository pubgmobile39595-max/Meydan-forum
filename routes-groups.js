const data = require('./data');
const views = require('./views');
const { esc, ago, initials, layout, topicCard } = views;

module.exports = function(app, session, requireUser) {

app.get('/gruplar', function(req, res) {
  var s = session(req, res);
  var all = data.groups.all().sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
  var myGroups = s.userId ? data.groups.ofUser(s.userId).map(function(g) { return g.id; }) : [];
  var html = all.length ? all.map(function(g) {
    var members = data.groups.members(g.id).length;
    var topicCount = data.groups.topics(g.id).length;
    var joined = myGroups.indexOf(g.id) > -1;
    return '<a href="/grup/' + esc(g.slug) + '" class="panel" style="display:flex;gap:14px;align-items:center;margin-bottom:8px">' +
      '<div style="width:60px;height:60px;background:#ede9fe;color:#7c3aed;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:16px;flex:none">' + esc(g.emoji) + '</div>' +
      '<div style="flex:1">' +
      '<div style="font-weight:700;font-size:16px">' + esc(g.name) + (g.isPrivate ? ' <span class="tag">GIZLI</span>' : '') + '</div>' +
      '<div style="font-size:13px;color:#666;margin-top:3px">' + esc(g.desc || 'Aciklama yok') + '</div>' +
      '<div style="font-size:12px;color:#888;margin-top:5px">' + members + ' uye · ' + topicCount + ' konu</div>' +
      '</div>' +
      '<div style="font-size:12px;color:' + (joined ? '#16a34a' : '#7c3aed') + ';font-weight:700">' + (joined ? 'UYE' : 'GOZAT') + '</div>' +
      '</a>';
  }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Henuz grup yok.</div>';

  var content = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">';
  content += '<h1 class="page" style="margin:0">Gruplar</h1>';
  if (s.userId) content += '<a class="btn" href="/grup-yeni">+ Yeni Grup</a>';
  content += '</div>';
  content += html;
  res.send(layout({ title: 'Gruplar', content: content, s: s }));
});

app.get('/grup-yeni', requireUser, function(req, res) {
  var s = session(req, res);
  var c = '<div class="form-box" style="max-width:500px"><h1>Yeni Grup Olustur</h1>' +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/grup-yeni">' +
    '<div class="field"><label>Grup Adi</label><input type="text" name="name" required minlength="3" maxlength="60"></div>' +
    '<div class="field"><label>Kisa Ad</label><input type="text" name="emoji" maxlength="6" value="Grup"></div>' +
    '<div class="field"><label>Aciklama</label><textarea name="desc" maxlength="300" required style="min-height:80px"></textarea></div>' +
    '<div class="field"><label>Gizlilik</label><select name="isPrivate"><option value="0">Acil (herkes gorebilir)</option><option value="1">Gizli (sadece uyeler)</option></select></div>' +
    '<button class="btn full" type="submit">Grubu Olustur</button></form></div>';
  res.send(layout({ title: 'Yeni Grup', content: c, s: s }));
});

app.post('/grup-yeni', requireUser, function(req, res) {
  var s = session(req, res);
  var name = String(req.body.name || '').trim();
  var desc = String(req.body.desc || '').trim();
  var emoji = String(req.body.emoji || 'Grup').trim().substring(0, 6) || 'Grup';
  var isPrivate = req.body.isPrivate === '1';
  if (name.length < 3) return res.redirect('/grup-yeni?hata=' + encodeURIComponent('Ad en az 3 karakter.'));
  if (data.groups.bySlug(data.slugify(name))) return res.redirect('/grup-yeni?hata=' + encodeURIComponent('Bu isimde grup var.'));
  var g = data.groups.create(name, desc, emoji, isPrivate, s.userId);
  res.redirect('/grup/' + g.slug);
});

app.get('/grup/:slug', function(req, res) {
  var s = session(req, res);
  var g = data.groups.bySlug(req.params.slug);
  if (!g) return res.redirect('/gruplar');
  var isMember = s.userId ? data.groups.isMember(g.id, s.userId) : false;
  var isOwner = s.userId ? data.groups.isOwner(g.id, s.userId) : false;
  if (g.isPrivate && !isMember) {
    return res.send(layout({ title: g.name, content: '<div class="panel" style="text-align:center;padding:60px"><div style="font-size:60px">Gizli</div><h2>Bu grup gizli</h2><p style="color:#888;margin-top:10px">Sadece uyeler gorebilir.</p></div>', s: s }));
  }

  var members = data.groups.members(g.id);
  var topicList = data.groups.topics(g.id).map(function(t) { return topicCard(t, s); }).join('');

  var content = '<div class="crumb"><a href="/gruplar">Gruplar</a> > ' + esc(g.name) + '</div>';
  content += '<div class="panel" style="margin-bottom:20px">';
  content += '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">';
  content += '<div style="width:80px;height:80px;background:#ede9fe;color:#7c3aed;border-radius:16px;display:grid;place-items:center;font-weight:800;font-size:22px;flex:none">' + esc(g.emoji) + '</div>';
  content += '<div style="flex:1;min-width:200px">';
  content += '<h1 style="font-size:24px;margin:0">' + esc(g.name) + (g.isPrivate ? ' <span class="tag">GIZLI</span>' : '') + '</h1>';
  content += '<p style="color:#666;font-size:14px;margin-top:6px">' + esc(g.desc) + '</p>';
  content += '<div style="font-size:12px;color:#888;margin-top:6px">' + members.length + ' uye · ' + data.groups.topics(g.id).length + ' konu · ' + ago(g.createdAt) + '</div>';
  content += '</div>';
  content += '<div>';
  if (s.userId && !isMember) content += '<button class="btn" onclick="joinGroup(' + g.id + ')">Gruba Katil</button>';
  else if (s.userId && isMember && !isOwner) content += '<button class="btn gray" onclick="leaveGroup(' + g.id + ')">Gruptan Ayril</button>';
  if (isOwner) content += ' <a class="btn red sm" href="/grup/' + esc(g.slug) + '/sil" onclick="return confirm(\'Grup silinsin mi?\')">Grubu Sil</a>';
  content += '</div></div></div>';

  if (isMember) {
    content += '<div style="margin-bottom:16px"><a class="btn" href="/grup/' + esc(g.slug) + '/yeni-konu">+ Yeni Konu</a></div>';
  }

  content += '<h2 class="sec">Konular (' + data.groups.topics(g.id).length + ')</h2>';
  content += topicList || '<div class="panel" style="text-align:center;padding:30px;color:#888">Henuz konu yok.</div>';

  if (members.length) {
    content += '<h2 class="sec">Uyeler (' + members.length + ')</h2>';
    content += '<div class="panel" style="display:flex;gap:8px;flex-wrap:wrap">';
    members.forEach(function(m) {
      var u = data.users.byId(m.userId);
      if (!u) return;
      content += '<a href="/u/' + esc(u.username) + '" style="background:#f5f5f5;padding:6px 12px;border-radius:999px;font-size:13px">' + esc(u.username) + (m.role === 'owner' ? ' <b style="color:#7c3aed">KURUCU</b>' : '') + '</a>';
    });
    content += '</div>';
  }

  content += '<script>function joinGroup(id){fetch("/grup-katil",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id}).then(function(){location.reload()});}';
  content += 'function leaveGroup(id){if(!confirm("Ayrilmak istiyor musunuz?"))return;fetch("/grup-ayril",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id}).then(function(){location.reload()});}</script>';

  res.send(layout({ title: g.name, content: content, s: s }));
});

app.post('/grup-katil', requireUser, function(req, res) {
  var s = session(req, res);
  var gid = parseInt(req.body.id, 10);
  var g = data.groups.byId(gid);
  if (!g) return res.json({ ok: false });
  data.groups.join(gid, s.userId);
  var owner = g.ownerId;
  if (owner !== s.userId) {
    var u = data.users.byId(s.userId);
    data.notifications.add(owner, u.username + ' ' + g.name + ' grubuna katildi', '/grup/' + g.slug);
    data.save();
  }
  res.json({ ok: true });
});

app.post('/grup-ayril', requireUser, function(req, res) {
  var s = session(req, res);
  var gid = parseInt(req.body.id, 10);
  if (data.groups.isOwner(gid, s.userId)) return res.json({ ok: false });
  data.groups.leave(gid, s.userId);
  res.json({ ok: true });
});

app.get('/grup/:slug/yeni-konu', requireUser, function(req, res) {
  var s = session(req, res);
  var g = data.groups.bySlug(req.params.slug);
  if (!g) return res.redirect('/gruplar');
  if (!data.groups.isMember(g.id, s.userId)) return res.redirect('/grup/' + g.slug);
  var c = '<div class="form-box" style="max-width:600px"><h1>' + esc(g.name) + ' - Yeni Konu</h1>' +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/grup/' + esc(g.slug) + '/yeni-konu">' +
    '<div class="field"><label>Baslik</label><input type="text" name="title" required minlength="5" maxlength="150"></div>' +
    '<div class="field"><label>Icerik</label><textarea name="body" required minlength="10" style="min-height:180px"></textarea></div>' +
    '<button class="btn full" type="submit">Konuyu Ac</button></form></div>';
  res.send(layout({ title: 'Yeni Konu - ' + g.name, content: c, s: s }));
});

app.post('/grup/:slug/yeni-konu', requireUser, function(req, res) {
  var s = session(req, res);
  var g = data.groups.bySlug(req.params.slug);
  if (!g || !data.groups.isMember(g.id, s.userId)) return res.redirect('/gruplar');
  var title = String(req.body.title || '').trim();
  var body = String(req.body.body || '').trim();
  if (title.length < 5 || body.length < 10) return res.redirect('/grup/' + g.slug + '/yeni-konu?hata=1');
  var t = data.topics.add({
    title: title, body: body,
    categoryId: 0,
    userId: s.userId,
    tags: [], prefix: 'GRUP',
    groupId: g.id
  });
  data.save();
  var members = data.groups.members(g.id);
  members.forEach(function(m) {
    if (m.userId !== s.userId) {
      data.notifications.add(m.userId, esc(g.name) + ' grubunda yeni konu: ' + title, '/konu/' + t.id + '/' + t.slug);
    }
  });
  data.save();
  data.badges.check(s.userId);
  res.redirect('/konu/' + t.id + '/' + t.slug);
});

app.get('/grup/:slug/sil', requireUser, function(req, res) {
  var s = session(req, res);
  var g = data.groups.bySlug(req.params.slug);
  if (!g || !data.groups.isOwner(g.id, s.userId)) return res.redirect('/gruplar');
  data.groups.remove(g.id);
  res.redirect('/gruplar');
});

app.get('/gruplarim', requireUser, function(req, res) {
  var s = session(req, res);
  var list = data.groups.ofUser(s.userId);
  var html = list.length ? list.map(function(g) {
    var members = data.groups.members(g.id).length;
    return '<a href="/grup/' + esc(g.slug) + '" class="panel" style="display:flex;gap:14px;align-items:center;margin-bottom:8px">' +
      '<div style="width:50px;height:50px;background:#ede9fe;color:#7c3aed;border-radius:10px;display:grid;place-items:center;font-weight:800;flex:none">' + esc(g.emoji) + '</div>' +
      '<div style="flex:1"><div style="font-weight:700">' + esc(g.name) + '</div>' +
      '<div style="font-size:12px;color:#888;margin-top:3px">' + members + ' uye</div></div></a>';
  }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Hicbir gruba uye degilsin.</div>';
  res.send(layout({ title: 'Gruplarim', content: '<h1 class="page">Gruplarim</h1>' + html, s: s }));
});

};
