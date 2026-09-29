const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const DIR = __dirname;

function readJSON(f, fb) {
  try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fb; }
  catch (e) { return fb; }
}
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

let users = readJSON(path.join(DIR, 'u.json'), []);
let topics = readJSON(path.join(DIR, 't.json'), []);
let posts = readJSON(path.join(DIR, 'p.json'), []);
let votes = readJSON(path.join(DIR, 'v.json'), []);
let notifications = readJSON(path.join(DIR, 'n.json'), []);
let reactions = readJSON(path.join(DIR, 'r.json'), []);
let follows = readJSON(path.join(DIR, 'f.json'), []);
let bans = readJSON(path.join(DIR, 'ban.json'), []);
let polls = readJSON(path.join(DIR, 'poll.json'), []);
let groups = readJSON(path.join(DIR, 'gr.json'), []);
let moderators = readJSON(path.join(DIR, 'mod.json'), []);
let viewLog = readJSON(path.join(DIR, 'vl.json'), []);
let payments = readJSON(path.join(DIR, 'payments.json'), []);
let paymentLogs = readJSON(path.join(DIR, 'payment-logs.json'), []);
let pageViews = readJSON(path.join(DIR, 'pv.json'), []);
let onlineUsers = readJSON(path.join(DIR, 'on.json'), []);
let bannedWords = readJSON(path.join(DIR, 'bw.json'), []);
let pendingTopics = readJSON(path.join(DIR, 'pt.json'), []);
let floodLog = readJSON(path.join(DIR, 'fl.json'), []);
let groupMembers = readJSON(path.join(DIR, 'gm.json'), []);
let reports = readJSON(path.join(DIR, 'rep.json'), []);
let adminLogs = readJSON(path.join(DIR, 'log.json'), []);
let messages = readJSON(path.join(DIR, 'm.json'), []);
let blocks = readJSON(path.join(DIR, 'bl.json'), []);
let bookmarks = readJSON(path.join(DIR, 'b.json'), []);
let cats = readJSON(path.join(DIR, 'c.json'), []);
if (!cats.length) {
  cats = config.DEFAULT_CATEGORIES;
  writeJSON(path.join(DIR, 'c.json'), cats);
}

function save() {
  writeJSON(path.join(DIR, 'u.json'), users);
  writeJSON(path.join(DIR, 't.json'), topics);
  writeJSON(path.join(DIR, 'p.json'), posts);
  writeJSON(path.join(DIR, 'v.json'), votes);
  writeJSON(path.join(DIR, 'n.json'), notifications);
  writeJSON(path.join(DIR, 'r.json'), reactions);
  writeJSON(path.join(DIR, 'b.json'), bookmarks);
  writeJSON(path.join(DIR, 'f.json'), follows);
  writeJSON(path.join(DIR, 'm.json'), messages);
  writeJSON(path.join(DIR, 'bl.json'), blocks);
  writeJSON(path.join(DIR, 'ban.json'), bans);
  writeJSON(path.join(DIR, 'rep.json'), reports);
  writeJSON(path.join(DIR, 'log.json'), adminLogs);
  writeJSON(path.join(DIR, 'poll.json'), polls);
  writeJSON(path.join(DIR, 'gr.json'), groups);
  writeJSON(path.join(DIR, 'gm.json'), groupMembers);
  writeJSON(path.join(DIR, 'mod.json'), moderators);
  writeJSON(path.join(DIR, 'bw.json'), bannedWords);
  writeJSON(path.join(DIR, 'pt.json'), pendingTopics);
  writeJSON(path.join(DIR, 'fl.json'), floodLog);
  writeJSON(path.join(DIR, 'vl.json'), viewLog);
  writeJSON(path.join(DIR, 'pv.json'), pageViews);
  writeJSON(path.join(DIR, 'on.json'), onlineUsers);
}
function hash(pw) {
  return crypto.createHash('sha256').update('meydan$' + pw).digest('hex');
}
function nextId(arr) {
  return arr.reduce(function(m, x) { return Math.max(m, x.id); }, 0) + 1;
}
function findUser(id) { return users.find(function(u) { return u.id === id; }); }
function findUserByName(n) {
  if (!n) return null;
  return users.find(function(u) { return u.username.toLowerCase() === String(n).toLowerCase(); });
}
function findUserByEmail(e) {
  if (!e) return null;
  return users.find(function(u) { return u.email.toLowerCase() === String(e).toLowerCase(); });
}
function findTopic(id) { return topics.find(function(t) { return t.id === id; }); }
function findCat(id) { return cats.find(function(c) { return c.id === id; }); }
function findCatBySlug(s) { return cats.find(function(c) { return c.slug === s; }); }
function slugify(s) {
  return String(s).toLowerCase()
    .replace(/i/g, 'i').replace(/s/g, 's').replace(/g/g, 'g')
    .replace(/u/g, 'u').replace(/o/g, 'o').replace(/c/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60)
    || 'k-' + Date.now();
}
function voteOf(uid, type, id) {
  var v = votes.find(function(x) { return x.userId === uid && x.type === type && x.id === id; });
  return v ? v.value : 0;
}
function voteCount(type, id) {
  return votes.filter(function(v) { return v.type === type && v.id === id; })
    .reduce(function(t, v) { return t + v.value; }, 0);
}
function addNotification(userId, text, link) {
  notifications.push({
    id: nextId(notifications),
    userId: userId,
    text: text,
    link: link || '/',
    read: false,
    createdAt: new Date().toISOString()
  });
}
function unreadCount(userId) {
  return notifications.filter(function(n) { return n.userId === userId && !n.read; }).length;
}
function hasReacted(uid, pid, emoji) {
  return reactions.some(function(r) { return r.userId === uid && r.postId === pid && r.emoji === emoji; });
}
function reactionsOf(pid) {
  var map = {};
  reactions.filter(function(r) { return r.postId === pid; }).forEach(function(r) {
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  });
  return map;
}
function toggleReaction(uid, pid, emoji) {
  var ex = reactions.find(function(r) { return r.userId === uid && r.postId === pid && r.emoji === emoji; });
  if (ex) reactions = reactions.filter(function(r) { return r !== ex; });
  else reactions.push({ userId: uid, postId: pid, emoji: emoji });
  save();
}
function isBookmarked(uid, tid) {
  return bookmarks.some(function(b) { return b.userId === uid && b.topicId === tid; });
}
function bookmarkToggle(uid, tid) {
  var ex = bookmarks.find(function(b) { return b.userId === uid && b.topicId === tid; });
  if (ex) bookmarks = bookmarks.filter(function(b) { return b !== ex; });
  else bookmarks.push({ userId: uid, topicId: tid, createdAt: new Date().toISOString() });
  save();
}
function bookmarksOf(uid) {
  return bookmarks.filter(function(b) { return b.userId === uid; });
}

function isFollowing(uid, targetId) {
  return follows.some(function(f) { return f.followerId === uid && f.followingId === targetId; });
}
function toggleFollow(uid, targetId) {
  if (uid === targetId) return;
  var ex = follows.find(function(f) { return f.followerId === uid && f.followingId === targetId; });
  if (ex) follows = follows.filter(function(f) { return f !== ex; });
  else follows.push({ followerId: uid, followingId: targetId, createdAt: new Date().toISOString() });
  save();
}
function followersOf(uid) {
  return follows.filter(function(f) { return f.followingId === uid; });
}
function followingOf(uid) {
  return follows.filter(function(f) { return f.followerId === uid; });
}
function sendMessage(from, to, body) {
  messages.push({ id: nextId(messages), from: from, to: to, body: body, read: false, createdAt: new Date().toISOString() });
  save();
}
function conversationOf(uid, otherId) {
  return messages.filter(function(m) {
    return (m.from === uid && m.to === otherId) || (m.from === otherId && m.to === uid);
  }).sort(function(a, b) { return a.createdAt.localeCompare(b.createdAt); });
}
function conversationsOf(uid) {
  var map = {};
  messages.forEach(function(m) {
    if (m.from === uid) { if (!map[m.to]) map[m.to] = { last: m, unread: 0 }; else if (m.createdAt > map[m.to].last.createdAt) map[m.to].last = m; }
    if (m.to === uid) { if (!map[m.from]) map[m.from] = { last: m, unread: 0 }; else if (m.createdAt > map[m.from].last.createdAt) map[m.from].last = m; if (!m.read) map[m.from].unread++; }
  });
  return map;
}
function markConvRead(uid, otherId) {
  messages.forEach(function(m) { if (m.from === otherId && m.to === uid) m.read = true; });
  save();
}
function isBlocked(uid, targetId) {
  return blocks.some(function(b) { return b.userId === uid && b.blockedId === targetId; });
}
function toggleBlock(uid, targetId) {
  var ex = blocks.find(function(b) { return b.userId === uid && b.blockedId === targetId; });
  if (ex) blocks = blocks.filter(function(b) { return b !== ex; });
  else blocks.push({ userId: uid, blockedId: targetId, createdAt: new Date().toISOString() });
  save();
}
function blocksOf(uid) {
  return blocks.filter(function(b) { return b.userId === uid; });
}
function topUsers(limit) {
  var arr = users.slice();
  arr.forEach(function(u) {
    u._topics = topics.filter(function(t) { return t.userId === u.id; }).length;
    u._posts = posts.filter(function(p) { return p.userId === u.id; }).length;
    u._followers = followersOf(u.id).length;
    u._score = (u.reputation || 0) + u._topics * 5 + u._posts * 2 + u._followers * 3;
  });
  return arr.sort(function(a, b) { return b._score - a._score; }).slice(0, limit || 20);
}

function isBanned(uid) {
  var b = bans.find(function(x) { return x.userId === uid; });
  if (!b) return false;
  if (b.until && new Date(b.until) < new Date()) { bans = bans.filter(function(x) { return x !== b; }); save(); return false; }
  return true;
}
function banInfo(uid) {
  return bans.find(function(x) { return x.userId === uid; });
}
function banUser(uid, reason, days, adminId) {
  bans = bans.filter(function(x) { return x.userId !== uid; });
  var until = null;
  if (days > 0) { var d = new Date(); d.setDate(d.getDate() + days); until = d.toISOString(); }
  bans.push({ userId: uid, reason: reason, until: until, bannedAt: new Date().toISOString(), bannedBy: adminId });
  save();
}
function unbanUser(uid) {
  bans = bans.filter(function(x) { return x.userId !== uid; });
  save();
}
function addReport(reporterId, type, targetId, reason) {
  reports.push({ id: nextId(reports), reporterId: reporterId, type: type, targetId: targetId, reason: reason, status: "bekliyor", createdAt: new Date().toISOString() });
  save();
}
function logAdmin(adminId, action, detail) {
  adminLogs.unshift({ adminId: adminId, action: action, detail: detail, createdAt: new Date().toISOString() });
  if (adminLogs.length > 500) adminLogs = adminLogs.slice(0, 500);
  save();
}

function createPoll(topicId, question, options) {
  var p = { id: nextId(polls), topicId: topicId, question: question, options: options.map(function(o) { return { text: o, votes: [] }; }), createdAt: new Date().toISOString() };
  polls.push(p); save(); return p;
}
function pollOf(topicId) {
  return polls.find(function(p) { return p.topicId === topicId; });
}
function votePoll(pollId, uid, optionIndex) {
  var p = polls.find(function(x) { return x.id === pollId; });
  if (!p) return;
  p.options.forEach(function(o) { o.votes = o.votes.filter(function(v) { return v !== uid; }); });
  if (p.options[optionIndex]) p.options[optionIndex].votes.push(uid);
  save();
}

var BADGES = [
  { id: "ilk-konu", name: "Ilk Konu", icon: "1", desc: "Ilk konunu actin" },
  { id: "ilk-cevap", name: "Ilk Cevap", icon: "C", desc: "Ilk cevabini yazdin" },
  { id: "10-konu", name: "Konu Ustasi", icon: "10", desc: "10 konu actin" },
  { id: "50-cevap", name: "Yorumcu", icon: "50", desc: "50 cevap yazdin" },
  { id: "100-itibar", name: "Saygin", icon: "I", desc: "100 itibar puani kazandin" },
  { id: "1000-itibar", name: "Efsane", icon: "E", desc: "1000 itibar puani kazandin" },
  { id: "populer", name: "Populer", icon: "P", desc: "Konun 50 oy aldi" },
  { id: "takipci-10", name: "Lider", icon: "L", desc: "10 takipcin oldu" },
  { id: "sadik", name: "Sadik", icon: "S", desc: "30 gun once katildin" },
  { id: "gece-kusu", name: "Gece Kusuu", icon: "G", desc: "Gece 02:00-05:00 arasi aktif" }
];

function hasBadge(uid, badgeId) {
  var u = findUser(uid);
  return u && u.badges && u.badges.indexOf(badgeId) > -1;
}

function awardBadge(uid, badgeId) {
  var u = findUser(uid);
  if (!u) return false;
  if (!u.badges) u.badges = [];
  if (u.badges.indexOf(badgeId) > -1) return false;
  u.badges.push(badgeId);
  var b = BADGES.find(function(x) { return x.id === badgeId; });
  if (b) addNotification(uid, "Yeni rozet kazandin: " + b.name, "/u/" + u.username);
  save();
  return true;
}

function checkBadges(uid) {
  var u = findUser(uid);
  if (!u) return;
  var tCount = topics.filter(function(t) { return t.userId === uid; }).length;
  var pCount = posts.filter(function(p) { return p.userId === uid; }).length;
  var fCount = follows.filter(function(f) { return f.followingId === uid; }).length;
  var maxVotes = 0;
  topics.filter(function(t) { return t.userId === uid; }).forEach(function(t) {
    var v = votes.filter(function(x) { return x.type === "topic" && x.id === t.id; }).reduce(function(sum, x) { return sum + x.value; }, 0);
    if (v > maxVotes) maxVotes = v;
  });
  if (tCount >= 1) awardBadge(uid, "ilk-konu");
  if (pCount >= 1) awardBadge(uid, "ilk-cevap");
  if (tCount >= 10) awardBadge(uid, "10-konu");
  if (pCount >= 50) awardBadge(uid, "50-cevap");
  if ((u.reputation || 0) >= 100) awardBadge(uid, "100-itibar");
  if ((u.reputation || 0) >= 1000) awardBadge(uid, "1000-itibar");
  if (maxVotes >= 50) awardBadge(uid, "populer");
  if (fCount >= 10) awardBadge(uid, "takipci-10");
  var days = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000);
  if (days >= 30) awardBadge(uid, "sadik");
  var hour = new Date().getHours();
  if (hour >= 2 && hour < 5) awardBadge(uid, "gece-kusu");
}

function levelOf(uid) {
  var u = findUser(uid);
  if (!u) return { name: "Misafir", level: 0, min: 0, next: 50, color: "#888" };
  var tCount = topics.filter(function(t) { return t.userId === uid; }).length;
  var pCount = posts.filter(function(p) { return p.userId === uid; }).length;
  var score = (u.reputation || 0) + tCount * 5 + pCount * 2;
  var levels = [
    { name: "Yeni Uye", min: 0, color: "#84cc16" },
    { name: "Aktif Uye", min: 50, color: "#3b82f6" },
    { name: "Kidemli", min: 200, color: "#8b5cf6" },
    { name: "Uzman", min: 500, color: "#f59e0b" },
    { name: "Efsane", min: 1500, color: "#dc2626" }
  ];
  var cur = levels[0], next = null;
  for (var i = 0; i < levels.length; i++) {
    if (score >= levels[i].min) { cur = levels[i]; next = levels[i + 1] || null; }
  }
  return { name: cur.name, level: score, min: cur.min, next: next ? next.min : null, nextName: next ? next.name : null, color: cur.color };
}

function findGroup(id) { return groups.find(function(g) { return g.id === id; }); }
function findGroupBySlug(s) { return groups.find(function(g) { return g.slug === s; }); }
function createGroup(name, desc, emoji, isPrivate, ownerId) {
  var g = { id: nextId(groups), slug: slugify(name), name: name, desc: desc, emoji: emoji || "Grup", isPrivate: !!isPrivate, ownerId: ownerId, createdAt: new Date().toISOString() };
  groups.push(g);
  groupMembers.push({ groupId: g.id, userId: ownerId, role: "owner", joinedAt: new Date().toISOString() });
  save(); return g;
}
function joinGroup(gid, uid) {
  if (isMember(gid, uid)) return false;
  groupMembers.push({ groupId: gid, userId: uid, role: "member", joinedAt: new Date().toISOString() });
  save(); return true;
}
function leaveGroup(gid, uid) {
  groupMembers = groupMembers.filter(function(m) { return !(m.groupId === gid && m.userId === uid); });
  save();
}
function isMember(gid, uid) {
  return groupMembers.some(function(m) { return m.groupId === gid && m.userId === uid; });
}
function membersOf(gid) { return groupMembers.filter(function(m) { return m.groupId === gid; }); }
function isOwner(gid, uid) {
  var g = findGroup(gid);
  return g && g.ownerId === uid;
}
function removeMember(gid, uid) {
  groupMembers = groupMembers.filter(function(m) { return !(m.groupId === gid && m.userId === uid); });
  save();
}
function groupsOfUser(uid) {
  var ids = groupMembers.filter(function(m) { return m.userId === uid; }).map(function(m) { return m.groupId; });
  return groups.filter(function(g) { return ids.indexOf(g.id) > -1; });
}
function topicsOfGroup(gid) {
  return topics.filter(function(t) { return t.groupId === gid; }).sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
}

function processMentions(text, fromUserId, link) {
  var mentions = String(text).match(/@([a-zA-Z0-9_]+)/g) || [];
  var seen = {};
  mentions.forEach(function(m) {
    var name = m.substring(1).toLowerCase();
    if (seen[name]) return;
    seen[name] = 1;
    var u = findUserByName(name);
    if (u && u.id !== fromUserId) {
      var from = findUser(fromUserId);
      addNotification(u.id, (from ? from.username : "Biri") + " senden bahsetti", link);
    }
  });
  save();
}

function isMod(uid) {
  return moderators.some(function(m) { return m.userId === uid; });
}
function addMod(uid) {
  if (isMod(uid)) return false;
  moderators.push({ userId: uid, addedAt: new Date().toISOString() });
  save(); return true;
}
function removeMod(uid) {
  moderators = moderators.filter(function(m) { return m.userId !== uid; });
  save();
}
function modsList() {
  return moderators.map(function(m) { return findUser(m.userId); }).filter(function(u) { return u; });
}
function hasBannedWord(text) {
  if (!text) return null;
  var lc = String(text).toLowerCase();
  for (var i = 0; i < bannedWords.length; i++) {
    if (lc.indexOf(bannedWords[i].toLowerCase()) > -1) return bannedWords[i];
  }
  return null;
}
function addBannedWord(word) {
  word = String(word).trim().toLowerCase();
  if (!word || bannedWords.indexOf(word) > -1) return false;
  bannedWords.push(word);
  writeJSON(path.join(DIR, "bw.json"), bannedWords);
  return true;
}
function removeBannedWord(word) {
  bannedWords = bannedWords.filter(function(w) { return w !== word; });
  writeJSON(path.join(DIR, "bw.json"), bannedWords);
}
function checkFlood(uid, limitSec) {
  limitSec = limitSec || 30;
  var now = Date.now();
  var recent = floodLog.filter(function(f) { return f.userId === uid && now - f.at < limitSec * 1000; });
  return recent.length > 0;
}
function logFlood(uid) {
  floodLog.push({ userId: uid, at: Date.now() });
  var cutoff = Date.now() - 300000;
  floodLog = floodLog.filter(function(f) { return f.at > cutoff; });
  writeJSON(path.join(DIR, "fl.json"), floodLog);
}
function addPending(topicData, userId) {
  var p = { id: nextId(pendingTopics), data: topicData, userId: userId, createdAt: new Date().toISOString() };
  pendingTopics.push(p);
  writeJSON(path.join(DIR, "pt.json"), pendingTopics);
  return p;
}
function approvePending(id) {
  var p = pendingTopics.find(function(x) { return x.id === id; });
  if (!p) return null;
  pendingTopics = pendingTopics.filter(function(x) { return x.id !== id; });
  writeJSON(path.join(DIR, "pt.json"), pendingTopics);
  var t = topics ? null : null;
  var tt = { id: nextId(topics), title: p.data.title, slug: p.data.slug, body: p.data.body, categoryId: p.data.categoryId, userId: p.userId, tags: p.data.tags || [], prefix: p.data.prefix || "", image: p.data.image || "", views: 0, pinned: false, locked: false, createdAt: new Date().toISOString() };
  topics.push(tt);
  save();
  return tt;
}
function rejectPending(id) {
  pendingTopics = pendingTopics.filter(function(x) { return x.id !== id; });
  writeJSON(path.join(DIR, "pt.json"), pendingTopics);
}

function logView(topicId) {
  viewLog.push({ topicId: topicId, at: Date.now() });
  var cutoff = Date.now() - 7 * 86400000;
  viewLog = viewLog.filter(function(v) { return v.at > cutoff; });
  writeJSON(path.join(DIR, "vl.json"), viewLog);
}
function topicViews(topicId, hours) {
  hours = hours || 24;
  var since = Date.now() - hours * 3600000;
  return viewLog.filter(function(v) { return v.topicId === topicId && v.at > since; }).length;
}
function viewsByDay(topicId, days) {
  days = days || 7;
  var arr = [];
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    var next = new Date(d); next.setDate(next.getDate() + 1);
    var count = viewLog.filter(function(v) { return v.topicId === topicId && v.at >= d.getTime() && v.at < next.getTime(); }).length;
    arr.push({ label: d.getDate() + "/" + (d.getMonth() + 1), count: count });
  }
  return arr;
}

function logPageView(pagePath, uid) {
  pageViews.push({ path: pagePath, userId: uid || null, at: Date.now() });
  var cutoff = Date.now() - 7 * 86400000;
  pageViews = pageViews.filter(function(p) { return p.at > cutoff; });
  writeJSON(path.join(DIR, "pv.json"), pageViews);
}
function pageViewStats(hours) {
  hours = hours || 24;
  var since = Date.now() - hours * 3600000;
  return pageViews.filter(function(p) { return p.at > since; }).length;
}
function topPages(hours, limit) {
  hours = hours || 24; limit = limit || 10;
  var since = Date.now() - hours * 3600000;
  var map = {};
  pageViews.filter(function(p) { return p.at > since; }).forEach(function(p) {
    map[p.path] = (map[p.path] || 0) + 1;
  });
  return Object.keys(map).map(function(k) { return { path: k, count: map[k] }; }).sort(function(a, b) { return b.count - a.count; }).slice(0, limit);
}
function markOnline(uid) {
  if (!uid) return;
  var cutoff = Date.now() - 5 * 60000;
  onlineUsers = onlineUsers.filter(function(o) { return o.userId !== uid && o.at > cutoff; });
  onlineUsers.push({ userId: uid, at: Date.now() });
  writeJSON(path.join(DIR, "on.json"), onlineUsers);
}
function onlineCount() {
  var cutoff = Date.now() - 5 * 60000;
  return onlineUsers.filter(function(o) { return o.at > cutoff; }).length;
}
function onlineList() {
  var cutoff = Date.now() - 5 * 60000;
  var seen = {};
  return onlineUsers.filter(function(o) { return o.at > cutoff; }).map(function(o) {
    if (seen[o.userId]) return null;
    seen[o.userId] = 1;
    return findUser(o.userId);
  }).filter(function(u) { return u; });
}
function trendingTopics(hours, limit) {
  hours = hours || 24; limit = limit || 10;
  var since = Date.now() - hours * 3600000;
  var map = {};
  viewLog.filter(function(v) { return v.at > since; }).forEach(function(v) {
    map[v.topicId] = (map[v.topicId] || 0) + 1;
  });
  return Object.keys(map).map(function(k) { return { topicId: +k, count: map[k], topic: findTopic(+k) }; }).filter(function(x) { return x.topic; }).sort(function(a, b) { return b.count - a.count; }).slice(0, limit);
}

var TITLES = [
  { id: "yeni", name: "Yeni Uye", cost: 0, color: "#84cc16" },
  { id: "merakli", name: "Merakli", cost: 100, color: "#3b82f6" },
  { id: "bilgili", name: "Bilgili", cost: 300, color: "#8b5cf6" },
  { id: "uzman", name: "Uzman", cost: 800, color: "#f59e0b" },
  { id: "efsane", name: "Efsane", cost: 2000, color: "#dc2626" },
  { id: "vip", name: "VIP Uye", cost: 0, color: "#f59e0b", vipOnly: true }
];

function getPoints(uid) {
  var u = findUser(uid);
  return u ? (u.points || 0) : 0;
}
function addPoints(uid, amt) {
  var u = findUser(uid);
  if (!u) return;
  u.points = (u.points || 0) + amt;
  save();
}
function spendPoints(uid, amt) {
  var u = findUser(uid);
  if (!u || (u.points || 0) < amt) return false;
  u.points -= amt;
  save();
  return true;
}
function isVip(uid) {
  var u = findUser(uid);
  if (!u || !u.vipUntil) return false;
  return new Date(u.vipUntil) > new Date();
}
function activateVip(uid, days) {
  var u = findUser(uid);
  if (!u) return;
  var d = new Date();
  if (u.vipUntil && new Date(u.vipUntil) > d) d = new Date(u.vipUntil);
  d.setDate(d.getDate() + days);
  u.vipUntil = d.toISOString();
  save();
}
function setTitle(uid, titleId) {
  var u = findUser(uid);
  if (!u) return false;
  var ti = TITLES.find(function(x) { return x.id === titleId; });
  if (!ti) return false;
  if (ti.vipOnly && !isVip(uid)) return false;
  if (ti.cost > 0) {
    if (u.titles && u.titles.indexOf(titleId) === -1) {
      if (!spendPoints(uid, ti.cost)) return false;
      u.titles = u.titles || [];
      u.titles.push(titleId);
    }
  }
  u.activeTitle = titleId;
  save();
  return true;
}
function getTitle(uid) {
  var u = findUser(uid);
  if (!u || !u.activeTitle) return null;
  return TITLES.find(function(x) { return x.id === u.activeTitle; });
}

function setAvatar(uid, url) {
  var u = findUser(uid);
  if (u) { u.avatar = String(url).substring(0, 500); save(); }
}
function getAvatar(uid) {
  var u = findUser(uid);
  return u && u.avatar ? u.avatar : null;
}

function createPayment(uid, plan, amount, currency) {
  var p = { id: "PAY" + Date.now(), userId: uid, plan: plan, amount: amount, currency: currency || "usd", status: "pending", payAddress: null, payAmount: null, payCurrency: null, createdAt: new Date().toISOString() };
  payments.push(p); save(); return p;
}
function findPayment(pid) { return payments.find(function(p) { return p.id === pid; }); }
function findPaymentByOrderId(oid) { return payments.find(function(p) { return p.orderId === oid; }); }
function updatePayment(pid, data) { var p = findPayment(pid); if (p) { Object.assign(p, data); save(); } return p; }
function addPaymentLog(pid, event, data) {
  paymentLogs.push({ paymentId: pid, event: event, data: data || {}, at: new Date().toISOString() });
  if (paymentLogs.length > 1000) paymentLogs = paymentLogs.slice(-1000);
  save();
}
function getPaymentLogs(pid) { return paymentLogs.filter(function(l) { return l.paymentId === pid; }); }
function getPaymentsByUser(uid) { return payments.filter(function(p) { return p.userId === uid; }).sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); }); }

module.exports = {
  config: config,
  hash: hash,
  slugify: slugify,
  save: save,
  nextId: nextId,

  users: {
    all: function() { return users; },
    byId: findUser,
    byName: findUserByName,
    byEmail: findUserByEmail,
    create: function(username, email, password) {
      var u = {
        id: nextId(users),
        username: username,
        email: email.toLowerCase(),
        password: hash(password),
        bio: '',
        location: '',
        website: '',
        avatar: '',
        reputation: 0,
        role: 'user',
        points: 0,
        titles: [],
        activeTitle: null,
        createdAt: new Date().toISOString()
      };
      users.push(u); save(); return u;
    },
    update: function(id, data) {
      var u = findUser(id);
      if (u) { Object.assign(u, data); save(); }
      return u;
    },
    changeRep: function(id, delta) {
      var u = findUser(id);
      if (u) { u.reputation = (u.reputation || 0) + delta; save(); }
    }
  },

  cats: {
    all: function() { return cats; },
    byId: findCat,
    bySlug: findCatBySlug,
    add: function(data) {
      data.id = nextId(cats);
      cats.push(data);
      writeJSON(path.join(DIR, 'c.json'), cats);
      return data;
    },
    remove: function(id) {
      cats = cats.filter(function(c) { return c.id !== id; });
      writeJSON(path.join(DIR, 'c.json'), cats);
    }
  },

  topics: {
    all: function() { return topics; },
    byId: findTopic,
    byCat: function(catId) { return topics.filter(function(t) { return t.categoryId === catId; }); },
    byUser: function(uid) { return topics.filter(function(t) { return t.userId === uid; }); },
    add: function(data) {
      var t = {
        id: nextId(topics),
        title: data.title,
        slug: data.slug || slugify(data.title),
        body: data.body,
        categoryId: data.categoryId,
        userId: data.userId,
        tags: data.tags || [],
        prefix: data.prefix || '',
        views: 0,
        pinned: false,
        locked: false,
        createdAt: new Date().toISOString()
      };
      topics.push(t); save(); return t;
    },
    update: function(id, data) {
      var t = findTopic(id);
      if (t) { Object.assign(t, data); save(); }
    },
    remove: function(id) {
      topics = topics.filter(function(t) { return t.id !== id; });
      posts = posts.filter(function(p) { return p.topicId !== id; });
      save();
    },
    incViews: function(id) {
      var t = findTopic(id);
      if (t) { t.views = (t.views || 0) + 1; save(); }
    }
  },

  posts: {
    all: function() { return posts; },
    byId: function(id) { return posts.find(function(p) { return p.id === id; }); },
    byTopic: function(tid) {
      return posts.filter(function(p) { return p.topicId === tid; })
        .sort(function(a, b) { return a.createdAt.localeCompare(b.createdAt); });
    },
    byUser: function(uid) { return posts.filter(function(p) { return p.userId === uid; }); },
    add: function(data) {
      var p = {
        id: nextId(posts),
        topicId: data.topicId,
        userId: data.userId,
        body: data.body,
        parentId: data.parentId || null,
        createdAt: new Date().toISOString()
      };
      posts.push(p); save(); return p;
    },
    remove: function(id) {
      posts = posts.filter(function(p) { return p.id !== id; });
      save();
    }
  },

  votes: {
    get: voteOf,
    count: voteCount,
    set: function(uid, type, id, value) {
      var ex = votes.find(function(x) { return x.userId === uid && x.type === type && x.id === id; });
      var oldValue = ex ? ex.value : 0;
      if (ex) {
        if (ex.value === value) votes = votes.filter(function(x) { return x !== ex; });
        else ex.value = value;
      } else {
        votes.push({ userId: uid, type: type, id: id, value: value });
      }
      var diff = (ex && ex.value === value) ? -oldValue : (value - oldValue);
      var target = type === 'topic' ? findTopic(id) : posts.find(function(p) { return p.id === id; });
      if (target) {
        var u = findUser(target.userId);
        if (u) { u.reputation = (u.reputation || 0) + (diff > 0 ? diff * 5 : diff * 2); }
      }
      save();
    }
  },

  groups: {
    all: function() { return groups; },
    byId: findGroup,
    bySlug: findGroupBySlug,
    create: createGroup,
    join: joinGroup,
    leave: leaveGroup,
    isMember: isMember,
    members: membersOf,
    isOwner: isOwner,
    removeMember: removeMember,
    ofUser: groupsOfUser,
    topics: topicsOfGroup,
    remove: function(id) {
      groups = groups.filter(function(g) { return g.id !== id; });
      groupMembers = groupMembers.filter(function(m) { return m.groupId !== id; });
      topics = topics.filter(function(t) { return t.groupId !== id; });
      save();
    }
  },

  processMentions: processMentions,

  TITLES: TITLES,
  avatar: {
    set: setAvatar,
    get: getAvatar
  },

  payments: {
    create: createPayment,
    byId: findPayment,
    byOrder: findPaymentByOrderId,
    update: updatePayment,
    log: addPaymentLog,
    logs: getPaymentLogs,
    byUser: getPaymentsByUser
  },

  economy: {
    points: getPoints,
    add: addPoints,
    spend: spendPoints,
    isVip: isVip,
    activateVip: activateVip,
    setTitle: setTitle,
    getTitle: getTitle
  },

  analytics: {
    logPage: logPageView,
    pageStats: pageViewStats,
    topPages: topPages,
    markOnline: markOnline,
    onlineCount: onlineCount,
    onlineList: onlineList,
    trending: trendingTopics
  },

  views: {
    log: logView,
    count: topicViews,
    byDay: viewsByDay
  },

  mods: {
    is: isMod,
    add: addMod,
    remove: removeMod,
    list: modsList
  },

  bannedWords: {
    all: function() { return bannedWords; },
    has: hasBannedWord,
    add: addBannedWord,
    remove: removeBannedWord
  },

  flood: {
    check: checkFlood,
    log: logFlood
  },

  pending: {
    all: function() { return pendingTopics; },
    add: addPending,
    approve: approvePending,
    reject: rejectPending,
    count: function() { return pendingTopics.length; }
  },

  polls: {
    all: function() { return polls; },
    create: createPoll,
    of: pollOf,
    vote: votePoll
  },

  BADGES: BADGES,
  badges: {
    all: function() { return BADGES; },
    has: hasBadge,
    award: awardBadge,
    check: checkBadges
  },

  level: function(uid) { return levelOf(uid); },

  bans: {
    is: isBanned,
    info: banInfo,
    ban: banUser,
    unban: unbanUser
  },

  reports: {
    all: function() { return reports; },
    add: addReport,
    update: function(id, data) { var r = reports.find(function(x) { return x.id === id; }); if (r) { Object.assign(r, data); save(); } },
    remove: function(id) { reports = reports.filter(function(r) { return r.id !== id; }); save(); }
  },

  adminLogs: {
    all: function() { return adminLogs; },
    add: logAdmin
  },

  follows: {
    is: isFollowing,
    toggle: toggleFollow,
    followers: followersOf,
    following: followingOf
  },

  messages: {
    send: sendMessage,
    conv: conversationOf,
    conversations: conversationsOf,
    markRead: markConvRead
  },

  blocks: {
    is: isBlocked,
    toggle: toggleBlock,
    of: blocksOf
  },

  topUsers: topUsers,

  reactions: {
    has: hasReacted,
    list: reactionsOf,
    toggle: toggleReaction
  },

  bookmarks: {
    has: isBookmarked,
    toggle: bookmarkToggle,
    of: bookmarksOf
  },

  notifications: {
    byUser: function(uid) {
      return notifications.filter(function(n) { return n.userId === uid; })
        .sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
    },
    unread: unreadCount,
    add: addNotification,
    markRead: function(uid) {
      notifications.forEach(function(n) { if (n.userId === uid) n.read = true; });
      save();
    }
  }
};
