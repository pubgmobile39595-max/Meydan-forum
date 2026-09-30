const settings = require('./settings');
const st = settings.load();

module.exports = {
  PORT: process.env.PORT || 8083,
  ADMIN_PASS: st.adminPassword,
  SITE_NAME: st.siteName,
  SITE_TAGLINE: st.siteTagline,
  TELEGRAM: st.telegram,
  TELEGRAM_URL: st.telegramUrl,
  EMAIL: st.email,
  DEFAULT_CATEGORIES: [
    { id: 1, slug: 'teknoloji', name: 'Teknoloji', emoji: 'PC', desc: 'Yazilim, donanim' },
    { id: 2, slug: 'oyun', name: 'Oyun', emoji: 'Game', desc: 'PC, konsol, mobil' },
    { id: 3, slug: 'sinema', name: 'Sinema', emoji: 'Film', desc: 'Film, dizi' },
    { id: 4, slug: 'spor', name: 'Spor', emoji: 'Spor', desc: 'Futbol, basket' },
    { id: 5, slug: 'bilim', name: 'Bilim', emoji: 'Bilim', desc: 'Fizik, uzay' },
    { id: 6, slug: 'sanat', name: 'Sanat', emoji: 'Sanat', desc: 'Muzik, kitap' },
    { id: 7, slug: 'gundem', name: 'Gundem', emoji: 'Haber', desc: 'Haberler' },
    { id: 8, slug: 'sorular', name: 'Sorular', emoji: 'Soru', desc: 'Soru-cevap' }
  ]
};
