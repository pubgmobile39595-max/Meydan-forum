const fs = require('fs');
let t = fs.readFileSync('data.js', 'utf8');
if (t.indexOf('processMentions') > -1) { console.log('var'); process.exit(0); }

let h = '';
h += 'function processMentions(text, fromUserId, link) {\n';
h += '  var mentions = String(text).match(/@([a-zA-Z0-9_]+)/g) || [];\n';
h += '  var seen = {};\n';
h += '  mentions.forEach(function(m) {\n';
h += '    var name = m.substring(1).toLowerCase();\n';
h += '    if (seen[name]) return;\n';
h += '    seen[name] = 1;\n';
h += '    var u = findUserByName(name);\n';
h += '    if (u && u.id !== fromUserId) {\n';
h += '      var from = findUser(fromUserId);\n';
h += '      addNotification(u.id, (from ? from.username : "Biri") + " senden bahsetti", link);\n';
h += '    }\n';
h += '  });\n';
h += '  save();\n';
h += '}\n\n';
t = t.replace('module.exports = {', h + 'module.exports = {');
t = t.replace(
  '  polls: {',
  '  processMentions: processMentions,\n\n  polls: {'
);
fs.writeFileSync('data.js', t);
console.log('OK');
