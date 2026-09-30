const express = require('express');
const crypto = require('crypto');
const path = require('path');
const data = require('./data');
const views = require('./views');
const config = require('./config');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  var cookies = {};
  (req.headers.cookie || '').split(';').forEach(function(p) {
    var i = p.indexOf('=');
    if (i > -1) cookies[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  req.cookies = cookies;
  next();
});

var sessions = new Map();
function session(req, res) {
  var sid = req.cookies.sid;
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', 'sid=' + sid + '; Path=/; HttpOnly');
    sessions.set(sid, { userId: null, admin: false });
  }
  var sess = sessions.get(sid);
  sess.tema = req.cookies.tema === 'dark' ? 'dark' : 'light';
  return sess;
}
function requireUser(req, res, next) {
  var s = session(req, res);
  if (!s.userId) return res.redirect('/giris');
  next();
}
function requireAdmin(req, res, next) {
  var s = session(req, res);
  if (!s.admin) return res.redirect('/admin');
  next();
}

// Analytics middleware
app.use(function(req, res, next) {
  if (req.method === 'GET' && req.path.indexOf('.') === -1) {
    var sid = (req.headers.cookie || '').match(/sid=([^;]+)/);
    var uid = null;
    if (sid && sessions.has(sid[1])) uid = sessions.get(sid[1]).userId;
    try { data.analytics.logPage(req.path, uid); if (uid) data.analytics.markOnline(uid); } catch (e) {}
  }
  next();
});

// PWA + SEO
app.get('/manifest.json', function(req, res) { res.sendFile(path.join(__dirname, 'manifest.json')); });
app.get('/service-worker.js', function(req, res) { res.setHeader('Content-Type', 'application/javascript'); res.sendFile(path.join(__dirname, 'service-worker.js')); });

// SEO: robots.txt
app.get('/robots.txt', function(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  var txt = 'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /admin\n' +
    'Disallow: /mod\n' +
    'Disallow: /mesajlar\n' +
    'Disallow: /mesaj/\n' +
    'Disallow: /bildirimler\n' +
    'Disallow: /ayarlar\n' +
    'Disallow: /sifre-degistir\n' +
    'Disallow: /kaydedilenler\n' +
    'Disallow: /engellenenler\n' +
    'Sitemap: http://127.0.0.1:8083/sitemap.xml\n';
  res.send(txt);
});

// SEO: sitemap.xml
app.get('/sitemap.xml', function(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  var base = 'http://127.0.0.1:8083';
  var urls = [
    { loc: '/', p: '1.0', f: 'hourly' },
    { loc: '/trend', p: '0.9', f: 'hourly' },
    { loc: '/yeni', p: '0.9', f: 'hourly' },
    { loc: '/etiketler', p: '0.8', f: 'daily' },
    { loc: '/liderler', p: '0.7', f: 'daily' },
    { loc: '/istatistikler', p: '0.6', f: 'daily' },
    { loc: '/gruplar', p: '0.7', f: 'daily' },
    { loc: '/rozetler', p: '0.6', f: 'weekly' },
    { loc: '/hakkimizda', p: '0.5', f: 'monthly' },
    { loc: '/kurallar', p: '0.5', f: 'monthly' },
    { loc: '/gizlilik', p: '0.4', f: 'monthly' }
  ];
  data.cats.all().forEach(function(c) { urls.push({ loc: '/kategori/' + c.slug, p: '0.7', f: 'daily' }); });
  data.topics.all().forEach(function(t) { urls.push({ loc: '/konu/' + t.id + '/' + t.slug, p: '0.8', f: 'weekly' }); });
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function(u) {
    xml += '  <url>\n    <loc>' + base + u.loc + '</loc>\n';
    xml += '    <changefreq>' + u.f + '</changefreq>\n';
    xml += '    <priority>' + u.p + '</priority>\n  </url>\n';
  });
  xml += '</urlset>';
  res.send(xml);
});

// Rotları yükle
require('./routes-auth')(app, session, requireUser);
require('./routes-forum')(app, session, requireUser);
require('./routes-admin')(app, session, requireAdmin, config);
require('./routes-social')(app, session, requireUser);
require('./routes-pages')(app, session);
require('./routes-groups')(app, session, requireUser);
require('./routes-mod')(app, session, requireUser);
require('./routes-economy')(app, session, requireUser);
require('./routes-payment')(app, session, requireUser);

// Tema değiştir
app.post('/tema', function(req, res) {
  var s = session(req, res);
  var tema = req.body.dark === '1' ? 'dark' : 'light';
  res.setHeader('Set-Cookie', 'tema=' + tema + '; Path=/; Max-Age=31536000');
  res.redirect(req.get('Referer') || '/');
});

// 404
app.use(function(req, res) {
  var s = session(req, res);
  res.status(404).send(views.layout({
    title: '404',
    content: '<div style="text-align:center;padding:60px"><h2>Sayfa bulunamadi</h2><a class="btn" href="/" style="margin-top:14px;display:inline-block">Ana Sayfa</a></div>',
    s: s
  }));
});

app.listen(config.PORT, function() {
  console.log('');
  console.log('  Meydan v2 calisiyor!');
  console.log('  http://127.0.0.1:' + config.PORT);
  console.log('  Admin: http://127.0.0.1:' + config.PORT + '/admin  (sifre: ' + config.ADMIN_PASS + ')');
  console.log('');
});
require('./routes-settings')(app, session);
