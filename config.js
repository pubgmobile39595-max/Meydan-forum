module.exports = {
  PORT: process.env.PORT || 8083,
  ADMIN_PASS: 'meydan2024',
  SITE_NAME: 'Meydan',
  SITE_TAGLINE: 'Turkiye Tartisma Platformu',
  TELEGRAM: '@Cipherteam394',
  TELEGRAM_URL: 'https://t.me/Cipherteam394',
  EMAIL: 'globalticaret42@gmail.com',
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
