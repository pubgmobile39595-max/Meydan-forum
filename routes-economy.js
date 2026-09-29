const data = require('./data');
const views = require('./views');
const { esc, ago, initials, layout } = views;

module.exports = function(app, session, requireUser) {

app.get('/puanlarim', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var pts = data.economy.points(u.id);
  var vip = data.economy.isVip(u.id);
  var ti = data.economy.getTitle(u.id);

  var content = '<h1 class="page">Puanlarim</h1>';
  content += '<div class="stats">';
  content += '<div class="stat"><b>' + pts + '</b><span>Puan</span></div>';
  content += '<div class="stat"><b>' + (u.reputation || 0) + '</b><span>Itibar</span></div>';
  content += '<div class="stat"><b>' + (vip ? 'AKTIF' : 'YOK') + '</b><span>VIP Uyelik</span></div>';
  content += '</div>';

  content += '<div class="panel" style="margin-bottom:20px">';
  content += '<h3>Puan Nasil Kazanilir?</h3>';
  content += '<ul style="line-height:2;padding-left:20px;color:#555;margin-top:10px">';
  content += '<li><b>Konu ac:</b> +10 puan</li>';
  content += '<li><b>Cevap yaz:</b> +3 puan</li>';
  content += '<li><b>Oy al:</b> +5 puan (her upvote)</li>';
  content += '<li><b>Rozet kazan:</b> +50 puan</li>';
  content += '<li><b>Gunluk giris:</b> +1 puan</li>';
  content += '<li><b>VIP uye:</b> 2x puan</li>';
  content += '</ul></div>';

  if (ti) {
    content += '<div class="panel" style="margin-bottom:20px"><h3>Aktif Basligin</h3>';
    content += '<div style="margin-top:10px"><span style="background:' + ti.color + ';color:#fff;padding:6px 14px;border-radius:999px;font-weight:700;font-size:14px">' + esc(ti.name) + '</span></div></div>';
  }

  content += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
  content += '<a class="btn" href="/magaza">Odul Magazasi</a>';
  content += '<a class="btn ' + (vip ? 'gray' : '') + '" href="/vip">' + (vip ? 'VIP Detay' : 'VIP Ol') + '</a>';
  content += '</div>';
  res.send(layout({ title: 'Puanlarim', content: content, s: s }));
});

app.get('/magaza', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var pts = data.economy.points(u.id);
  var myTitles = u.titles || [];

  var content = '<h1 class="page">Odul Magazasi</h1>';
  content += '<div class="panel" style="margin-bottom:20px;background:#ede9fe">';
  content += '<div style="font-size:14px;color:#666">Mevcut Puanin</div>';
  content += '<div style="font-size:32px;font-weight:800;color:#7c3aed">' + pts + ' puan</div>';
  content += '</div>';

  content += '<h2 class="sec">Kullanici Basliklari</h2>';
  content += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">';
  data.TITLES.forEach(function(ti) {
    if (ti.vipOnly) return;
    var owned = myTitles.indexOf(ti.id) > -1;
    var active = u.activeTitle === ti.id;
    var canBuy = pts >= ti.cost;
    content += '<div class="panel" style="text-align:center;padding:20px">';
    content += '<div style="font-size:20px;font-weight:800;color:' + ti.color + ';margin-bottom:8px">' + esc(ti.name) + '</div>';
    content += '<div style="font-size:22px;font-weight:800;color:#7c3aed;margin-bottom:12px">' + ti.cost + ' puan</div>';
    if (active) {
      content += '<div style="background:#dcfce7;color:#15803d;padding:8px;border-radius:6px;font-weight:700;font-size:13px">AKTIF</div>';
    } else if (owned) {
      content += '<form method="post" action="/baslik-sec"><input type="hidden" name="id" value="' + ti.id + '"><button class="btn full" type="submit">Kullan</button></form>';
    } else if (canBuy) {
      content += '<form method="post" action="/baslik-al"><input type="hidden" name="id" value="' + ti.id + '"><button class="btn full" type="submit">Satin Al</button></form>';
    } else {
      content += '<div style="background:#f5f5f5;color:#888;padding:8px;border-radius:6px;font-size:12px">' + (ti.cost - pts) + ' puan daha gerekli</div>';
    }
    content += '</div>';
  });
  content += '</div>';

  res.send(layout({ title: 'Magaza', content: content, s: s }));
});

app.post('/baslik-al', requireUser, function(req, res) {
  var s = session(req, res);
  data.economy.setTitle(s.userId, String(req.body.id || ''));
  res.redirect('/magaza');
});

app.post('/baslik-sec', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var ti = String(req.body.id || '');
  if (u.titles && u.titles.indexOf(ti) > -1) {
    data.users.update(s.userId, { activeTitle: ti });
  }
  res.redirect('/magaza');
});

app.get('/vip', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var vip = data.economy.isVip(u.id);
  var until = u.vipUntil ? new Date(u.vipUntil).toLocaleDateString('tr-TR') : null;

  var content = '<h1 class="page">VIP Uyelik</h1>';
  content += '<div class="panel" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:30px;text-align:center;margin-bottom:20px">';
  content += '<div style="font-size:52px">👑</div>';
  content += '<h2 style="font-size:24px;margin:10px 0">Meydan VIP</h2>';
  content += '<p style="opacity:.9;margin-bottom:20px">Ayricaliklarla dolu deneyim</p>';
  if (vip) {
    content += '<div style="background:rgba(0,0,0,.2);padding:14px;border-radius:8px;font-weight:800">AKTIF - Bitis: ' + until + '</div>';
  } else {
    content += '<div style="font-size:28px;font-weight:800">500 puan / 30 gun</div>';
  }
  content += '</div>';

  content += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:20px">';
  content += '<div class="panel"><div style="font-size:32px">⭐</div><h4>VIP Rozet</h4><p style="color:#666;font-size:13px;margin-top:6px">Profilinde ozel VIP rozeti</p></div>';
  content += '<div class="panel"><div style="font-size:32px">2x</div><h4>2x Puan</h4><p style="color:#666;font-size:13px;margin-top:6px">Tum puan kazanclari iki katina</p></div>';
  content += '<div class="panel"><div style="font-size:32px">👑</div><h4>Ozel Baslik</h4><p style="color:#666;font-size:13px;margin-top:6px">VIP basligi kullanma hakki</p></div>';
  content += '<div class="panel"><div style="font-size:32px">🚫</div><h4>Reklamsiz</h4><p style="color:#666;font-size:13px;margin-top:6px">Reklamlar gorunmez</p></div>';
  content += '</div>';

  if (!vip) {
    content += '<form method="post" action="/vip-ol"><button class="btn full" type="submit" style="padding:16px;font-size:16px">VIP Ol - 500 Puan</button></form>';
    content += '<p style="text-align:center;color:#888;font-size:12px;margin-top:10px">Mevcut puanin: ' + data.economy.points(u.id) + '</p>';
  }
  // Iletisim paneli
  content += '<div class="panel" style="margin-top:20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:24px">';
  content += '<h3 style="margin-bottom:14px;font-size:18px">📞 VIP icin Bize Ulasin</h3>';
  content += '<p style="opacity:.9;font-size:13px;margin-bottom:16px">Odeme veya ozel VIP paketleri icin asagidan iletisime gecin:</p>';
  content += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  content += '<a href="https://t.me/Cipherteam394" target="_blank" style="background:#fff;color:#7c3aed;padding:12px 20px;border-radius:8px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:8px">📱 Telegram: @Cipherteam394</a>';
  content += '<a href="mailto:globalticaret42@gmail.com" style="background:rgba(255,255,255,.2);color:#fff;padding:12px 20px;border-radius:8px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:8px">📧 globalticaret42@gmail.com</a>';
  content += '</div></div>';
  res.send(layout({ title: 'VIP', content: content, s: s }));
});

app.post('/vip-ol', requireUser, function(req, res) {
  var s = session(req, res);
  if (data.economy.spend(s.userId, 500)) {
    data.economy.activateVip(s.userId, 30);
    data.notifications.add(s.userId, 'VIP uyeligi aktif! 30 gun boyunca ayricaliklarin keyfini cikar.', '/vip');
    data.save();
  }
  res.redirect('/vip');
});

};
