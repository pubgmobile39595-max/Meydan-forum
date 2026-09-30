const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'settings.json');

const DEFAULTS = {
  siteName: 'Meydan',
  siteTagline: 'Turkiye Tartisma Platformu',
  siteDescription: 'Meydan - Turkiye Tartisma Platformu',
  logoEmoji: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#6d28d9',
  adminPassword: 'Guvenli2025',
  telegram: '@Cipherteam394',
  telegramUrl: 'https://t.me/Cipherteam394',
  email: 'globalticaret42@gmail.com',
  footerText: 'Meydan - Turkiye Tartisma Platformu',
  maintenanceMode: false,
  registrationOpen: true,
  topicsOpen: true,
  commentsOpen: true,
  welcomeMessage: '',
  analytics: ''
};

var cache = null;

function load() {
  if (cache) return cache;
  try {
    if (fs.existsSync(FILE)) {
      var d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      cache = Object.assign({}, DEFAULTS, d);
    } else {
      cache = Object.assign({}, DEFAULTS);
      fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
    }
  } catch (e) { cache = Object.assign({}, DEFAULTS); }
  return cache;
}

function save(s) {
  cache = Object.assign({}, DEFAULTS, s);
  fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
}

function get(key) { var s = load(); return key ? s[key] : s; }

function update(patch) {
  var s = load();
  Object.keys(patch).forEach(function(k) { s[k] = patch[k]; });
  save(s); return s;
}

module.exports = { load, save, get, update, DEFAULTS };
