const fs = require('fs');
let v = fs.readFileSync('views.js', 'utf8');

if (v.indexOf("require('./settings')") === -1) {
  v = "const settings = require('./settings');\n" + v;
}

v = v.replace(/content="Meydan">/g, "content=\"' + esc(settings.get('siteName')) + '\">");
v = v.replace(/h \+= '<title>' \+ esc\(o\.title\) \+ ' - Meydan<\/title>';/g, "h += '<title>' + esc(o.title) + ' - ' + esc(settings.get('siteName')) + '</title>';");
v = v.replace(/o\.title \+ ' - Meydan forum'/g, "o.title + ' - ' + settings.get('siteName') + ' forum'");
v = v.replace(/content="Meydan">/g, "content=\"' + esc(settings.get('siteName')) + '\">");
v = v.replace(/Meydan - Turkiye Tartisma Platformu<\/div><\/footer>/g, "' + esc(settings.get('footerText')) + '</div></footer>");

fs.writeFileSync('views.js', v);
console.log('VIEWS PATCH OK');
