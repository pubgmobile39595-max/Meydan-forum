const data = require('./data');
const views = require('./views');
const { esc, layout } = views;

module.exports = function(app, session, requireUser) {

var WALLET = {
  'USDT-TRC20': 'TU6TWyr7ywpUsK159vALkwW9qS2ZaByeYW',
  'BTC':        'bc1qa9fseamk6xkuj6ac7uzpuvd4hhwuqukggc70xc',
  'ETH-ERC20':  '0xa317C9aF233AC732f1C97adFDdF5bB5b1a014Afd',
  'SOL':        '3H5nsTGjJsNHuBQWgkprLB7soHWcvfWwN5dL8BSyhe7i'
};

var PLANS = {
  'vip-30':      { name: 'VIP 30 Gun',   days: 30,    price: 5,   popular: false },
  'vip-90':      { name: 'VIP 90 Gun',   days: 90,    price: 13,  popular: true  },
  'vip-365':     { name: 'VIP Yillik',   days: 365,   price: 40,  popular: false },
  'vip-forever': { name: 'VIP Sinirsiz', days: 36500, price: 100, popular: false }
};

app.get('/odeme', requireUser, function(req, res) {
  var s = session(req, res);
  var u = data.users.byId(s.userId);
  var vip = data.economy.isVip(u.id);
  var bekleyen = data.payments.byUser(u.id).filter(function(p){ return p.status === 'bekliyor'; }).length;

  var plansHtml = '';
  Object.keys(PLANS).forEach(function(k) {
    var p = PLANS[k];
    plansHtml += '<div class="panel" style="text-align:center;padding:26px;position:relative;' + (p.popular ? 'border:2px solid #f59e0b' : '') + '">';
    if (p.popular) plansHtml += '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#f59e0b;color:#fff;padding:4px 16px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap">EN POPULER</div>';
    plansHtml += '<div style="font-size:20px;font-weight:800;color:#7c3aed;margin-bottom:10px">' + p.name + '</div>';
    plansHtml += '<div style="font-size:38px;font-weight:800;margin:10px 0">$' + p.price + '</div>';
    plansHtml += '<div style="font-size:13px;color:#888;margin-bottom:20px">' + (p.days >= 36500 ? 'Omur boyu' : p.days + ' gun') + '</div>';
    plansHtml += '<form method="post" action="/odeme-baslat"><input type="hidden" name="plan" value="' + k + '">';
    plansHtml += '<button class="btn full" type="submit" style="padding:14px;font-size:15px">' + (vip ? 'Uzat' : 'Satin Al') + '</button></form>';
    plansHtml += '</div>';
  });

  var content = '<h1 class="page">VIP Uyelik Satin Al</h1>';
  content += '<div class="alert info" style="margin-bottom:20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff"><b>Kripto Para ile Odeme</b> - USDT, BTC, ETH veya SOL gonderin.</div>';
  if (vip) content += '<div class="alert ok">Aktif VIP uyeginiz var.</div>';
  if (bekleyen) content += '<div class="alert info">' + bekleyen + ' bekleyen odeme. <a href="/odeme-gecmisi">Goruntule</a></div>';
  content += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;margin-bottom:24px">' + plansHtml + '</div>';
  content += '<div class="panel" style="background:#f8f8f8"><h3>Odeme Nasil Yapilir?</h3><ol style="padding-left:22px;color:#555;font-size:14px;line-height:2.1">';
  content += '<li>Plan secin, <b>Satin Al</b> tiklayin</li><li>Cuzdan adresine <b>tam tutari</b> gonderin</li><li><b>"Odemeyi Yaptim"</b> butonuna basin</li><li>Onay bekleyin (5-30 dk)</li><li>VIP otomatik aktif olur</li></ol></div>';
  res.send(layout({ title: 'Odeme', content: content, s: s }));
});

app.post('/odeme-baslat', requireUser, function(req, res) {
  var s = session(req, res);
  var planKey = String(req.body.plan || '');
  var plan = PLANS[planKey];
  if (!plan) return res.redirect('/odeme');
  var orderId = 'MD' + Date.now().toString(36).toUpperCase() + s.userId;
  var p = data.payments.create(s.userId, planKey, plan.price, 'USD');
  data.payments.update(p.id, { orderId: orderId, status: 'bekliyor' });
  data.payments.log(p.id, 'created', { plan: planKey, price: plan.price });
  res.redirect('/odeme-yap/' + p.id);
});

app.get('/odeme-yap/:id', requireUser, function(req, res) {
  var s = session(req, res);
  var p = data.payments.byId(req.params.id);
  if (!p || p.userId !== s.userId) return res.redirect('/odeme');
  var plan = PLANS[p.plan];
  if (!plan) return res.redirect('/odeme');

  if (!p.expiresAt) {
    var exp = new Date(Date.now() + 30 * 60000);
    data.payments.update(p.id, { expiresAt: exp.toISOString() });
    p.expiresAt = exp.toISOString();
  }
  var kalanDk = Math.max(0, Math.floor((new Date(p.expiresAt) - Date.now()) / 60000));

  function qr(url) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
  }

  function coinBlock(label, color, symbol, addr, prefix, note) {
    var h = '<div class="panel" style="margin-bottom:14px;border:2px solid ' + color + '">';
    h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><span style="background:' + color + ';color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800">' + symbol + '</span><h3 style="font-size:16px">' + label + '</h3></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 200px;gap:20px;align-items:start"><div>';
    h += '<div style="font-size:12px;color:#888;font-weight:700;margin-bottom:6px">GONDERILECEK ADRES:</div>';
    h += '<div style="background:#f8f8f8;padding:14px;border-radius:8px;word-break:break-all;font-family:monospace;font-size:14px;font-weight:700;color:#7c3aed;margin-bottom:10px">' + esc(addr) + '</div>';
    h += '<button onclick="kopyala(\'' + addr + '\')" style="background:' + color + ';color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer">Adresi Kopyala</button>';
    if (note) h += '<div style="font-size:12px;color:#888;margin-top:12px;line-height:1.7">' + note + '</div>';
    h += '</div><div style="text-align:center"><img src="' + qr(prefix + addr) + '" width="180" height="180" style="border-radius:8px;border:1px solid #ddd"><div style="font-size:11px;color:#888;margin-top:6px">QR ile Tara</div></div>';
    h += '</div></div>';
    return h;
  }

  var content = '<h1 class="page">Odeme Yap</h1>';
  content += '<div class="panel" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;margin-bottom:20px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px">';
  content += '<div><div style="font-size:12px;opacity:.8;font-weight:700">SIPARIS</div><div style="font-size:18px;font-weight:800">' + esc(p.orderId || p.id) + '</div></div>';
  content += '<div><div style="font-size:12px;opacity:.8;font-weight:700">PLAN</div><div style="font-size:18px;font-weight:800">' + esc(plan.name) + '</div></div>';
  content += '<div><div style="font-size:12px;opacity:.8;font-weight:700">TUTAR</div><div style="font-size:18px;font-weight:800">$' + plan.price + '</div></div>';
  content += '<div><div style="font-size:12px;opacity:.8;font-weight:700">KALAN SURE</div><div style="font-size:18px;font-weight:800" id="sayac">' + kalanDk + ':00</div></div>';
  content += '</div></div>';

  content += coinBlock('USDT (TRC20 Agi)', '#26a17b', 'ONERILEN', WALLET['USDT-TRC20'], '', 'Sadece <b>TRC20 (Tron)</b> ile gonderin. Yanlis ag = para kaybi.');
  content += coinBlock('Bitcoin', '#f7931a', 'BTC', WALLET['BTC'], 'bitcoin:', '');
  content += coinBlock('Ethereum (ERC20)', '#627eea', 'ETH', WALLET['ETH-ERC20'], '', 'Sadece <b>ERC20</b> agi. BEP20/TRC20 gonderme!');
  content += coinBlock('Solana', '#9945ff', 'SOL', WALLET['SOL'], 'solana:', '');

  content += '<div class="panel" style="background:#fff7ed;border:2px solid #f59e0b">';
  content += '<h3 style="font-size:16px;margin-bottom:10px;color:#b45309">Odemeyi Yaptiniz mi?</h3>';
  content += '<p style="font-size:14px;color:#666;margin-bottom:14px">Odeme sonrasi asagidaki butona tiklayin. Admin onaylayinca VIP aktif olur.</p>';
  content += '<form method="post" action="/odeme-bildir/' + p.id + '">';
  content += '<input type="text" name="txid" placeholder="TXID / Islem Hash (opsiyonel)" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;font-size:14px">';
  content += '<button class="btn full" type="submit" style="background:#f59e0b;padding:14px;font-size:15px;font-weight:800;color:#fff">ODEMEYI YAPTIM</button>';
  content += '</form></div>';

  content += '<script>function kopyala(t){navigator.clipboard.writeText(t);alert("Kopyalandi: "+t)}';
  content += 'var sn=' + (kalanDk * 60) + ';var t=setInterval(function(){if(sn<=0){clearInterval(t);document.getElementById("sayac").textContent="0:00";return}sn--;var m=Math.floor(sn/60);var ss=sn%60;document.getElementById("sayac").textContent=m+":"+(ss<10?"0":"")+ss;},1000);<\/script>';

  res.send(layout({ title: 'Odeme Yap', content: content, s: s }));
});

app.post('/odeme-bildir/:id', requireUser, function(req, res) {
  var s = session(req, res);
  var p = data.payments.byId(req.params.id);
  if (!p || p.userId !== s.userId) return res.redirect('/odeme');
  if (p.status !== 'bekliyor') return res.redirect('/odeme-gecmisi');
  var txid = String(req.body.txid || '').trim().slice(0, 200);
  data.payments.update(p.id, { status: 'inceleniyor', txid: txid, bildirildiAt: new Date().toISOString() });
  data.payments.log(p.id, 'musteri_bildirdi', { txid: txid });
  res.redirect('/odeme-gecmisi');
});

app.get('/odeme-gecmisi', requireUser, function(req, res) {
  var s = session(req, res);
  var list = data.payments.byUser(s.userId).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var statusMap = {
    'bekliyor':    { t: 'Bekleniyor',  c: '#f59e0b' },
    'inceleniyor': { t: 'Inceleniyor', c: '#3b82f6' },
    'onaylandi':   { t: 'Onaylandi',   c: '#10b981' },
    'reddedildi':  { t: 'Reddedildi',  c: '#ef4444' }
  };
  var rows = '';
  if (!list.length) rows = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#888">Kayit yok.</td></tr>';
  list.forEach(function(p) {
    var plan = PLANS[p.plan] || { name: p.plan };
    var st = statusMap[p.status] || { t: p.status, c: '#888' };
    rows += '<tr style="border-bottom:1px solid #eee">';
    rows += '<td style="padding:12px;font-family:monospace;font-size:12px">' + esc(p.orderId || p.id) + '</td>';
    rows += '<td style="padding:12px">' + esc(plan.name) + '</td>';
    rows += '<td style="padding:12px;font-weight:700">$' + (p.amount || 0) + '</td>';
    rows += '<td style="padding:12px"><span style="background:' + st.c + ';color:#fff;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:800">' + st.t + '</span></td>';
    rows += '<td style="padding:12px;font-size:12px;color:#888">' + new Date(p.createdAt).toLocaleString('tr-TR') + '</td></tr>';
  });
  var content = '<h1 class="page">Odeme Gecmisim</h1>';
  content += '<div class="panel" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px">';
  content += '<thead><tr style="background:#f8f8f8;text-align:left"><th style="padding:12px">Siparis</th><th style="padding:12px">Plan</th><th style="padding:12px">Tutar</th><th style="padding:12px">Durum</th><th style="padding:12px">Tarih</th></tr></thead>';
  content += '<tbody>' + rows + '</tbody></table></div>';
  content += '<div style="margin-top:16px"><a href="/odeme" class="btn">Yeni Odeme</a></div>';
  res.send(layout({ title: 'Odeme Gecmisi', content: content, s: s }));
});

function requireAdmin(req, res, next) {
  var s = session(req, res);
  if (!s.userId) return res.redirect('/giris');
  var u = data.users.byId(s.userId);
  if (!u || (u.role !== 'admin' && u.role !== 'moderator')) return res.status(403).send('Yetkisiz');
  next();
}

app.get('/admin/odemeler', requireAdmin, function(req, res) {
  var s = session(req, res);
  var all = data.payments.all ? data.payments.all() : [];
  var bekleyen = all.filter(function(p){ return p.status === 'inceleniyor' || p.status === 'bekliyor'; });
  var gecmis = all.filter(function(p){ return p.status === 'onaylandi' || p.status === 'reddedildi'; });

  function rows(list, actions) {
    if (!list.length) return '<tr><td colspan="6" style="padding:20px;text-align:center;color:#888">Kayit yok</td></tr>';
    var h = '';
    list.forEach(function(p) {
      var u = data.users.byId(p.userId) || { username: '#' + p.userId };
      var plan = PLANS[p.plan] || { name: p.plan };
      h += '<tr style="border-bottom:1px solid #eee">';
      h += '<td style="padding:10px;font-family:monospace;font-size:12px">' + esc(p.orderId || p.id) + '</td>';
      h += '<td style="padding:10px"><b>' + esc(u.username) + '</b></td>';
      h += '<td style="padding:10px">' + esc(plan.name) + '</td>';
      h += '<td style="padding:10px;font-weight:700">$' + (p.amount || 0) + '</td>';
      h += '<td style="padding:10px;font-size:11px;color:#888">' + esc(p.txid || '-') + '</td>';
      if (actions) {
        h += '<td style="padding:10px;white-space:nowrap">';
        h += '<form method="post" action="/admin/odeme-onayla/' + p.id + '" style="display:inline"><button style="background:#10b981;color:#fff;border:0;padding:7px 14px;border-radius:6px;font-weight:700;cursor:pointer;margin-right:6px">ONAYLA</button></form>';
        h += '<form method="post" action="/admin/odeme-reddet/' + p.id + '" style="display:inline"><button style="background:#ef4444;color:#fff;border:0;padding:7px 14px;border-radius:6px;font-weight:700;cursor:pointer">REDDET</button></form>';
        h += '</td>';
      } else {
        h += '<td style="padding:10px">' + (p.status === 'onaylandi' ? '<span style="color:#10b981;font-weight:700">Onaylandi</span>' : '<span style="color:#ef4444;font-weight:700">Reddedildi</span>') + '</td>';
      }
      h += '</tr>';
    });
    return h;
  }

  var head = '<thead><tr style="background:#f8f8f8;text-align:left"><th style="padding:10px">Siparis</th><th style="padding:10px">Kullanici</th><th style="padding:10px">Plan</th><th style="padding:10px">Tutar</th><th style="padding:10px">TXID</th><th style="padding:10px">Islem</th></tr></thead>';
  var content = '<h1 class="page">Odeme Yonetimi</h1>';
  content += '<div class="panel" style="margin-bottom:20px"><h2 style="font-size:16px;margin-bottom:12px">Bekleyen (' + bekleyen.length + ')</h2><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' + head + '<tbody>' + rows(bekleyen, true) + '</tbody></table></div></div>';
  content += '<div class="panel"><h2 style="font-size:16px;margin-bottom:12px">Gecmis</h2><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' + head + '<tbody>' + rows(gecmis, false) + '</tbody></table></div></div>';
  res.send(layout({ title: 'Odeme Yonetimi', content: content, s: s }));
});

app.post('/admin/odeme-onayla/:id', requireAdmin, function(req, res) {
  var p = data.payments.byId(req.params.id);
  if (!p) return res.redirect('/admin/odemeler');
  var plan = PLANS[p.plan];
  if (!plan) return res.redirect('/admin/odemeler');
  data.payments.update(p.id, { status: 'onaylandi', onaylandiAt: new Date().toISOString(), onaylayan: session(req, res).userId });
  data.payments.log(p.id, 'admin_onayladi', {});
  data.economy.grantVip(p.userId, plan.days);
  if (data.notifications && data.notifications.create) data.notifications.create(p.userId, 'VIP aktif', plan.name + ' aktif edildi.');
  res.redirect('/admin/odemeler');
});

app.post('/admin/odeme-reddet/:id', requireAdmin, function(req, res) {
  var p = data.payments.byId(req.params.id);
  if (!p) return res.redirect('/admin/odemeler');
  data.payments.update(p.id, { status: 'reddedildi', reddedildiAt: new Date().toISOString(), reddeden: session(req, res).userId });
  data.payments.log(p.id, 'admin_reddetti', {});
  if (data.notifications && data.notifications.create) data.notifications.create(p.userId, 'Odeme reddedildi', 'Odeme dogrulanamadi.');
  res.redirect('/admin/odemeler');
});

};
