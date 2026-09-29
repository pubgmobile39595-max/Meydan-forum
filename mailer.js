const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, 'mails.log');

function send(to, subject, body) {
  var ts = new Date().toISOString();
  var line = '[' + ts + '] To: ' + to + ' | Konu: ' + subject + '\n' + body + '\n---\n';
  try { fs.appendFileSync(LOG, line); } catch (e) {}
  console.log('[MAIL] ' + to + ' -> ' + subject);
}

function notify(user, subject, body) {
  if (!user || !user.email) return;
  send(user.email, subject, body);
}

function welcome(user) {
  notify(user, 'Meydan\'a Hos Geldiniz!', 'Merhaba ' + user.username + ',\n\nMeydan topluluguna katildiginiz icin tesekkurler!');
}

function newReply(user, topic, fromUser) {
  notify(user, 'Yeni cevap: ' + topic.title, 'Merhaba ' + user.username + ',\n\n' + fromUser.username + ' konunuza cevap yazdi: ' + topic.title);
}

function newFollower(user, fromUser) {
  notify(user, fromUser.username + ' seni takip etmeye basladi', 'Merhaba ' + user.username + ',\n\n' + fromUser.username + ' seni takip etmeye basladi.');
}

module.exports = { send: send, welcome: welcome, newReply: newReply, newFollower: newFollower };
