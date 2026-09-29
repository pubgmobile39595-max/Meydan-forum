const data = require('./data');
const views = require('./views');
const { esc, layout, topicCard } = views;

module.exports = function(app, session, requireUser) {

app.post('/tepki', requireUser, function(req, res) {
  var s = session(req, res);
  var pid = parseInt(req.body.id, 10);
  var emoji = String(req.body.emoji || '').substring(0, 10);
  if (!pid || !emoji || !data.posts.byId(pid)) return res.json({ ok: false });
  data.reactions.toggle(s.userId, pid, emoji);
  res.json({ ok: true });
});

app.post('/kaydet', requireUser, function(req, res) {
  var s = session(req, res);
  var tid = parseInt(req.body.id, 10);
  if (!tid || !data.topics.byId(tid)) return res.json({ ok: false });
  data.bookmarks.toggle(s.userId, tid);
  res.json({ ok: true });
});

app.get('/kaydedilenler', requireUser, function(req, res) {
  var s = session(req, res);
  var bms = data.bookmarks.of(s.userId);
  var list = bms.map(function(b) { return data.topics.byId(b.topicId); }).filter(function(t) { return t; });
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Kaydedilen konu yok.</div>';
  res.send(layout({ title: 'Kaydedilenler', content: '<h1 class="page">Kaydedilen Konular (' + list.length + ')</h1><div class="topic-list">' + html + '</div>', s: s }));
});

app.get('/etiketler', function(req, res) {
  var s = session(req, res);
  var counts = {};
  data.topics.all().forEach(function(t) {
    if (t.tags && t.tags.length) t.tags.forEach(function(tag) { counts[tag] = (counts[tag] || 0) + 1; });
  });
  var arr = Object.keys(counts).map(function(tag) { return { tag: tag, count: counts[tag] }; }).sort(function(a, b) { return b.count - a.count; });
  var html = arr.length ? '<div class="tag-cloud">' + arr.map(function(x) {
    var cls = x.count >= 10 ? 'big' : (x.count >= 3 ? 'mid' : '');
    return '<a href="/etiket/' + encodeURIComponent(x.tag) + '" class="' + cls + '">#' + esc(x.tag) + ' (' + x.count + ')</a>';
  }).join('') + '</div>' : '<div class="panel" style="text-align:center;padding:40px;color:#888">Henuz etiket yok.</div>';
  res.send(layout({ title: 'Etiketler', content: '<h1 class="page">Populer Etiketler</h1>' + html, s: s }));
});

app.post('/takip', requireUser, function(req, res) {
  var s = session(req, res);
  var target = parseInt(req.body.id, 10);
  if (!target || !data.users.byId(target)) return res.json({ ok: false });
  var wasFollowing = data.follows.is(s.userId, target);
  data.follows.toggle(s.userId, target);
  if (!wasFollowing) {
    var u = data.users.byId(s.userId);
    data.notifications.add(target, u.username + ' seni takip etmeye basladi', '/u/' + u.username);
    data.save();
  }
  data.badges.check(target);
  res.json({ ok: true });
});

app.get('/takip/:username', function(req, res) {
  var s = session(req, res);
  var u = data.users.byName(req.params.username);
  if (!u) return res.redirect('/');
  var followers = data.follows.followers(u.id).map(function(f) { return data.users.byId(f.followerId); }).filter(function(x) { return x; });
  var following = data.follows.following(u.id).map(function(f) { return data.users.byId(f.followingId); }).filter(function(x) { return x; });
  var fHtml = followers.length ? followers.map(function(x) { return '<a href="/u/' + esc(x.username) + '" class="panel" style="display:inline-block;margin:4px;padding:8px 14px">' + esc(x.username) + '</a>'; }).join('') : '<div style="color:#888">Takipci yok.</div>';
  var gHtml = following.length ? following.map(function(x) { return '<a href="/u/' + esc(x.username) + '" class="panel" style="display:inline-block;margin:4px;padding:8px 14px">' + esc(x.username) + '</a>'; }).join('') : '<div style="color:#888">Kimseyi takip etmiyor.</div>';
  var content = '<h1 class="page">' + esc(u.username) + ' - Takip</h1>';
  content += '<div class="panel" style="margin-bottom:14px"><h3>Takipciler (' + followers.length + ')</h3><div style="margin-top:10px">' + fHtml + '</div></div>';
  content += '<div class="panel"><h3>Takip Edilenler (' + following.length + ')</h3><div style="margin-top:10px">' + gHtml + '</div></div>';
  res.send(layout({ title: u.username + ' takip', content: content, s: s }));
});

app.get('/mesajlar', requireUser, function(req, res) {
  var s = session(req, res);
  var convs = data.messages.conversations(s.userId);
  var keys = Object.keys(convs);
  if (!keys.length) {
    return res.send(layout({
      title: 'Mesajlar',
      content: '<h1 class="page">Ozel Mesajlar</h1><div class="panel" style="text-align:center;padding:40px;color:#888">Henuz mesajiniz yok.</div>',
      s: s
    }));
  }
  var html = keys.map(function(uid) {
    var u = data.users.byId(parseInt(uid, 10));
    if (!u) return '';
    var c = convs[uid];
    return '<a href="/mesaj/' + esc(u.username) + '" class="panel" style="display:block;margin-bottom:8px;' + (c.unread ? 'background:#ede9fe' : '') + '">' +
      '<div style="display:flex;gap:12px;align-items:center">' +
      '<div class="topic-avatar">' + views.initials(u.username) + '</div>' +
      '<div style="flex:1">' +
      '<div style="font-weight:700">' + esc(u.username) + (c.unread ? ' <span class="badge">' + c.unread + '</span>' : '') + '</div>' +
      '<div style="font-size:13px;color:#666;margin-top:2px">' + esc(c.last.body.substring(0, 60)) + (c.last.body.length > 60 ? '...' : '') + '</div>' +
      '<div style="font-size:11px;color:#999;margin-top:3px">' + views.ago(c.last.createdAt) + '</div>' +
      '</div></div></a>';
  }).join('');
  res.send(layout({ title: 'Mesajlar', content: '<h1 class="page">Ozel Mesajlar</h1>' + html, s: s }));
});

app.get('/mesaj/:username', requireUser, function(req, res) {
  var s = session(req, res);
  var other = data.users.byName(req.params.username);
  if (!other || other.id === s.userId) return res.redirect('/mesajlar');
  if (data.blocks.is(other.id, s.userId)) {
    return res.send(layout({ title: 'Engellendiniz', content: '<div class="panel" style="text-align:center;padding:40px;color:#888">Bu kullaniciyla mesajlasamazsiniz.</div>', s: s }));
  }
  data.messages.markRead(s.userId, other.id);
  var msgs = data.messages.conv(s.userId, other.id);
  var html = msgs.map(function(m) {
    var mine = m.from === s.userId;
    return '<div style="margin-bottom:10px;display:flex;' + (mine ? 'justify-content:flex-end' : 'justify-content:flex-start') + '">' +
      '<div style="max-width:70%;padding:10px 14px;border-radius:12px;background:' + (mine ? '#7c3aed;color:#fff' : '#f0f0f0;color:#333') + ';font-size:14px">' +
      esc(m.body) +
      '<div style="font-size:10px;opacity:.7;margin-top:4px">' + views.ago(m.createdAt) + '</div>' +
      '</div></div>';
  }).join('');
  var form = '<form method="post" action="/mesaj/' + esc(other.username) + '" style="display:flex;gap:8px;margin-top:14px">' +
    '<input type="text" name="body" required maxlength="1000" placeholder="Mesaj yaz..." style="flex:1;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px">' +
    '<button class="btn" type="submit">Gonder</button></form>';
  var content = '<div class="panel" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
    '<div style="display:flex;gap:12px;align-items:center">' +
    '<div class="topic-avatar">' + views.initials(other.username) + '</div>' +
    '<div><a href="/u/' + esc(other.username) + '" style="font-weight:700">' + esc(other.username) + '</a></div>' +
    '</div></div>';
  content += '<div class="panel" style="max-height:500px;overflow-y:auto">' + (html || '<div style="text-align:center;color:#888;padding:30px">Mesajlasma basladi.</div>') + '</div>';
  content += form;
  res.send(layout({ title: 'Mesaj: ' + other.username, content: content, s: s }));
});

app.post('/mesaj/:username', requireUser, function(req, res) {
  var s = session(req, res);
  var other = data.users.byName(req.params.username);
  if (!other) return res.redirect('/mesajlar');
  var body = String(req.body.body || '').trim();
  if (body.length < 1 || body.length > 1000) return res.redirect('/mesaj/' + other.username);
  if (data.blocks.is(other.id, s.userId) || data.blocks.is(s.userId, other.id)) return res.redirect('/mesajlar');
  data.messages.send(s.userId, other.id, body);
  var u = data.users.byId(s.userId);
  data.notifications.add(other.id, u.username + ' sana mesaj gonderdi', '/mesaj/' + u.username);
  data.save();
  res.redirect('/mesaj/' + other.username);
});

app.post('/engelle', requireUser, function(req, res) {
  var s = session(req, res);
  var target = parseInt(req.body.id, 10);
  if (!target || !data.users.byId(target) || target === s.userId) return res.json({ ok: false });
  data.blocks.toggle(s.userId, target);
  res.json({ ok: true });
});

app.get('/engellenenler', requireUser, function(req, res) {
  var s = session(req, res);
  var list = data.blocks.of(s.userId).map(function(b) { return data.users.byId(b.blockedId); }).filter(function(u) { return u; });
  var html = list.length ? list.map(function(u) {
    return '<div class="panel" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<a href="/u/' + esc(u.username) + '">' + esc(u.username) + '</a>' +
      '<form method="post" action="/engelle" style="display:inline"><input type="hidden" name="id" value="' + u.id + '"><button class="btn sm gray" type="submit">Engeli Kaldir</button></form>' +
      '</div>';
  }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Engellenen kullanici yok.</div>';
  res.send(layout({ title: 'Engellenenler', content: '<h1 class="page">Engellenen Kullanicilar</h1>' + html, s: s }));
});

app.get('/liderler', function(req, res) {
  var s = session(req, res);
  var top = data.topUsers(20);
  var html = top.map(function(u, i) {
    var medal = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : (i + 1);
    return '<a href="/u/' + esc(u.username) + '" class="panel" style="display:flex;gap:14px;align-items:center;margin-bottom:8px">' +
      '<div style="font-size:20px;font-weight:800;color:#7c3aed;min-width:40px">' + medal + '.</div>' +
      '<div class="topic-avatar">' + views.initials(u.username) + '</div>' +
      '<div style="flex:1">' +
      '<div style="font-weight:700">' + esc(u.username) + '</div>' +
      '<div style="font-size:12px;color:#888;margin-top:3px">' + u._topics + ' konu · ' + u._posts + ' cevap · ' + u._followers + ' takipci · ' + (u.reputation || 0) + ' itibar</div>' +
      '</div>' +
      '<div style="font-size:22px;font-weight:800;color:#7c3aed">' + u._score + '</div>' +
      '</a>';
  }).join('');
  res.send(layout({ title: 'Liderler', content: '<h1 class="page">En Aktif Uyeler</h1><div class="panel" style="margin-bottom:14px;color:#888;font-size:13px">Skor = itibar + 5x konu + 2x cevap + 3x takipci</div>' + html, s: s }));
});

app.post('/sikayet', requireUser, function(req, res) {
  var s = session(req, res);
  var type = String(req.body.type || '');
  var targetId = parseInt(req.body.targetId, 10);
  var reason = String(req.body.reason || '').trim();
  if (['topic', 'post', 'user'].indexOf(type) === -1 || !targetId || reason.length < 3) {
    return res.json({ ok: false });
  }
  data.reports.add(s.userId, type, targetId, reason);
  res.json({ ok: true });
});

app.get('/sikayet/:type/:id', requireUser, function(req, res) {
  var s = session(req, res);
  var type = req.params.type;
  var id = parseInt(req.params.id, 10);
  if (['topic', 'post', 'user'].indexOf(type) === -1) return res.redirect('/');
  var c = '<div class="form-box"><h1>Sikayet Et</h1>' +
    '<p style="color:#888;font-size:13px;margin-bottom:16px">Sikayet sebebini yazin.</p>' +
    '<form method="post" action="/sikayet">' +
    '<input type="hidden" name="type" value="' + views.esc(type) + '">' +
    '<input type="hidden" name="targetId" value="' + id + '">' +
    '<div class="field"><label>Sebep</label><select name="reason" required>' +
    '<option value="Spam">Spam</option>' +
    '<option value="Kufur veya hakaret">Kufur veya hakaret</option>' +
    '<option value="Nefret soylemi">Nefret soylemi</option>' +
    '<option value="Yanlis bilgi">Yanlis bilgi</option>' +
    '<option value="Reklam">Reklam</option>' +
    '<option value="Diger">Diger</option>' +
    '</select></div>' +
    '<button class="btn full" type="submit">Sikayet Gonder</button></form>' +
    '<p style="text-align:center;margin-top:14px;font-size:12px;color:#888">Sikayetiniz admine iletilecek.</p></div>';
  res.send(views.layout({ title: 'Sikayet', content: c, s: s }));
});


app.get('/istatistikler', function(req, res) {
  var s = session(req, res);
  var allUsers = data.users.all();
  var allTopics = data.topics.all();
  var allPosts = data.posts.all();
  var allCats = data.cats.all();
  var totalVotes = 0;
  allTopics.forEach(function(t) { totalVotes += data.votes.count('topic', t.id); });
  var today = new Date().toISOString().substring(0, 10);
  var todayTopics = allTopics.filter(function(t) { return t.createdAt.substring(0, 10) === today; }).length;
  var todayPosts = allPosts.filter(function(p) { return p.createdAt.substring(0, 10) === today; }).length;
  var todayUsers = allUsers.filter(function(u) { return u.createdAt.substring(0, 10) === today; }).length;

  var content = '<h1 class="page">Site Istatistikleri</h1>';
  content += '<div class="stats">';
  content += '<div class="stat"><b>' + allUsers.length + '</b><span>Toplam Uye</span></div>';
  content += '<div class="stat"><b>' + allTopics.length + '</b><span>Toplam Konu</span></div>';
  content += '<div class="stat"><b>' + allPosts.length + '</b><span>Toplam Cevap</span></div>';
  content += '<div class="stat"><b>' + allCats.length + '</b><span>Kategori</span></div>';
  content += '<div class="stat"><b>' + totalVotes + '</b><span>Toplam Oy</span></div>';
  content += '<div class="stat"><b>' + todayTopics + '</b><span>Bugun Konu</span></div>';
  content += '<div class="stat"><b>' + todayPosts + '</b><span>Bugun Cevap</span></div>';
  content += '<div class="stat"><b>' + todayUsers + '</b><span>Bugun Uye</span></div>';
  content += '</div>';

  // Kategori dagilimi
  content += '<div class="panel" style="margin-bottom:14px"><h3>Kategori Dagilimi</h3>';
  var maxCat = 1;
  allCats.forEach(function(c) {
    var n = data.topics.byCat(c.id).length;
    if (n > maxCat) maxCat = n;
  });
  allCats.forEach(function(c) {
    var n = data.topics.byCat(c.id).length;
    var pct = Math.round(n / maxCat * 100);
    content += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0">';
    content += '<div style="min-width:120px;font-weight:700;font-size:13px">' + esc(c.name) + '</div>';
    content += '<div style="flex:1;height:16px;background:#f0f0f0;border-radius:8px;overflow:hidden">';
    content += '<div style="width:' + pct + '%;height:100%;background:#7c3aed"></div></div>';
    content += '<div style="min-width:40px;text-align:right;font-weight:700;color:#7c3aed">' + n + '</div>';
    content += '</div>';
  });
  content += '</div>';

  // En cok goruutlenen
  var topViewed = allTopics.slice().sort(function(a, b) { return (b.views || 0) - (a.views || 0); }).slice(0, 10);
  content += '<div class="panel" style="margin-bottom:14px"><h3>En Cok Goruntulenen Konular</h3>';
  if (topViewed.length) {
    topViewed.forEach(function(t, i) {
      content += '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">';
      content += '<a href="/konu/' + t.id + '/' + t.slug + '" style="flex:1;font-size:14px"><b>' + (i + 1) + '.</b> ' + esc(t.title) + '</a>';
      content += '<b style="color:#7c3aed">' + (t.views || 0) + '</b></div>';
    });
  } else content += '<div style="color:#888">Konu yok.</div>';
  content += '</div>';

  // En cok oy alan
  var topVoted = allTopics.slice().sort(function(a, b) { return data.votes.count('topic', b.id) - data.votes.count('topic', a.id); }).slice(0, 10);
  content += '<div class="panel"><h3>En Cok Oy Alan Konular</h3>';
  if (topVoted.length) {
    topVoted.forEach(function(t, i) {
      content += '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">';
      content += '<a href="/konu/' + t.id + '/' + t.slug + '" style="flex:1;font-size:14px"><b>' + (i + 1) + '.</b> ' + esc(t.title) + '</a>';
      content += '<b style="color:#7c3aed">' + data.votes.count('topic', t.id) + '</b></div>';
    });
  } else content += '<div style="color:#888">Konu yok.</div>';
  content += '</div>';

  res.send(layout({ title: 'Istatistikler', content: content, s: s }));
});

app.get('/senin-icin', requireUser, function(req, res) {
  var s = session(req, res);
  // Takip ettiklerim
  var following = data.follows.following(s.userId).map(function(f) { return f.followingId; });
  // Favori kategorilerim (actigim konulardan)
  var myTopics = data.topics.byUser(s.userId);
  var myCatCounts = {};
  myTopics.forEach(function(t) { myCatsCounts = null; myCatCounts[t.categoryId] = (myCatCounts[t.categoryId] || 0) + 1; });
  // Takip ettiklerimin konulari
  var fromFollowing = data.topics.all().filter(function(t) {
    return following.indexOf(t.userId) > -1 && t.userId !== s.userId;
  }).sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 20);
  // Ilgi alanlarima gore
  var fromCats = data.topics.all().filter(function(t) {
    return myCatCounts[t.categoryId] && t.userId !== s.userId && following.indexOf(t.userId) === -1;
  }).sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 10);

  var content = '<h1 class="page">Senin Icin</h1>';
  content += '<h2 class="sec">Takip Ettiklerinden</h2>';
  if (fromFollowing.length) {
    content += '<div class="topic-list">' + fromFollowing.map(function(t) { return topicCard(t, s); }).join('') + '</div>';
  } else content += '<div class="panel" style="text-align:center;padding:30px;color:#888">Takip ettiklerinizden yeni konu yok.</div>';

  content += '<h2 class="sec">Ilgi Alanlariniza Gore</h2>';
  if (fromCats.length) {
    content += '<div class="topic-list">' + fromCats.map(function(t) { return topicCard(t, s); }).join('') + '</div>';
  } else content += '<div class="panel" style="text-align:center;padding:30px;color:#888">Oneri yok. Konu actiginizda burada oneriler cikacak.</div>';

  res.send(layout({ title: 'Senin Icin', content: content, s: s }));
});


app.get('/canli', function(req, res) {
  var s = session(req, res);
  var online = data.analytics.onlineCount();
  var list = data.analytics.onlineList();
  var pageCount = data.analytics.pageStats(24);
  var trending = data.analytics.trending(24, 10);
  var topPages = data.analytics.topPages(24, 10);

  var content = '<h1 class="page">Canli Istatistikler</h1>';
  content += '<div class="stats">';
  content += '<div class="stat"><b>' + online + '</b><span>Su An Online</span></div>';
  content += '<div class="stat"><b>' + pageCount + '</b><span>Bugun Sayfa</span></div>';
  content += '<div class="stat"><b>' + trending.length + '</b><span>Trend Konu</span></div>';
  content += '</div>';

  // Online kullanicilar
  content += '<div class="panel" style="margin-bottom:14px"><h3>Su An Online (' + online + ')</h3>';
  if (list.length) {
    content += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">';
    list.forEach(function(u) {
      content += '<a href="/u/' + esc(u.username) + '" style="background:#dcfce7;color:#15803d;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700">' + esc(u.username) + '</a>';
    });
    content += '</div>';
  } else content += '<div style="color:#888;margin-top:8px">Su an kimse online degil.</div>';
  content += '</div>';

  // Trending
  content += '<div class="panel" style="margin-bottom:14px"><h3>Son 24 Saatte Trend Konular</h3>';
  if (trending.length) {
    trending.forEach(function(x, i) {
      content += '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;gap:10px">';
      content += '<a href="/konu/' + x.topic.id + '/' + x.topic.slug + '" style="flex:1;font-size:14px"><b>' + (i + 1) + '.</b> ' + esc(x.topic.title) + '</a>';
      content += '<b style="color:#7c3aed;white-space:nowrap">' + x.count + ' goruntuleme</b></div>';
    });
  } else content += '<div style="color:#888;margin-top:8px">Son 24 saatte trafik yok.</div>';
  content += '</div>';

  // Top pages
  content += '<div class="panel"><h3>En Cok Ziyaret Edilen Sayfalar (24 saat)</h3>';
  if (topPages.length) {
    topPages.forEach(function(p, i) {
      content += '<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;gap:10px">';
      content += '<span style="flex:1;font-size:13px"><b>' + (i + 1) + '.</b> <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px">' + esc(p.path) + '</code></span>';
      content += '<b style="color:#7c3aed">' + p.count + '</b></div>';
    });
  } else content += '<div style="color:#888;margin-top:8px">Veri yok.</div>';
  content += '</div>';

  res.send(layout({ title: 'Canli', content: content, s: s }));
});


};
