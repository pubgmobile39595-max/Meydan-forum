const settings = require('./settings');
const data = require('./data');
const theme = require('./theme');

function esc(s) {
  var m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return m[c]; });
}
function ago(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'az once';
  if (d < 3600) return Math.floor(d / 60) + ' dk';
  if (d < 86400) return Math.floor(d / 3600) + ' sa';
  if (d < 2592000) return Math.floor(d / 86400) + ' gun';
  return new Date(iso).toLocaleDateString('tr-TR');
}
function renderMarkdown(s) {
  if (!s) return '';
  var out = esc(s);
  // YouTube embed
  out = out.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/g, '<div style="margin:12px 0;position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px"><iframe src="https://www.youtube.com/embed/$1" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>');
  // Kod blogu
  out = out.replace(/```([\s\S]*?)```/g, '<pre style="background:#1e1e1e;color:#eee;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px"><code>$1</code></pre>');
  out = out.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>');
  // Bold / italic
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  // Link preview
  out = out.replace(/(https?:\/\/[^\s<]+)/g, function(url) {
    return '<a href="' + url + '" target="_blank" rel="noopener" style="color:#7c3aed;text-decoration:underline">' + url + '</a>';
  });
  // Emoji kodlari
  out = out.replace(/:smile:/g, '😄').replace(/:heart:/g, '❤️').replace(/:thumbsup:/g, '👍').replace(/:fire:/g, '🔥').replace(/:joy:/g, '😂').replace(/:cry:/g, '😢').replace(/:wow:/g, '😮').replace(/:cool:/g, '😎').replace(/:angry:/g, '😡').replace(/:clap:/g, '👏');
  // Satir sonlari
  out = out.replace(/\n/g, '<br>');
  return out;
}

function avatarImg(u, size) {
  var s = size || 40;
  if (u && u.avatar) {
    return '<img src="' + esc(u.avatar) + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex:none" onerror="this.style.display=\'none\'">';
  }
  return '<div class="topic-avatar" style="width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s/2.6) + 'px">' + initials(u ? u.username : "?") + '</div>';
}

function initials(n) {
  return String(n || '?').substring(0, 2).toUpperCase();
}

function layout(o) {
  var s = o.s;
  var user = s.userId ? data.users.byId(s.userId) : null;
  var unread = user ? data.notifications.unread(user.id) : 0;
  var area = user
    ? '<a class="act" href="/u/' + esc(user.username) + '">' + esc(user.username) + '</a>'
    : '<a class="act" href="/giris">Giris</a>';

  var h = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">';
  h += '<meta name="viewport" content="width=device-width,initial-scale=1">';
  h += '<meta name="theme-color" content="#7c3aed">';
  h += '<meta name="apple-mobile-web-app-capable" content="yes">';
  h += '<meta name="apple-mobile-web-app-title" content="' + esc(settings.get('siteName')) + '">';
  h += '<link rel="manifest" href="/manifest.json">';
  // GA4 - Google Analytics 4 (olcum kimligi ekleyince aktif olur)
  h += '<script>window.GA_ID="G-XXXXXXXX";</script>';
  h += '<title>' + esc(o.title) + ' - ' + esc(settings.get('siteName')) + '</title>';
  h += '<meta name="description" content="' + esc(o.desc || o.title + ' - ' + settings.get('siteName') + ' forum') + '">';
  h += '<meta name="keywords" content="forum, tartisma, meydan, topluluk, konu, yorum">';
  h += '<meta name="author" content="' + esc(settings.get('siteName')) + '">';
  h += '<link rel="canonical" href="http://127.0.0.1:8083' + esc(o.canonical || '/') + '">';
  h += '<meta property="og:site_name" content="' + esc(settings.get('siteName')) + '">';
  h += '<meta property="og:title" content="' + esc(o.title) + '">';
  h += '<meta property="og:description" content="' + esc(o.desc || o.title) + '">';
  h += '<meta property="og:type" content="' + (o.ogType || 'website') + '">';
  h += '<meta property="og:url" content="http://127.0.0.1:8083' + esc(o.canonical || '/') + '">';
  h += '<meta name="twitter:card" content="summary_large_image">';
  h += '<meta name="twitter:title" content="' + esc(o.title) + '">';
  h += '<meta name="twitter:description" content="' + esc(o.desc || o.title) + '">';
  // JSON-LD yapisal veri
  var ld = { "@context": "https://schema.org", "@type": o.ldType || "WebSite", "name": "Meydan", "url": "http://127.0.0.1:8083", "potentialAction": { "@type": "SearchAction", "target": "http://127.0.0.1:8083/gelismis-ara?q={search_term_string}", "query-input": "required name=search_term_string" } };
  if (o.ld) ld = o.ld;
  h += '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
  var tema = s.tema || 'light';
  h += '<style>' + theme.buildCSS() + '</style>';
  h += '<style>.admin-dd-item{display:block;padding:9px 16px;font-size:13px;color:#333;text-decoration:none;font-weight:600}.admin-dd-item:hover{background:#f5f5f5;color:#7c3aed}.admin-dd-menu{max-height:80vh;overflow-y:auto}</style>';
  h += '</head><body class="' + (tema === 'dark' ? 'dark' : '') + '">';
  h += '<header><div class="wrap">';
  h += '<a class="logo" href="/">Meydan<span>.</span></a>';
  h += '<form action="/ara" method="get" style="flex:1;display:flex;max-width:400px"><input class="q" type="text" name="q" placeholder="Ara..." value="' + esc(o.q || '') + '"></form>';
  h += '<nav style="display:flex;gap:8px;margin-left:auto;align-items:center">';
  if (user) h += '<a class="act" href="/yeni-konu">+ Konu</a>';
  if (user) h += '<a class="act" href="/mesajlar">Mesaj</a>';
  if (user) h += '<a class="act" href="/liderler">Liderler</a>';
  h += '<a class="act" href="/istatistikler">Istatistik</a>';
  h += '<a class="act" href="/canli">Canli</a>';
  h += '<a class="act" href="/rozetler">Rozetler</a>';
  h += '<a class="act" href="/gruplar">Gruplar</a>';
  if (user) h += '<a class="act" href="/gruplarim">Gruplarim</a>';
  if (user) h += '<a class="act" href="/senin-icin">Senin Icin</a>';
  if (user) h += '<a class="act" href="/ayarlar-bildirim">Bil.Ayar</a>';
  if (user) h += '<a class="act" href="/puanlarim">' + (function(){var p=data.economy.points(user.id);return p>0?('⭐ '+p):'Puan';})() + '</a>';
  if (user) h += '<a class="act" href="/magaza">Magaza</a>';
  if (user) h += '<a class="act" href="/vip">VIP</a>';
  if (user) h += '<a class="act" href="/odeme">Odeme</a>';
  if (user) h += '<a class="act" href="/bildirimler">Bildirim' + (unread ? '<span class="badge">' + unread + '</span>' : '') + '</a>';
  if (!s.admin) {
    h += '<a class="act" href="/admin" title="Yonetici girisi">Yonetim</a>';
  }
  if (s.admin) {
    h += '<div class="admin-dd" style="position:relative;display:inline-block">';
    h += '<button class="act" onclick="toggleAdminDD(event)">Yonetim v</button>';
    h += '<div id="adminDD" class="admin-dd-menu" style="display:none;position:absolute;top:100%;right:0;background:#fff;color:#222;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.2);min-width:220px;padding:8px 0;z-index:999;margin-top:6px">';
    h += '<a href="/admin" class="admin-dd-item">Dashboard</a>';
    h += '<a href="/admin?tab=konular" class="admin-dd-item">Konular</a>';
    h += '<a href="/admin?tab=kullanicilar" class="admin-dd-item">Kullanicilar</a>';
    h += '<a href="/admin?tab=kategoriler" class="admin-dd-item">Kategoriler</a>';
    h += '<a href="/admin?tab=sikayetler" class="admin-dd-item">Sikayetler</a>';
    h += '<a href="/admin?tab=banlar" class="admin-dd-item">Banlar</a>';
    h += '<a href="/admin?tab=log" class="admin-dd-item">Log</a>';
    h += '<a href="/admin?tab=yedek" class="admin-dd-item">Yedek & Bildirim</a>';
    h += '<a href="/admin?tab=raporlar" class="admin-dd-item">Raporlar</a>';
    h += '<div style="border-top:1px solid #eee;margin:6px 0"></div>';
    h += '<a href="/mod" class="admin-dd-item">Moderator Paneli</a>';
    h += '<a href="/mod/onay-kuyrugu" class="admin-dd-item">Onay Kuyrugu</a>';
    h += '<a href="/mod/yasakli-kelimeler" class="admin-dd-item">Yasakli Kelimeler</a>';
    h += '<div style="border-top:1px solid #eee;margin:6px 0"></div>';
    h += '<a href="/admin/logout" class="admin-dd-item" style="color:#dc2626">Cikis Yap</a>';
    h += '</div></div>';
  }
  if (s.userId && data.mods.is(s.userId)) h += '<a class="act" href="/mod">Mod</a>';
  h += area;
  h += '<button class="act" onclick="toggleTheme()" id="themeBtn">' + (tema === 'dark' ? 'Acik' : 'Koyu') + '</button>';
  if (user) h += '<form method="post" action="/cikis" style="display:inline"><button class="act" type="submit">Cikis</button></form>';
  h += '</nav></div></header>';
  h += '<main><div class="wrap">' + o.content + '</div></main>';
  h += '<footer><div class="wrap"><div style="margin-bottom:14px;padding:14px;background:rgba(255,255,255,.05);border-radius:8px"><div style="font-weight:700;color:#fff;margin-bottom:8px">Iletisim</div>' +
    '<a href="https://t.me/Cipherteam394" target="_blank" style="color:#7c3aed;margin-right:16px;font-weight:700">Telegram: @Cipherteam394</a>' +
    '<a href="mailto:globalticaret42@gmail.com" style="color:#7c3aed;font-weight:700">E-posta: globalticaret42@gmail.com</a></div>' +
    '<div style="margin-bottom:10px"><a href="/hakkimizda" style="color:#aaa;margin:0 10px">Hakkimizda</a><a href="/kurallar" style="color:#aaa;margin:0 10px">Kurallar</a><a href="/gizlilik" style="color:#aaa;margin:0 10px">Gizlilik</a><a href="/sss" style="color:#aaa;margin:0 10px">SSS</a><a href="/istatistikler" style="color:#aaa;margin:0 10px">Istatistik</a></div>' + esc(settings.get('footerText')) + '</div></footer>';
  h += '<script>function requestNotify(){if(!("Notification" in window))return;if(Notification.permission==="granted")return;Notification.requestPermission();}' +
  'function showToast(msg){var d=document.createElement("div");d.textContent=msg;d.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2)";document.body.appendChild(d);setTimeout(function(){d.remove();},2500);}' +
  'if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/service-worker.js").catch(function(){});});}' +
  'function toggleTheme(){var cur=document.body.classList.contains("dark")?"dark":"light";var next=cur==="dark"?"light":"dark";document.cookie="tema="+next+";path=/;max-age=31536000";location.reload();}' +
  'function react(id,em){fetch("/tepki",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id+"&emoji="+em}).then(function(){location.reload()});}' +
  'function bookmark(id){fetch("/kaydet",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id}).then(function(){location.reload()});}' +
  'function followToggle(id){fetch("/takip",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id}).then(function(){location.reload()});}' +
  'function blockToggle(id){if(!confirm("Emin misiniz?"))return;fetch("/engelle",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"id="+id}).then(function(){location.reload()});}' +
  'function vote(t,id,v){fetch("/oy",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"type="+t+"&id="+id+"&v="+v}).then(function(){location.reload()});}</script>';
  h += '<button onclick="window.scrollTo({top:0,behavior:\'smooth\'})" id="topBtn" style="position:fixed;bottom:20px;right:20px;width:48px;height:48px;border-radius:50%;background:#7c3aed;color:#fff;border:0;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);display:none;z-index:998">^</button>' +
  '<script>window.addEventListener("scroll",function(){var b=document.getElementById("topBtn");if(b)b.style.display=window.scrollY>300?"block":"none";});</script>' +
  '</body></html>';
  return h;
}
function topicCard(t, s) {
  var a = data.users.byId(t.userId);
  var c = data.cats.byId(t.categoryId);
  var v = s.userId ? data.votes.get(s.userId, 'topic', t.id) : 0;
  var sc = data.votes.count('topic', t.id);
  var pc = data.posts.byTopic(t.id).length;
  var h = '<div class="topic"><div class="topic-vote">';
  h += '<button class="vote-btn ' + (v === 1 ? 'on-up' : '') + '" onclick="vote(\'topic\',' + t.id + ',1)">+</button>';
  h += '<div class="vote-count">' + sc + '</div>';
  h += '<button class="vote-btn ' + (v === -1 ? 'on-down' : '') + '" onclick="vote(\'topic\',' + t.id + ',-1)">-</button>';
  h += '</div><div class="topic-info">';
  if (t.pinned) h += '<span class="prefix">SABIT</span>';
  if (t.locked) h += '<span class="prefix">KILITLI</span>';
  if (t.prefix) h += '<span class="prefix">' + esc(t.prefix) + '</span>';
  h += '<a href="/konu/' + t.id + '/' + esc(t.slug) + '"><div class="topic-title">' + esc(t.title) + '</div></a>';
  h += '<div class="topic-meta">';
  if (t.groupId) { var grp = data.groups.byId(t.groupId); if (grp) h += '<a href="/grup/' + esc(grp.slug) + '"><span class="tag" style="background:#ede9fe;color:#7c3aed">Grup: ' + esc(grp.name) + '</span></a>'; }
  else if (c) h += '<a href="/kategori/' + c.slug + '"><span class="tag">' + esc(c.name) + '</span></a>';
  if (t.tags && t.tags.length) {
    t.tags.forEach(function(tag) {
      h += '<a href="/etiket/' + encodeURIComponent(tag) + '"><span class="tag">#' + esc(tag) + '</span></a>';
    });
  }
  var tTitle = a ? data.economy.getTitle(a.id) : null;
  var tVip = a ? data.economy.isVip(a.id) : false;
  h += '<span>' + esc(a ? a.username : '?') + (tTitle ? ' <b style="color:' + tTitle.color + ';font-size:11px">[' + esc(tTitle.name) + ']</b>' : '') + (tVip ? ' <b style="color:#f59e0b;font-size:11px">VIP</b>' : '') + '</span>';
  h += '<span>' + pc + ' cevap</span>';
  h += '<span>' + (t.views || 0) + ' goruntuleme</span>';
  h += '<span>' + ago(t.createdAt) + '</span>';
  h += '</div></div>';
  var bookmarked = s.userId && data.bookmarks.has(s.userId, t.id);
  h += '<button class="bookmark-btn ' + (bookmarked ? 'on' : '') + '" onclick="event.preventDefault();event.stopPropagation();bookmark(' + t.id + ')" title="Kaydet">' + (bookmarked ? 'Kayitli' : 'Kaydet') + '</button>';
  h += '<a href="/u/' + esc(a ? a.username : '') + '" style="flex:none">' + avatarImg(a, 40) + '</a>';
  h += '</div>';
  return h;
}

function postCard(p, s, isNested) {
  var u = data.users.byId(p.userId);
  var pv = s.userId ? data.votes.get(s.userId, 'post', p.id) : 0;
  var psc = data.votes.count('post', p.id);
  var h = '<div class="post' + (isNested ? ' nested' : '') + '">';
  h += '<div class="topic-vote" style="min-width:44px">';
  h += '<button class="vote-btn ' + (pv === 1 ? 'on-up' : '') + '" onclick="vote(\'post\',' + p.id + ',1)">+</button>';
  h += '<div class="vote-count">' + psc + '</div>';
  h += '<button class="vote-btn ' + (pv === -1 ? 'on-down' : '') + '" onclick="vote(\'post\',' + p.id + ',-1)">-</button>';
  h += '</div><div class="post-content">';
  var pTitle = u ? data.economy.getTitle(u.id) : null;
  var pVip = u ? data.economy.isVip(u.id) : false;
  h += '<div class="post-head">' + avatarImg(u, 26) + '<a href="/u/' + esc(u ? u.username : '') + '"><b>' + esc(u ? u.username : '?') + '</b></a>';
  if (pTitle) h += '<span style="color:' + pTitle.color + ';font-size:11px;font-weight:700">' + esc(pTitle.name) + '</span>';
  if (pVip) h += '<span style="color:#f59e0b;font-size:11px;font-weight:700">VIP</span>';
  if (u && u.role === 'admin') h += '<span class="tag">Admin</span>';
  h += '<span> - ' + ago(p.createdAt) + '</span>';
  h += '</div>';
  h += '<div class="post-body">' + renderMarkdown(p.body) + '</div>';
  // Reaksiyonlar
  var rmap = data.reactions.list(p.id);
  var emojis = ['like', 'love', 'haha', 'wow'];
  h += '<div class="reactions">';
  emojis.forEach(function(em) {
    var count = rmap[em] || 0;
    var on = s.userId && data.reactions.has(s.userId, p.id, em);
    h += '<button class="reaction ' + (on ? 'on' : '') + '" onclick="react(' + p.id + ',\'' + em + '\')">' + em + (count ? ' <span class="reaction-count">' + count + '</span>' : '') + '</button>';
  });
  h += '</div>';

  if (s.userId && !isNested) {
    h += '<div style="margin-top:8px;font-size:12px">';
    h += '<a href="javascript:void(0)" onclick="replyTo(' + p.id + ')" style="color:#7c3aed">Cevapla</a>';
    h += ' · <a href="/sikayet/post/' + p.id + '" style="color:#888">Sikayet</a>';
    h += '</div>';
  } else if (s.userId && isNested) {
    h += '<div style="margin-top:8px;font-size:12px"><a href="/sikayet/post/' + p.id + '" style="color:#888">Sikayet</a></div>';
  }
  h += '</div></div>';
  return h;
}


function followBtn(s, u) {
  if (!s.userId || s.userId === u.id) return '';
  var on = data.follows.is(s.userId, u.id);
  return '<button class="btn sm ' + (on ? 'gray' : '') + '" onclick="followToggle(' + u.id + ')" style="margin-left:8px">' + (on ? 'Takibi Birak' : 'Takip Et') + '</button>';
}

function blockBtn(s, u) {
  if (!s.userId || s.userId === u.id) return '';
  var on = data.blocks.is(s.userId, u.id);
  return '<button class="btn sm gray" onclick="blockToggle(' + u.id + ')" style="margin-left:8px">' + (on ? 'Engeli Kaldir' : 'Engelle') + '</button>';
}


function sidebarWidget(s) {
  var trending = data.analytics.trending(24, 5);
  var online = data.analytics.onlineList();
  var topUsers = data.topUsers(5);
  var h = '<aside style="display:flex;flex-direction:column;gap:14px">';

  // Online
  h += '<div class="panel"><h3 style="font-size:14px;margin-bottom:10px">🟢 Su An Online (' + online.length + ')</h3>';
  if (online.length) {
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    online.slice(0, 12).forEach(function(u) {
      h += '<a href="/u/' + esc(u.username) + '" style="background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700">' + esc(u.username) + '</a>';
    });
    h += '</div>';
  } else h += '<div style="color:#888;font-size:13px">Kimse yok</div>';
  h += '</div>';

  // Trend
  h += '<div class="panel"><h3 style="font-size:14px;margin-bottom:10px">🔥 Trend Konular</h3>';
  if (trending.length) {
    trending.forEach(function(x, i) {
      h += '<a href="/konu/' + x.topic.id + '/' + x.topic.slug + '" style="display:block;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;line-height:1.4">' +
        '<b style="color:#7c3aed">' + (i + 1) + '.</b> ' + esc(x.topic.title.substring(0, 50)) + (x.topic.title.length > 50 ? '...' : '') + '</a>';
    });
  } else h += '<div style="color:#888;font-size:13px">Trend yok</div>';
  h += '</div>';

  // Liderler
  h += '<div class="panel"><h3 style="font-size:14px;margin-bottom:10px">⭐ Liderler</h3>';
  topUsers.forEach(function(u, i) {
    h += '<a href="/u/' + esc(u.username) + '" style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px">' +
      '<b style="color:#7c3aed;min-width:18px">' + (i + 1) + '.</b>' +
      '<span>' + esc(u.username) + '</span>' +
      '<b style="color:#888;margin-left:auto;font-size:11px">' + u._score + '</b></a>';
  });
  h += '</div>';

  // Kategoriler
  h += '<div class="panel"><h3 style="font-size:14px;margin-bottom:10px">📂 Kategoriler</h3>';
  data.cats.all().slice(0, 6).forEach(function(c) {
    var n = data.topics.byCat(c.id).length;
    h += '<a href="/kategori/' + c.slug + '" style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#555">' +
      '<span>' + esc(c.name) + '</span><b style="color:#7c3aed">' + n + '</b></a>';
  });
  h += '</div>';

  h += '</aside>';
  return h;
}


function adBanner(s, position) {
  if (s.userId && data.economy.isVip(s.userId)) return '';
  var pos = position || 'top';
  var h = '<div style="background:linear-gradient(135deg,#1e1e1e,#333);color:#fff;padding:16px;border-radius:10px;text-align:center;margin-bottom:16px;position:relative">';
  h += '<div style="position:absolute;top:6px;right:10px;font-size:10px;color:#888">REKLAM</div>';
  h += '<div style="font-size:12px;color:#aaa;margin-bottom:6px">Reklamlar sayesinde ucretsiz</div>';
  h += '<div style="font-weight:800;font-size:15px">Reklamsiz deneyim icin VIP olun</div>';
  h += '<a href="/odeme" style="display:inline-block;margin-top:10px;background:#f27a1a;color:#fff;padding:8px 18px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none">VIP Ol</a>';
  h += '</div>';
  return h;
}

module.exports = {
  esc: esc,
  ago: ago,
  initials: initials,
  layout: layout,
  topicCard: topicCard,
  postCard: postCard,
  followBtn: followBtn,
  blockBtn: blockBtn,
  renderMarkdown: renderMarkdown,
  avatarImg: avatarImg,
  sidebarWidget: sidebarWidget,
  adBanner: adBanner
};
