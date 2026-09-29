const data = require('./data');
const views = require('./views');
const { esc, ago, initials, layout, topicCard, postCard } = views;

module.exports = function(app, session, requireUser) {

app.get('/', function(req, res) {
  var s = session(req, res);
  var onayMsg = req.query.onayBekliyor ? '<div class="alert info">Konunuz onay bekliyor. Yonetici onaylayinca yayinlanacak.</div>' : '';
  var all = data.topics.all().slice().sort(function(a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  }).slice(0, 20);
  var cats = data.cats.all();
  var cg = cats.map(function(c) {
    var n = data.topics.byCat(c.id).length;
    return '<a href="/kategori/' + c.slug + '" class="cat-card"><div class="cat-icon">' + esc(c.emoji) + '</div><div><div class="cat-name">' + esc(c.name) + '</div><div class="cat-desc">' + esc(c.desc) + '</div><div class="cat-count">' + n + ' konu</div></div></a>';
  }).join('');
  var tl = all.length ? all.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Henuz konu yok.</div>';
  var content = onayMsg + views.adBanner(s, 'top') + '<h1 class="page">Son Konular</h1>';
  content += '<h2 class="sec">Kategoriler</h2><div class="cat-grid">' + cg + '</div>';
  content += '<h2 class="sec">Guncel Konular</h2><div class="topic-list">' + tl + '</div>';
  content = '<div style="display:grid;grid-template-columns:1fr 280px;gap:20px" class="with-sidebar"><div>' + content + '</div>' + views.sidebarWidget(s) + '</div>';
  content += '<style>@media(max-width:900px){.with-sidebar{grid-template-columns:1fr !important}}</style>';
  res.send(layout({ title: 'Ana Sayfa', content: content, s: s }));
});

app.get('/kategori/:slug', function(req, res) {
  var s = session(req, res);
  var c = data.cats.bySlug(req.params.slug);
  if (!c) return res.redirect('/');
  var list = data.topics.byCat(c.id).sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Bu kategoride konu yok.</div>';
  var content = '<div class="crumb"><a href="/">Ana Sayfa</a> > ' + esc(c.name) + '</div>';
  content += '<h1 class="page">' + esc(c.name) + '</h1>';
  if (s.userId) content += '<a href="/yeni-konu?kat=' + c.id + '" class="btn" style="margin-bottom:16px">+ Yeni Konu</a>';
  content += '<div class="topic-list">' + html + '</div>';
  res.send(layout({ title: c.name, desc: c.desc || (c.name + ' kategorisindeki konular'), canonical: '/kategori/' + c.slug, content: content, s: s }));
});

app.get('/etiket/:tag', function(req, res) {
  var s = session(req, res);
  var tag = String(req.params.tag || '');
  var list = data.topics.all().filter(function(t) { return t.tags && t.tags.indexOf(tag) > -1; });
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Bu etikette konu yok.</div>';
  res.send(layout({ title: '#' + tag, content: '<h1 class="page">#' + esc(tag) + '</h1><div class="topic-list">' + html + '</div>', s: s }));
});

app.get('/ara', function(req, res) {
  var s = session(req, res);
  var q = String(req.query.q || '').trim();
  var list = [];
  if (q) {
    var lq = q.toLowerCase();
    list = data.topics.all().filter(function(t) {
      return t.title.toLowerCase().indexOf(lq) > -1 ||
             (t.body || '').toLowerCase().indexOf(lq) > -1;
    }).slice(0, 50);
  }
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">' + (q ? 'Sonuc yok.' : 'Arama yapin.') + '</div>';
  var content = '<h1 class="page">"' + esc(q) + '" - ' + list.length + ' sonuc</h1><div class="topic-list">' + html + '</div>';
  res.send(layout({ title: 'Arama', content: content, s: s, q: q }));
});

app.get('/trend', function(req, res) {
  var s = session(req, res);
  var list = data.topics.all().slice().sort(function(a, b) {
    return data.votes.count('topic', b.id) - data.votes.count('topic', a.id);
  }).slice(0, 30);
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Konu yok.</div>';
  res.send(layout({ title: 'Trend', content: '<h1 class="page">Trend Konular</h1><div class="topic-list">' + html + '</div>', s: s }));
});

app.get('/gelismis-ara', function(req, res) {
  var s = session(req, res);
  var q = String(req.query.q || '').trim();
  var type = String(req.query.type || 'all');
  var catId = req.query.kategori ? parseInt(req.query.kategori, 10) : 0;
  var userQuery = String(req.query.user || '').trim();
  var sort = String(req.query.sort || 'new');

  var results = [];
  if (q || catId || userQuery) {
    var lq = q.toLowerCase();
    if (type === 'all' || type === 'topic') {
      data.topics.all().forEach(function(t) {
        if (catId && t.categoryId !== catId) return;
        if (userQuery) {
          var u = data.users.byId(t.userId);
          if (!u || u.username.toLowerCase().indexOf(userQuery.toLowerCase()) === -1) return;
        }
        if (lq && t.title.toLowerCase().indexOf(lq) === -1 && (t.body || '').toLowerCase().indexOf(lq) === -1) return;
        results.push({ type: 'topic', id: t.id, title: t.title, body: t.body, url: '/konu/' + t.id + '/' + t.slug, date: t.createdAt, user: data.users.byId(t.userId) });
      });
    }
    if (type === 'all' || type === 'post') {
      data.posts.all().forEach(function(p) {
        if (lq && (p.body || '').toLowerCase().indexOf(lq) === -1) return;
        if (userQuery) {
          var u = data.users.byId(p.userId);
          if (!u || u.username.toLowerCase().indexOf(userQuery.toLowerCase()) === -1) return;
        }
        var pt = data.topics.byId(p.topicId);
        if (!pt) return;
        if (catId && pt.categoryId !== catId) return;
        results.push({ type: 'post', id: p.id, title: pt.title, body: p.body, url: '/konu/' + pt.id + '/' + pt.slug, date: p.createdAt, user: data.users.byId(p.userId) });
      });
    }
    if (type === 'all' || type === 'user') {
      data.users.all().forEach(function(u) {
        if (lq && u.username.toLowerCase().indexOf(lq) === -1) return;
        results.push({ type: 'user', id: u.id, title: u.username, body: u.bio || '', url: '/u/' + u.username, date: u.createdAt, user: u });
      });
    }
  }

  if (sort === 'new') results.sort(function(a, b) { return b.date.localeCompare(a.date); });
  else if (sort === 'old') results.sort(function(a, b) { return a.date.localeCompare(b.date); });

  var cats = data.cats.all().map(function(c) { return '<option value="' + c.id + '"' + (catId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');

  var html = '<form method="get" action="/gelismis-ara" class="panel" style="margin-bottom:20px">';
  html += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px">';
  html += '<div class="field"><label>Arama</label><input type="text" name="q" value="' + esc(q) + '" placeholder="Kelime..."></div>';
  html += '<div class="field"><label>Tip</label><select name="type">';
  html += '<option value="all"' + (type === 'all' ? ' selected' : '') + '>Hepsi</option>';
  html += '<option value="topic"' + (type === 'topic' ? ' selected' : '') + '>Konular</option>';
  html += '<option value="post"' + (type === 'post' ? ' selected' : '') + '>Cevaplar</option>';
  html += '<option value="user"' + (type === 'user' ? ' selected' : '') + '>Kullanicilar</option>';
  html += '</select></div>';
  html += '<div class="field"><label>Kategori</label><select name="kategori"><option value="">Hepsi</option>' + cats + '</select></div>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  html += '<div class="field"><label>Kullanici Adi</label><input type="text" name="user" value="' + esc(userQuery) + '" placeholder="kullanici adi"></div>';
  html += '<div class="field"><label>Siralama</label><select name="sort">';
  html += '<option value="new"' + (sort === 'new' ? ' selected' : '') + '>En Yeni</option>';
  html += '<option value="old"' + (sort === 'old' ? ' selected' : '') + '>En Eski</option>';
  html += '</select></div></div>';
  html += '<button class="btn" type="submit">Ara</button>';
  html += '</form>';

  if (q || catId || userQuery) {
    html += '<h2 class="sec">' + results.length + ' sonuc bulundu</h2>';
    if (results.length) {
      html += '<div class="topic-list">' + results.slice(0, 100).map(function(r) {
        var label = r.type === 'topic' ? 'KONU' : (r.type === 'post' ? 'CEVAP' : 'UYE');
        return '<a href="' + esc(r.url) + '" class="panel" style="display:block;margin-bottom:8px">' +
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
          '<span class="tag">' + label + '</span>' +
          '<b style="font-size:15px">' + esc(r.title) + '</b>' +
          '</div>' +
          '<div style="font-size:13px;color:#666;margin-top:6px">' + esc((r.body || '').substring(0, 150)) + ((r.body || '').length > 150 ? '...' : '') + '</div>' +
          '<div style="font-size:11px;color:#999;margin-top:5px">' + esc(r.user ? r.user.username : '?') + ' - ' + ago(r.date) + '</div>' +
          '</a>';
      }).join('') + '</div>';
    } else html += '<div class="panel" style="text-align:center;padding:40px;color:#888">Sonuc bulunamadi.</div>';
  }

  res.send(layout({ title: 'Gelismis Arama', content: '<h1 class="page">Gelismis Arama</h1>' + html, s: s, q: q }));
});


app.get('/yeni', function(req, res) {
  var s = session(req, res);
  var list = data.topics.all().slice().sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 30);
  var html = list.length ? list.map(function(t) { return topicCard(t, s); }).join('') : '<div class="panel" style="text-align:center;padding:40px;color:#888">Konu yok.</div>';
  res.send(layout({ title: 'Yeni', content: '<h1 class="page">Yeni Konular</h1><div class="topic-list">' + html + '</div>', s: s }));
});

app.get('/konu/:id/:slug', function(req, res) {
  var s = session(req, res);
  var t = data.topics.byId(parseInt(req.params.id, 10));
  if (!t) return res.redirect('/');
  data.topics.incViews(t.id);
  data.views.log(t.id);
  var a = data.users.byId(t.userId);
  var c = data.cats.byId(t.categoryId);
  var v = s.userId ? data.votes.get(s.userId, 'topic', t.id) : 0;
  var sc = data.votes.count('topic', t.id);
  var ps = data.posts.byTopic(t.id);
  var allPosts = ps.map(function(p) { return postCard(p, s, false); }).join('');
  var form = '';
  if (s.userId && !t.locked) {
    form = '<div class="panel" style="margin-top:16px"><h3 style="margin-bottom:12px">Cevap Yaz</h3>' +
      '<form method="post" action="/konu/' + t.id + '/cevap" id="replyForm">' +
      '<input type="hidden" name="parentId" id="parentId" value="">' +
      '<div class="field"><textarea name="body" required minlength="3" placeholder="Dusuncelerini paylas..."></textarea></div>' +
      '<button class="btn" type="submit">Gonder</button></form></div>';
  } else if (t.locked) {
    form = '<div class="alert info">Bu konu kilitli.</div>';
  } else {
    form = '<div class="alert info">Cevap icin <a href="/giris" style="color:#7c3aed">giris yapin</a>.</div>';
  }
  var act = '';
  if (s.userId && (s.userId === t.userId || s.admin)) {
    act = '<div style="margin-top:12px">';
    act += '<form method="post" action="/konu/' + t.id + '/sil" style="display:inline" onsubmit="return confirm(\'Silinsin mi?\')"><button class="btn red sm" type="submit">Sil</button></form>';
    act += '</div>';
  }

  var grupContext = '';
  if (t.groupId) {
    var gr = data.groups.byId(t.groupId);
    if (gr) grupContext = '<div class="crumb" style="background:#ede9fe;padding:8px 12px;border-radius:6px;margin-bottom:12px">Grup: <a href="/grup/' + esc(gr.slug) + '" style="color:#7c3aed;font-weight:700">' + esc(gr.name) + '</a></div>';
  }
  var content = grupContext + views.adBanner(s, 'topic') + '<div class="crumb"><a href="/">Ana Sayfa</a> > ' + (c ? '<a href="/kategori/' + c.slug + '">' + esc(c.name) + '</a>' : '') + '</div>';
  content += '<div class="topic-header"><div style="display:flex;gap:14px"><div class="topic-vote">';
  content += '<button class="vote-btn ' + (v === 1 ? 'on-up' : '') + '" onclick="vote(\'topic\',' + t.id + ',1)">+</button>';
  content += '<div class="vote-count">' + sc + '</div>';
  content += '<button class="vote-btn ' + (v === -1 ? 'on-down' : '') + '" onclick="vote(\'topic\',' + t.id + ',-1)">-</button>';
  content += '</div><div style="flex:1">';
  if (t.pinned) content += '<span class="prefix">SABIT</span>';
  if (t.locked) content += '<span class="prefix">KILITLI</span>';
  if (t.prefix) content += '<span class="prefix">' + esc(t.prefix) + '</span>';
  content += '<h1 style="font-size:22px">' + esc(t.title) + '</h1>';
  content += '<div class="topic-meta">';
  if (t.tags && t.tags.length) {
    t.tags.forEach(function(tag) {
      content += '<a href="/etiket/' + encodeURIComponent(tag) + '"><span class="tag">#' + esc(tag) + '</span></a>';
    });
  }
  content += '<a href="/u/' + esc(a ? a.username : '') + '">' + esc(a ? a.username : '?') + '</a>';
  content += '<span>' + ago(t.createdAt) + '</span>';
  content += '<span>' + t.views + ' goruntuleme</span>';
  content += '</div>';
  if (t.image) content += '<div style="margin-top:14px"><img src="' + esc(t.image) + '" style="max-width:100%;border-radius:8px" onerror="this.style.display=\'none\'"></div>';
  content += '<div class="topic-body">' + esc(t.body) + '</div>';
  var poll = data.polls.of(t.id);
  if (poll) {
    var totalVotes = poll.options.reduce(function(sum, o) { return sum + o.votes.length; }, 0);
    content += '<div class="panel" style="margin-top:14px"><h3 style="margin-bottom:14px">' + esc(poll.question) + '</h3>';
    poll.options.forEach(function(o, idx) {
      var pct = totalVotes ? Math.round(o.votes.length / totalVotes * 100) : 0;
      var mine = s.userId && o.votes.indexOf(s.userId) > -1;
      content += '<form method="post" action="/anket-oy" style="margin-bottom:8px">';
      content += '<input type="hidden" name="pollId" value="' + poll.id + '">';
      content += '<input type="hidden" name="optionIndex" value="' + idx + '">';
      content += '<button type="submit" style="width:100%;text-align:left;background:' + (mine ? '#ede9fe' : '#f5f5f5') + ';border:1px solid ' + (mine ? '#7c3aed' : '#e5e5e5') + ';padding:12px;border-radius:6px;cursor:pointer;font-size:14px;position:relative">';
      content += '<div style="position:absolute;top:0;left:0;height:100%;width:' + pct + '%;background:#ede9fe;border-radius:6px;z-index:0"></div>';
      content += '<span style="position:relative;z-index:1"><b>' + esc(o.text) + '</b> - ' + o.votes.length + ' oy (' + pct + '%)</span>';
      content += '</button></form>';
    });
    content += '<div style="font-size:12px;color:#888;margin-top:8px">Toplam ' + totalVotes + ' oy</div></div>';
  }
  content += act;
  content += '</div></div></div>';
  content += '<h2 class="sec">' + ps.length + ' Cevap</h2>';
  content += (allPosts || '<div class="panel" style="text-align:center;padding:30px;color:#888">Henuz cevap yok.</div>');
  content += form;
  content += '<script>function replyTo(id){document.getElementById("parentId").value=id;window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});document.querySelector("textarea[name=body]").focus();}</script>';
  var ldTopic = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": t.title,
    "articleBody": (t.body || '').substring(0, 300),
    "datePublished": t.createdAt,
    "author": { "@type": "Person", "name": a ? a.username : 'Anonim' },
    "interactionStatistic": [
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/CommentAction", "userInteractionCount": ps.length },
      { "@type": "InteractionCounter", "interactionType": "https://schema.org/ViewAction", "userInteractionCount": t.views }
    ]
  };
  content = '<div style="display:grid;grid-template-columns:1fr 280px;gap:20px" class="with-sidebar"><div>' + content + '</div>' + views.sidebarWidget(s) + '</div>';
  content += '<style>@media(max-width:900px){.with-sidebar{grid-template-columns:1fr !important}}</style>';
  res.send(layout({ title: t.title, desc: (t.body || '').substring(0, 160), canonical: '/konu/' + t.id + '/' + t.slug, ogType: 'article', ldType: 'DiscussionForumPosting', ld: ldTopic, content: content, s: s }));
});

app.get('/yeni-konu', requireUser, function(req, res) {
  var s = session(req, res);
  var cats = data.cats.all();
  var opts = cats.map(function(c) {
    return '<option value="' + c.id + '"' + (String(req.query.kat) === String(c.id) ? ' selected' : '') + '>' + esc(c.name) + '</option>';
  }).join('');
  var prefixOpts = ['', 'Soru', 'Tartisma', 'Anket', 'Duyuru', 'Yardim'].map(function(p) {
    return '<option value="' + p + '">' + (p || 'Onek yok') + '</option>';
  }).join('');
  var c = '<div class="form-box" style="max-width:600px"><h1>Yeni Konu Ac</h1>' +
    (req.query.hata ? '<div class="alert err">' + esc(req.query.hata) + '</div>' : '') +
    '<form method="post" action="/yeni-konu">' +
    '<div class="field"><label>Kategori</label><select name="categoryId" required>' + opts + '</select></div>' +
    '<div class="field"><label>Onek</label><select name="prefix">' + prefixOpts + '</select></div>' +
    '<div class="field"><label>Baslik</label><input type="text" name="title" required minlength="5" maxlength="150"></div>' +
    '<div class="field"><label>Etiketler (virgul ile ayir)</label><input type="text" name="tags" placeholder="yazilim, oyun, teknoloji" maxlength="200"></div>' +
    '<div class="field"><label>Icerik</label>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' +
    '<button type="button" onclick="insertEmoji(this,\":smile:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">😄</button>' +
    '<button type="button" onclick="insertEmoji(this,\":heart:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">❤️</button>' +
    '<button type="button" onclick="insertEmoji(this,\":thumbsup:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">👍</button>' +
    '<button type="button" onclick="insertEmoji(this,\":fire:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">🔥</button>' +
    '<button type="button" onclick="insertEmoji(this,\":joy:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">😂</button>' +
    '<button type="button" onclick="insertEmoji(this,\":cool:\")" style="background:#fafafa;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:18px;cursor:pointer">😎</button>' +
    '</div>' +
    '<textarea name="body" required minlength="10" style="min-height:200px"></textarea></div>' +
    '<div class="field"><label>Resim URL (opsiyonel)</label><input type="url" name="image" placeholder="https://..."></div>' +
    '<details style="margin:14px 0;padding:12px;background:#f8f8f8;border-radius:8px"><summary style="cursor:pointer;font-weight:700;color:#7c3aed">Anket Ekle (opsiyonel)</summary>' +
    '<div style="margin-top:10px"><div class="field"><label>Anket Sorusu</label><input type="text" name="pollQuestion" placeholder="Hangi oyunu tercih edersin?"></div>' +
    '<div class="field"><label>Secenek 1</label><input type="text" name="pollOpt1"></div>' +
    '<div class="field"><label>Secenek 2</label><input type="text" name="pollOpt2"></div>' +
    '<div class="field"><label>Secenek 3</label><input type="text" name="pollOpt3"></div>' +
    '<div class="field"><label>Secenek 4</label><input type="text" name="pollOpt4"></div></div></details>' +
    '<button class="btn full" type="submit">Konuyu Ac</button></form></div>';
  res.send(layout({ title: 'Yeni Konu', content: c, s: s }));
});

app.post('/yeni-konu', requireUser, function(req, res) {
  var s = session(req, res);
  var b = req.body;
  var title = String(b.title || '').trim();
  var body = String(b.body || '').trim();
  var catId = parseInt(b.categoryId, 10);
  var tagsStr = String(b.tags || '').trim();
  var tags = tagsStr ? tagsStr.split(',').map(function(x) { return x.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }).filter(function(x) { return x && x.length >= 2; }).slice(0, 5) : [];
  if (data.flood.check(s.userId, 30)) return res.redirect('/yeni-konu?hata=' + encodeURIComponent('Cok hizli! 30 saniye bekleyin.'));
  var bw1 = data.bannedWords.has(title) || data.bannedWords.has(body);
  if (bw1) return res.redirect('/yeni-konu?hata=' + encodeURIComponent('Yasakli kelime: ' + bw1));
  if (title.length < 5) return res.redirect('/yeni-konu?hata=' + encodeURIComponent('Baslik en az 5 karakter.'));
  if (body.length < 10) return res.redirect('/yeni-konu?hata=' + encodeURIComponent('Icerik en az 10 karakter.'));
  if (!data.cats.byId(catId)) return res.redirect('/yeni-konu?hata=' + encodeURIComponent('Gecersiz kategori.'));
  var me = data.users.byId(s.userId);
  var needApproval = (me.reputation || 0) < 10 && !data.mods.is(s.userId);
  if (needApproval) {
    data.pending.add({ title: title, body: body, categoryId: catId, slug: data.slugify(title), tags: tags, prefix: String(b.prefix || '').trim(), image: String(b.image || '').trim() }, s.userId);
    data.flood.log(s.userId);
    return res.redirect('/?onayBekliyor=1');
  }
  data.flood.log(s.userId);
  var t = data.topics.add({
    title: title, body: body, categoryId: catId, userId: s.userId,
    tags: tags, prefix: String(b.prefix || '').trim(),
    image: String(b.image || '').trim()
  });
  var pollQ = String(b.pollQuestion || '').trim();
  var pollOpts = [b.pollOpt1, b.pollOpt2, b.pollOpt3, b.pollOpt4].map(function(x) { return String(x || '').trim(); }).filter(function(x) { return x; });
  if (pollQ && pollOpts.length >= 2) {
    data.polls.create(t.id, pollQ, pollOpts);
  }
  data.processMentions(body, s.userId, '/konu/' + t.id + '/' + t.slug);
  data.badges.check(s.userId);
  data.economy.add(s.userId, data.economy.isVip(s.userId) ? 20 : 10);
  res.redirect('/konu/' + t.id + '/' + t.slug);
});

app.post('/konu/:id/cevap', requireUser, function(req, res) {
  var s = session(req, res);
  var t = data.topics.byId(parseInt(req.params.id, 10));
  if (!t || t.locked) return res.redirect('/');
  var body = String(req.body.body || '').trim();
  var parentId = req.body.parentId ? parseInt(req.body.parentId, 10) : null;
  if (data.flood.check(s.userId, 15)) return res.redirect('/konu/' + t.id + '/' + t.slug + '?hata=Yavas');
  var bw2 = data.bannedWords.has(body);
  if (bw2) return res.redirect('/konu/' + t.id + '/' + t.slug + '?hata=' + encodeURIComponent('Yasakli kelime: ' + bw2));
  if (body.length < 3) return res.redirect('/konu/' + t.id + '/' + t.slug);
  data.posts.add({ topicId: t.id, userId: s.userId, body: body, parentId: parentId });
  data.processMentions(body, s.userId, '/konu/' + t.id + '/' + t.slug);
  data.badges.check(s.userId);
  if (t.userId !== s.userId) {
    var u = data.users.byId(s.userId);
    data.notifications.add(t.userId, u.username + ' konunuza cevap yazdi: ' + t.title, '/konu/' + t.id + '/' + t.slug);
    try { var mailer = require('./mailer'); var tu = data.users.byId(t.userId); if (tu) mailer.newReply(tu, t, u); } catch (e) {}
    data.save();
  }
  res.redirect('/konu/' + t.id + '/' + t.slug);
});

app.post('/konu/:id/sil', requireUser, function(req, res) {
  var s = session(req, res);
  var id = parseInt(req.params.id, 10);
  var t = data.topics.byId(id);
  if (t && (t.userId === s.userId || s.admin)) data.topics.remove(id);
  res.redirect('/');
});

app.post('/anket-oy', requireUser, function(req, res) {
  var s = session(req, res);
  var pid = parseInt(req.body.pollId, 10);
  var optIdx = parseInt(req.body.optionIndex, 10);
  var p = data.polls.of ? null : null;
  var allPolls = data.polls.all ? data.polls.all() : [];
  var poll = allPolls.find(function(x) { return x.id === pid; });
  if (!poll) return res.redirect('/');
  data.polls.vote(pid, s.userId, optIdx);
  var t = data.topics.byId(poll.topicId);
  res.redirect('/konu/' + t.id + '/' + t.slug);
});

app.post('/oy', requireUser, function(req, res) {
  var s = session(req, res);
  var type = String(req.body.type);
  var id = parseInt(req.body.id, 10);
  var v = parseInt(req.body.v, 10);
  if (['topic', 'post'].indexOf(type) === -1 || [1, -1].indexOf(v) === -1) return res.json({ ok: false });
  data.votes.set(s.userId, type, id, v);
  res.json({ ok: true });
});

};
