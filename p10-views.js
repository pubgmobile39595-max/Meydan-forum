const fs = require('fs');
let t = fs.readFileSync('views.js', 'utf8');
if (t.indexOf('notifyPermission') > -1) { console.log('var'); process.exit(0); }

// Navbar'a bildirim zili (unread varsa)
const eski = "if (user) h += '<a class=\"act\" href=\"/bildirimler\">Bildirim'";
const yeni = "if (user) h += '<a class=\"act\" href=\"/ayarlar-bildirim\">Bil.Ayar</a>';\n  if (user) h += '<a class=\"act\" href=\"/bildirimler\">Bildirim'";
t = t.replace(eski, yeni);

// Script'e bildirim izni iste
const eski2 = "'<script>if(\"serviceWorker\" in navigator)";
const yeni2 = "'<script>function requestNotify(){if(!(\"Notification\" in window))return;if(Notification.permission===\"granted\")return;Notification.requestPermission();}' +\n" +
  "  'function showToast(msg){var d=document.createElement(\"div\");d.textContent=msg;d.style.cssText=\"position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2)\";document.body.appendChild(d);setTimeout(function(){d.remove();},2500);}' +\n" +
  "  'if(\"serviceWorker\" in navigator)";

t = t.replace(eski2, yeni2);
fs.writeFileSync('views.js', t);
console.log('OK');
