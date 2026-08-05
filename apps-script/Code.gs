/**
 * বাংলাবিদ — Google Apps Script ব্যাকএন্ড
 * ---------------------------------------------------------
 * এই কোডটি Google Sheet-কে ডাটাবেস হিসেবে ব্যবহার করে একটা API সার্ভার
 * তৈরি করে। কোনো ম্যানুয়াল হেডার লেখা বা Sheet ID কপি করার দরকার নেই —
 * নিচের setup() ফাংশনটা একবার Run করলেই সব ট্যাব, হেডার, ডিফল্ট
 * অ্যাডমিন — সব নিজে থেকে তৈরি হয়ে যাবে। আগে থেকে ডেটা থাকলে setup()
 * আবার Run করলেও পুরনো কোনো ডেটা মোছে না — শুধু নতুন কলাম/ট্যাব যোগ হয়।
 *
 * সেটআপ নির্দেশনা README_BN.md ফাইলে দেখুন।
 */

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "banglabid2026"; // ডিপ্লয়ের পর এটা অবশ্যই বদলান

// প্রতিটা তালিকায় নতুন ফিল্ড সবসময় শেষে যোগ করা হয় — যাতে আগে থেকে থাকা
// শিটের কোনো কলাম এলোমেলো না হয়ে যায়, পুরনো ডেটা অক্ষত থাকে।
const REGISTRATION_HEADERS = [
  "id", "name", "className", "school", "division", "phone", "email",
  "password", "bkashSender", "transactionId", "status", "note", "createdAt",
  "studentToken",
];

const QUESTION_HEADERS = [
  "id", "question", "optionA", "optionB", "optionC", "optionD",
  "correctOption", "explanation", "forMock", "forLive", "createdAt",
  "category", "subCategory",
];

const ATTEMPT_HEADERS = [
  "id", "registrationId", "phone", "email", "examType", "score", "total",
  "violations", "autoSubmitted", "answersJson", "createdAt",
];

const NOTICE_HEADERS = ["id", "message", "active", "createdAt"];

const WRITTEN_QUESTION_HEADERS = [
  "id", "passageHtml", "questionsJson", "kind", "status",
  "forMock", "forLive", "createdAt",
];

const WRITTEN_ATTEMPT_HEADERS = [
  "id", "registrationId", "phone", "email", "examType", "kind", "sessionId",
  "writtenQuestionId", "subQuestionId", "subQuestionText", "points", "imageUrl",
  "status", "score", "annotatedImageUrl", "adminComment", "createdAt", "gradedAt",
];

const BENGALI_ORDINALS = [
  "প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম",
  "নবম", "দশম", "একাদশ", "দ্বাদশ", "ত্রয়োদশ", "চতুর্দশ", "পঞ্চদশ",
];

function ordinalBn_(n) {
  return BENGALI_ORDINALS[n - 1] || n + "তম";
}

/**
 * এই একটামাত্র ফাংশন Run করলে দরকারি সব শিট/ট্যাব, হেডার, ডিফল্ট সেটিংস
 * এবং একটা ডিফল্ট অ্যাডমিন — সব অটোমেটিক তৈরি হয়ে যাবে। আগে একবার Run করা
 * থাকলেও আবার Run করা নিরাপদ — নতুন আপডেটে যোগ হওয়া কলাম/ট্যাব শুধু যোগ হবে,
 * পুরনো কোনো সারি/মান মোছা হবে না।
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let regSheet = ss.getSheetByName("Registrations");
  if (!regSheet) regSheet = ss.insertSheet("Registrations");
  ensureHeaders_(regSheet, REGISTRATION_HEADERS);
  forceTextColumn_(regSheet, REGISTRATION_HEADERS.indexOf("phone") + 1);
  forceTextColumn_(regSheet, REGISTRATION_HEADERS.indexOf("bkashSender") + 1);
  forceTextColumn_(regSheet, REGISTRATION_HEADERS.indexOf("transactionId") + 1);

  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) settingsSheet = ss.insertSheet("Settings");
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(["key", "value"]);
    settingsSheet.appendRow(["price", "99"]);
    settingsSheet.appendRow(["discountDeadline", ""]);
    settingsSheet.appendRow(["courseImageUrl", ""]);
    settingsSheet.appendRow(["maintenanceMode", "FALSE"]);
    settingsSheet.appendRow(["liveExamStart", ""]);
    settingsSheet.appendRow(["liveExamEnd", ""]);
    settingsSheet.setFrozenRows(1);
  } else {
    ensureSettingsKeys_(settingsSheet, ["liveExamStart", "liveExamEnd"]);
  }

  let adminsSheet = ss.getSheetByName("Admins");
  if (!adminsSheet) adminsSheet = ss.insertSheet("Admins");
  if (adminsSheet.getLastRow() === 0) {
    adminsSheet.appendRow(["username", "password", "token"]);
    adminsSheet.appendRow([DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, ""]);
    adminsSheet.setFrozenRows(1);
  }

  let questionsSheet = ss.getSheetByName("Questions");
  if (!questionsSheet) questionsSheet = ss.insertSheet("Questions");
  ensureHeaders_(questionsSheet, QUESTION_HEADERS);

  let attemptsSheet = ss.getSheetByName("Attempts");
  if (!attemptsSheet) attemptsSheet = ss.insertSheet("Attempts");
  ensureHeaders_(attemptsSheet, ATTEMPT_HEADERS);

  let noticesSheet = ss.getSheetByName("Notices");
  if (!noticesSheet) noticesSheet = ss.insertSheet("Notices");
  ensureHeaders_(noticesSheet, NOTICE_HEADERS);

  let writtenQSheet = ss.getSheetByName("WrittenQuestions");
  if (!writtenQSheet) writtenQSheet = ss.insertSheet("WrittenQuestions");
  ensureHeaders_(writtenQSheet, WRITTEN_QUESTION_HEADERS);

  let writtenASheet = ss.getSheetByName("WrittenAttempts");
  if (!writtenASheet) writtenASheet = ss.insertSheet("WrittenAttempts");
  ensureHeaders_(writtenASheet, WRITTEN_ATTEMPT_HEADERS);

  const blank = ss.getSheetByName("Sheet1");
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  Logger.log("সেটআপ সম্পন্ন! এখন Deploy → New deployment (বা Manage deployments → New version) করুন।");
  Logger.log("অ্যাডমিন লগইন — username: " + DEFAULT_ADMIN_USERNAME + " | password: " + DEFAULT_ADMIN_PASSWORD);
}

/** কোনো শিটে হেডার না থাকলে বসিয়ে দেয়; থাকলে যা যা নতুন কলাম বাকি আছে সেগুলো
 *  শেষে যোগ করে দেয় — পুরনো কোনো ডেটা/কলামের অবস্থান বদলায় না। */
function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((h) => {
    if (existing.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      existing.push(h);
    }
  });
}

/** পুরনো Settings শিটে নতুন কোনো key না থাকলে সেটা খালি মান দিয়ে যোগ করে দেয়। */
function ensureSettingsKeys_(sheet, keys) {
  const rows = sheet.getDataRange().getValues();
  const existing = rows.slice(1).map((r) => r[0]);
  keys.forEach((k) => {
    if (existing.indexOf(k) === -1) sheet.appendRow([k, ""]);
  });
}

/** একটা কলামের ফরম্যাট "Plain text" করে দেয় যাতে ০১XXXXXXXXX-এর মতো নম্বরের
 *  শুরুর "0" Google Sheets সংখ্যা ভেবে মুছে না ফেলে। */
function forceTextColumn_(sheet, colIndex) {
  if (colIndex < 1) return;
  sheet.getRange(1, colIndex, Math.max(sheet.getMaxRows(), 1000), 1).setNumberFormat("@");
}

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const obj = { _row: idx + 2 };
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

function findRowIndexById_(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1; // 1-indexed sheet row
  }
  return -1;
}

/** ফোন নম্বর তুলনার জন্য নরমালাইজ করে — Sheets মাঝেমধ্যে শুরুর "0" মুছে ফেলে,
 *  এই ফাংশনটা সেটা ধরে আবার বসিয়ে দেয় যাতে পুরনো (already-corrupted) সারির
 *  সাথেও ঠিকভাবে মিলে যায়। */
function normalizePhone_(v) {
  let digits = String(v || "").replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits[0] !== "0") digits = "0" + digits;
  return digits;
}

/**
 * এই ফাংশনটা একবার ম্যানুয়ালি Run করলে Registrations শিটে আগে থেকে যেসব ফোন/বিকাশ
 * নম্বরের শুরুর "0" হারিয়ে গেছে (Google Sheets সংখ্যা ভেবে ফেলেছিল), সেগুলো খুঁজে বের
 * করে আবার "0" বসিয়ে ঠিক করে দেয় — শুধুমাত্র ১০-ডিজিটের (０ ছাড়া) নম্বরে প্রযোজ্য।
 * Apps Script এডিটরে ড্রপডাউন থেকে "fixExistingPhoneNumbers" সিলেক্ট করে ▶ Run করুন।
 */
function fixExistingPhoneNumbers() {
  const sheet = getSheet_("Registrations");
  forceTextColumn_(sheet, REGISTRATION_HEADERS.indexOf("phone") + 1);
  forceTextColumn_(sheet, REGISTRATION_HEADERS.indexOf("bkashSender") + 1);

  const phoneCol = REGISTRATION_HEADERS.indexOf("phone") + 1;
  const bkashCol = REGISTRATION_HEADERS.indexOf("bkashSender") + 1;
  const lastRow = sheet.getLastRow();
  let fixedCount = 0;

  for (let row = 2; row <= lastRow; row++) {
    [phoneCol, bkashCol].forEach((col) => {
      const cell = sheet.getRange(row, col);
      const current = String(cell.getValue() || "");
      const normalized = normalizePhone_(current);
      if (normalized && normalized !== current) {
        cell.setValue(normalized);
        fixedCount++;
      }
    });
  }

  Logger.log("ঠিক করা হয়েছে এমন ঘরের সংখ্যা: " + fixedCount);
}

/* ---------------- Settings ---------------- */

function getSettingsObj_() {
  const sheet = getSheet_("Settings");
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  settings.maintenanceMode = settings.maintenanceMode === true || settings.maintenanceMode === "TRUE";
  return settings;
}

function setSettingsObj_(newSettings) {
  const sheet = getSheet_("Settings");
  const rows = sheet.getDataRange().getValues();
  const keyRow = {};
  for (let i = 1; i < rows.length; i++) keyRow[rows[i][0]] = i + 1;

  Object.keys(newSettings).forEach((key) => {
    if (key === "action" || key === "token") return;
    const val = newSettings[key];
    if (keyRow[key]) {
      sheet.getRange(keyRow[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
    }
  });
}

/* ---------------- Admin auth ---------------- */

function checkAdminToken_(token) {
  const admins = sheetToObjects_(getSheet_("Admins"));
  return admins.some((a) => String(a.token) === String(token) && token);
}

function adminLogin_(username, password) {
  const sheet = getSheet_("Admins");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(username) && String(rows[i][1]) === String(password)) {
      const token = Utilities.getUuid();
      sheet.getRange(i + 1, 3).setValue(token);
      return token;
    }
  }
  return null;
}

/* ---------------- Registration ---------------- */

function registerStudent_(data) {
  const sheet = getSheet_("Registrations");
  const id = Utilities.getUuid();
  forceTextColumn_(sheet, REGISTRATION_HEADERS.indexOf("phone") + 1);
  forceTextColumn_(sheet, REGISTRATION_HEADERS.indexOf("bkashSender") + 1);
  forceTextColumn_(sheet, REGISTRATION_HEADERS.indexOf("transactionId") + 1);
  sheet.appendRow([
    id,
    data.name,
    data.className,
    data.school,
    data.division,
    normalizePhone_(data.phone),
    data.email,
    data.password,
    normalizePhone_(data.bkashSender),
    data.transactionId,
    "pending",
    "",
    new Date(),
    "",
  ]);
  return id;
}

function findRegistrationByContact_(phone, email) {
  const rows = sheetToObjects_(getSheet_("Registrations"));
  const matches = rows.filter(
    (r) => normalizePhone_(r.phone) === normalizePhone_(phone) && String(r.email).trim().toLowerCase() === String(email).trim().toLowerCase()
  );
  return matches.length ? matches[matches.length - 1] : null;
}

function findRegistrationById_(id) {
  const rows = sheetToObjects_(getSheet_("Registrations"));
  return rows.find((r) => String(r.id) === String(id)) || null;
}

/* ---------------- স্টুডেন্ট লগইন ---------------- */

function studentLogin_(email, password) {
  const sheet = getSheet_("Registrations");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const emailCol = headers.indexOf("email");
  const passCol = headers.indexOf("password");
  const tokenCol = headers.indexOf("studentToken");

  for (let i = 1; i < rows.length; i++) {
    if (
      String(rows[i][emailCol]).trim().toLowerCase() === String(email).trim().toLowerCase() &&
      String(rows[i][passCol]) === String(password)
    ) {
      const token = Utilities.getUuid();
      sheet.getRange(i + 1, tokenCol + 1).setValue(token);
      return { token, row: rows[i], headers };
    }
  }
  return null;
}

function findRegistrationByStudentToken_(token) {
  if (!token) return null;
  const rows = sheetToObjects_(getSheet_("Registrations"));
  return rows.find((r) => String(r.studentToken) === String(token)) || null;
}

/* ---------------- নোটিশ ---------------- */

function addNotice_(message) {
  const sheet = getSheet_("Notices");
  const id = Utilities.getUuid();
  sheet.appendRow([id, message, true, new Date()]);
  return id;
}

function listActiveNotices_() {
  const rows = sheetToObjects_(getSheet_("Notices"));
  return rows
    .filter((n) => n.active === true || n.active === "TRUE")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((n) => ({ id: n.id, message: n.message, createdAt: n.createdAt }));
}

/* ---------------- MCQ প্রশ্ন ব্যাংক ও পরীক্ষা ---------------- */

function shuffleArray_(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addQuestion_(q) {
  const sheet = getSheet_("Questions");
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    q.question,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
    q.correctOption, // "A" | "B" | "C" | "D"
    q.explanation || "",
    q.forMock !== false,
    !!q.forLive,
    new Date(),
    q.category || "",       // "সাহিত্য" | "ব্যাকরণ"
    q.subCategory || "",    // "বানান" | "অন্যান্য" (শুধু ব্যাকরণের জন্য প্রযোজ্য)
  ]);
  return id;
}

function correctTextForQuestion_(q) {
  return q["option" + q.correctOption];
}

/**
 * প্রশ্ন বাছাইয়ের নিয়মঃ মোট প্রশ্নের ৫০% সাহিত্য, ৫০% ব্যাকরণ — এবং ব্যাকরণের
 * মধ্যে ২৫% বানান-সংক্রান্ত। পর্যাপ্ত প্রশ্ন না থাকলে যতটা সম্ভব ওই ভাগ থেকে
 * নিয়ে বাকিটা অন্য ভাগ থেকে পূরণ করা হয়, যাতে মোট সংখ্যা ঠিক থাকে।
 */
function pickCategorizedQuestions_(pool, targetTotal) {
  const literature = pool.filter((q) => q.category === "সাহিত্য");
  const grammar = pool.filter((q) => q.category === "ব্যাকরণ");
  const spelling = grammar.filter((q) => q.subCategory === "বানান");
  const otherGrammar = grammar.filter((q) => q.subCategory !== "বানান");

  const wantLit = Math.round(targetTotal * 0.5);
  const wantGrammar = targetTotal - wantLit;
  const wantSpelling = Math.round(wantGrammar * 0.35);
  const wantOtherGrammar = wantGrammar - wantSpelling;

  const pickedLit = shuffleArray_(literature).slice(0, wantLit);
  const pickedSpelling = shuffleArray_(spelling).slice(0, wantSpelling);
  const pickedOtherGrammar = shuffleArray_(otherGrammar).slice(0, wantOtherGrammar);

  let picked = [...pickedLit, ...pickedSpelling, ...pickedOtherGrammar];
  const usedIds = new Set(picked.map((q) => q.id));

  // শর্টফল থাকলে বাকি প্রশ্নের পুল থেকে পূরণ করা (ক্যাটাগরি না মেলাটা এখানে
  // গ্রহণযোগ্য — সঠিক অনুপাত না মেলার চেয়ে পরীক্ষা চালু থাকাটা জরুরি)
  if (picked.length < targetTotal) {
    const remaining = shuffleArray_(pool.filter((q) => !usedIds.has(q.id)));
    picked = picked.concat(remaining.slice(0, targetTotal - picked.length));
  }

  return shuffleArray_(picked).slice(0, targetTotal);
}

/**
 * একজন স্টুডেন্টের জন্য প্রশ্ন বাছাই করা হয়, প্রশ্নের ক্রম ও প্রতিটা প্রশ্নের
 * অপশনের ক্রম শাফল করে পাঠানো হয় — সঠিক উত্তর কোনটা সেটা ক্লায়েন্টে পাঠানো হয় না।
 */
function getMcqExam_(examType) {
  const all = sheetToObjects_(getSheet_("Questions"));
  const pool = all.filter((q) => (examType === "live" ? q.forLive : q.forMock));
  const picked = pickCategorizedQuestions_(pool, 40);

  return picked.map((q) => {
    const options = shuffleArray_(["A", "B", "C", "D"].map((k) => q["option" + k]));
    return { id: q.id, question: q.question, options };
  });
}

/**
 * ক্লায়েন্ট প্রতিটা প্রশ্নের জন্য নির্বাচিত অপশন(গুলো)-এর টেক্সট (position না,
 * কারণ শাফল করা ছিল) পাঠায় — খালি অ্যারে মানে উত্তর দেয়নি, একাধিক টেক্সট মানে
 * একাধিক অপশন সিলেক্ট করেছে (দুটোই ভুল ধরা হয়)। ক্লায়েন্ট থেকে অবশ্যই *সবগুলো*
 * প্রশ্নের জন্য এন্ট্রি পাঠাতে হবে (উত্তর না দেওয়া প্রশ্নগুলোরও), যাতে সম্পূর্ণ
 * এক্সাম বিশ্লেষণ করা যায়।
 */
function scoreMcqAnswers_(answers) {
  const all = sheetToObjects_(getSheet_("Questions"));
  const byId = {};
  all.forEach((q) => (byId[q.id] = q));

  let score = 0;
  const details = answers.map((a) => {
    const q = byId[a.id];
    if (!q) return null;
    const options = ["A", "B", "C", "D"].map((k) => q["option" + k]);
    const correctText = correctTextForQuestion_(q);
    const selectedTexts = Array.isArray(a.selectedTexts) ? a.selectedTexts.filter(Boolean) : [];
    const isCorrect = selectedTexts.length === 1 && selectedTexts[0] === correctText;
    if (isCorrect) score++;
    return {
      id: q.id,
      question: q.question,
      options,
      selectedTexts,
      correctText,
      isCorrect,
      explanation: q.explanation || "",
    };
  }).filter(Boolean);

  return { score, total: details.length, details };
}

function saveAttempt_(data) {
  const sheet = getSheet_("Attempts");
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    data.registrationId || "",
    data.phone,
    data.email,
    data.examType,
    data.score,
    data.total,
    data.violations || 0,
    !!data.autoSubmitted,
    JSON.stringify(data.answers || []),
    new Date(),
  ]);

  const attemptsForStudent = sheetToObjects_(sheet).filter(
    (a) => String(a.registrationId) === String(data.registrationId) && a.examType === data.examType
  );
  return { id, ordinal: attemptsForStudent.length };
}

function listAttemptsForStudent_(registrationId) {
  const rows = sheetToObjects_(getSheet_("Attempts")).filter(
    (a) => String(a.registrationId) === String(registrationId)
  );
  const counters = {};
  return rows
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((a) => {
      counters[a.examType] = (counters[a.examType] || 0) + 1;
      return {
        id: a.id,
        examType: a.examType,
        score: a.score,
        total: a.total,
        ordinal: counters[a.examType],
        createdAt: a.createdAt,
      };
    })
    .reverse();
}

/* ---------------- লাইভ পরীক্ষার সময়সীমা ---------------- */

function isLiveExamOpen_() {
  const settings = getSettingsObj_();
  if (!settings.liveExamStart || !settings.liveExamEnd) return { open: false, reason: "লাইভ পরীক্ষার সময় এখনো নির্ধারণ করা হয়নি।" };
  const now = new Date();
  const start = new Date(settings.liveExamStart);
  const end = new Date(settings.liveExamEnd);
  if (now < start) return { open: false, reason: "লাইভ পরীক্ষা এখনো শুরু হয়নি। শুরু হবে: " + start.toLocaleString("bn-BD") };
  if (now > end) return { open: false, reason: "লাইভ পরীক্ষার সময় শেষ হয়ে গেছে।" };
  return { open: true };
}

/* ---------------- অনুধাবনমূলক পরীক্ষা ও বানান প্রতিযোগিতা ---------------- */

/** একটা প্যাসেজ (উদ্দীপক) একাধিক প্রশ্নসহ যোগ করা হয়। q.subQuestions একটা
 *  অ্যারে: [{text, points}, ...]। kind: "written" (অনুধাবনমূলক) বা "spelling"
 *  (বানান প্রতিযোগিতা)। status: "draft" | "published"। */
function addWrittenQuestion_(q) {
  const sheet = getSheet_("WrittenQuestions");
  const id = Utilities.getUuid();
  const subQuestions = (q.subQuestions || []).map((sq) => ({
    id: Utilities.getUuid(),
    text: sq.text,
    points: sq.points || 10,
  }));
  sheet.appendRow([
    id,
    q.passageHtml || "",
    JSON.stringify(subQuestions),
    q.kind || "written",
    q.status === "published" ? "published" : "draft",
    q.forMock !== false,
    !!q.forLive,
    new Date(),
  ]);
  return id;
}

function updateWrittenQuestion_(id, q) {
  const sheet = getSheet_("WrittenQuestions");
  const rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx === -1) return false;
  const col = (name) => WRITTEN_QUESTION_HEADERS.indexOf(name) + 1;
  const subQuestions = (q.subQuestions || []).map((sq) => ({
    id: sq.id || Utilities.getUuid(),
    text: sq.text,
    points: sq.points || 10,
  }));
  sheet.getRange(rowIdx, col("passageHtml")).setValue(q.passageHtml || "");
  sheet.getRange(rowIdx, col("questionsJson")).setValue(JSON.stringify(subQuestions));
  sheet.getRange(rowIdx, col("kind")).setValue(q.kind || "written");
  sheet.getRange(rowIdx, col("status")).setValue(q.status === "published" ? "published" : "draft");
  sheet.getRange(rowIdx, col("forMock")).setValue(q.forMock !== false);
  sheet.getRange(rowIdx, col("forLive")).setValue(!!q.forLive);
  return true;
}

function parsedWrittenQuestions_() {
  return sheetToObjects_(getSheet_("WrittenQuestions")).map((q) => ({
    ...q,
    subQuestions: (() => {
      try {
        return JSON.parse(q.questionsJson || "[]");
      } catch (e) {
        return [];
      }
    })(),
  }));
}

/** kind অনুযায়ী (written/spelling) এবং mock/live অনুযায়ী শুধু published প্রশ্ন
 *  থেকে র‍্যান্ডমলি বাছাই করে। written হলে ৩টা প্যাসেজ (প্রতিটায় যত সাব-প্রশ্ন
 *  থাকুক), spelling হলে সরাসরি ১০টা প্রশ্ন (কোনো প্যাসেজ ছাড়া, প্রতিটাই একটা
 *  আলাদা আইটেম)। */
function getWrittenSets_(examType, kind) {
  const all = parsedWrittenQuestions_().filter(
    (q) => q.status === "published" && (examType === "live" ? q.forLive : q.forMock) && q.kind === kind
  );

  if (kind === "spelling") {
    const flatItems = [];
    all.forEach((q) => {
      (q.subQuestions || []).forEach((sq) => {
        flatItems.push({ writtenQuestionId: q.id, subQuestionId: sq.id, text: sq.text, points: sq.points });
      });
    });
    const picked = shuffleArray_(flatItems).slice(0, 10);
    return [{ id: "spelling-set", passageHtml: "", subQuestions: picked.map((p) => ({
      id: p.subQuestionId, writtenQuestionId: p.writtenQuestionId, text: p.text, points: p.points,
    })) }];
  }

  const picked = shuffleArray_(all).slice(0, 3);
  return picked.map((q) => ({
    id: q.id,
    passageHtml: q.passageHtml,
    subQuestions: (q.subQuestions || []).map((sq) => ({ ...sq, writtenQuestionId: q.id })),
  }));
}

/** ব্রাউজার থেকে পাঠানো base64 ছবি Google Drive-এ আপলোড করে এবং শেয়ারড লিংক ফেরত দেয়। */
function uploadImageToDrive_(base64Data, mimeType, filename) {
  const folderName = "Banglabid Written Answers";
  const folders = DriveApp.getFoldersByName(folderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  const bytes = Utilities.base64Decode(base64Data.replace(/^data:[^;]+;base64,/, ""));
  const blob = Utilities.newBlob(bytes, mimeType || "image/jpeg", filename);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://lh3.googleusercontent.com/d/" + file.getId();
}

function saveWrittenAttempt_(data) {
  const sheet = getSheet_("WrittenAttempts");
  const id = Utilities.getUuid();
  sheet.appendRow([
    id, data.registrationId, data.phone, data.email, data.examType, data.kind, data.sessionId,
    data.writtenQuestionId, data.subQuestionId, data.subQuestionText, data.points, data.imageUrl,
    "pending", "", "", "", new Date(), "",
  ]);
  return id;
}

function listWrittenAttemptsForStudent_(registrationId) {
  const rows = sheetToObjects_(getSheet_("WrittenAttempts")).filter(
    (a) => String(a.registrationId) === String(registrationId)
  );
  const sessions = {};
  rows.forEach((a) => {
    if (!sessions[a.sessionId]) {
      sessions[a.sessionId] = { sessionId: a.sessionId, examType: a.examType, kind: a.kind, createdAt: a.createdAt, items: [] };
    }
    sessions[a.sessionId].items.push(a);
  });
  return Object.values(sessions).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function listPendingWrittenAttempts_() {
  return sheetToObjects_(getSheet_("WrittenAttempts")).filter((a) => a.status === "pending");
}

function gradeWrittenAttempt_(id, score, annotatedImageUrl, adminComment) {
  const sheet = getSheet_("WrittenAttempts");
  const rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx === -1) return false;
  const col = (name) => WRITTEN_ATTEMPT_HEADERS.indexOf(name) + 1;
  sheet.getRange(rowIdx, col("status")).setValue("graded");
  sheet.getRange(rowIdx, col("score")).setValue(score);
  sheet.getRange(rowIdx, col("annotatedImageUrl")).setValue(annotatedImageUrl || "");
  sheet.getRange(rowIdx, col("adminComment")).setValue(adminComment || "");
  sheet.getRange(rowIdx, col("gradedAt")).setValue(new Date());
  return true;
}

/* ---------------- র‍্যাঙ্কিং / মেরিট তালিকা ---------------- */

function getLeaderboard_(examType) {
  const attempts = sheetToObjects_(getSheet_("Attempts")).filter((a) => a.examType === examType);
  const regs = sheetToObjects_(getSheet_("Registrations"));
  const regById = {};
  regs.forEach((r) => (regById[r.id] = r));

  // প্রতিটা স্টুডেন্টের সর্বোচ্চ স্কোর নেওয়া হয় (মক টেস্ট বহুবার দেওয়া যায় বলে)
  const bestByStudent = {};
  attempts.forEach((a) => {
    const key = String(a.registrationId);
    if (!bestByStudent[key] || a.score > bestByStudent[key].score) {
      bestByStudent[key] = a;
    }
  });

  return Object.values(bestByStudent)
    .sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, 20)
    .map((a) => {
      const r = regById[a.registrationId] || {};
      return {
        name: r.name || "অজানা",
        className: r.className || "",
        school: r.school || "",
        division: r.division || "",
        score: a.score,
        total: a.total,
      };
    });
}

/* ---------------- HTTP entry points ---------------- */

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "getSettings") {
      return jsonOut_({ ok: true, data: getSettingsObj_() });
    }
    return jsonOut_({ ok: false, message: "অজানা action" });
  } catch (err) {
    return jsonOut_({ ok: false, message: String(err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, message: "ভুল রিকোয়েস্ট ফরম্যাট" });
  }

  const action = body.action;

  try {
    switch (action) {
      case "register": {
        if (!body.name || !body.phone || !body.email) {
          return jsonOut_({ ok: false, message: "প্রয়োজনীয় তথ্য অনুপস্থিত" });
        }
        const id = registerStudent_(body);
        return jsonOut_({ ok: true, data: { id } });
      }

      case "checkStatus": {
        const reg = findRegistrationByContact_(body.phone, body.email);
        if (!reg) return jsonOut_({ ok: false, message: "কোনো রেজিস্ট্রেশন পাওয়া যায়নি।" });
        return jsonOut_({
          ok: true,
          data: {
            name: reg.name,
            className: reg.className,
            school: reg.school,
            division: reg.division,
            status: reg.status,
            note: reg.note,
          },
        });
      }

      case "adminLogin": {
        const token = adminLogin_(body.username, body.password);
        if (!token) return jsonOut_({ ok: false, message: "ভুল ইউজারনেম বা পাসওয়ার্ড।" });
        return jsonOut_({ ok: true, data: { token } });
      }

      case "adminListRegistrations": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: sheetToObjects_(getSheet_("Registrations")) });
      }

      case "adminUpdateRegistrationStatus": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        const sheet = getSheet_("Registrations");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "রেজিস্ট্রেশন পাওয়া যায়নি" });
        sheet.getRange(rowIdx, REGISTRATION_HEADERS.indexOf("status") + 1).setValue(body.status);
        return jsonOut_({ ok: true });
      }

      case "adminUpdateSettings": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        setSettingsObj_(body);
        return jsonOut_({ ok: true });
      }

      /* ---------- স্টুডেন্ট লগইন ও পোর্টাল ---------- */

      case "studentLogin": {
        const result = studentLogin_(body.email, body.password);
        if (!result) return jsonOut_({ ok: false, message: "ভুল ইমেইল বা পাসওয়ার্ড।" });
        const headers = result.headers;
        const row = result.row;
        const get = (key) => row[headers.indexOf(key)];
        return jsonOut_({
          ok: true,
          data: {
            token: result.token,
            profile: {
              name: get("name"),
              className: get("className"),
              school: get("school"),
              division: get("division"),
              status: get("status"),
            },
          },
        });
      }

      case "studentMe": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({
          ok: true,
          data: {
            name: reg.name,
            className: reg.className,
            school: reg.school,
            division: reg.division,
            status: reg.status,
          },
        });
      }

      case "studentNotices": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: listActiveNotices_() });
      }

      case "studentAttempts": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: listAttemptsForStudent_(reg.id) });
      }

      case "startMcqExam": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized — আবার লগইন করুন।" });
        if (reg.status !== "confirmed") {
          return jsonOut_({ ok: false, message: "আপনার রেজিস্ট্রেশন এখনও কনফার্ম হয়নি।" });
        }
        const examType = body.examType === "live" ? "live" : "mock";
        if (examType === "live") {
          const win = isLiveExamOpen_();
          if (!win.open) return jsonOut_({ ok: false, message: win.reason });
        }
        const questions = getMcqExam_(examType);
        if (questions.length === 0) {
          return jsonOut_({ ok: false, message: "এখনো কোনো প্রশ্ন যোগ করা হয়নি। পরে আবার চেষ্টা করুন।" });
        }
        return jsonOut_({ ok: true, data: { questions } });
      }

      case "submitMcqExam": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized — আবার লগইন করুন।" });
        const result = scoreMcqAnswers_(body.answers || []);
        const saved = saveAttempt_({
          registrationId: reg.id,
          phone: reg.phone,
          email: reg.email,
          examType: body.examType || "mock",
          score: result.score,
          total: result.total,
          violations: body.violations,
          autoSubmitted: body.autoSubmitted,
          answers: result.details,
        });
        return jsonOut_({ ok: true, data: { ...result, ordinal: saved.ordinal } });
      }

      /* ---------- অ্যাডমিন: প্রশ্ন ব্যাংক ---------- */

      case "adminAddQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        if (!body.question || !body.optionA || !body.optionB || !body.optionC || !body.optionD || !body.correctOption) {
          return jsonOut_({ ok: false, message: "সব ঘর পূরণ করুন।" });
        }
        if (!body.category) {
          return jsonOut_({ ok: false, message: "প্রশ্নের ক্যাটাগরি (সাহিত্য/ব্যাকরণ) নির্বাচন করুন।" });
        }
        if (body.category === "ব্যাকরণ" && !body.subCategory) {
          return jsonOut_({ ok: false, message: "ব্যাকরণ প্রশ্নের জন্য উপ-ক্যাটাগরি (বানান/অন্যান্য) নির্বাচন করুন।" });
        }
        const id = addQuestion_(body);
        return jsonOut_({ ok: true, data: { id } });
      }

      case "adminListQuestions": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: sheetToObjects_(getSheet_("Questions")) });
      }

      case "adminUpdateQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        if (!body.id) return jsonOut_({ ok: false, message: "প্রশ্নের আইডি পাওয়া যায়নি।" });
        if (body.category === "ব্যাকরণ" && !body.subCategory) {
          return jsonOut_({ ok: false, message: "ব্যাকরণ প্রশ্নের জন্য উপ-ক্যাটাগরি (বানান/অন্যান্য) নির্বাচন করুন।" });
        }
        const sheet = getSheet_("Questions");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "প্রশ্ন পাওয়া যায়নি" });
        const col = (name) => QUESTION_HEADERS.indexOf(name) + 1;
        sheet.getRange(rowIdx, col("question")).setValue(body.question);
        sheet.getRange(rowIdx, col("optionA")).setValue(body.optionA);
        sheet.getRange(rowIdx, col("optionB")).setValue(body.optionB);
        sheet.getRange(rowIdx, col("optionC")).setValue(body.optionC);
        sheet.getRange(rowIdx, col("optionD")).setValue(body.optionD);
        sheet.getRange(rowIdx, col("correctOption")).setValue(body.correctOption);
        sheet.getRange(rowIdx, col("explanation")).setValue(body.explanation || "");
        sheet.getRange(rowIdx, col("forMock")).setValue(body.forMock !== false);
        sheet.getRange(rowIdx, col("forLive")).setValue(!!body.forLive);
        sheet.getRange(rowIdx, col("category")).setValue(body.category || "");
        sheet.getRange(rowIdx, col("subCategory")).setValue(body.subCategory || "");
        return jsonOut_({ ok: true });
      }

      case "adminDeleteQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        const sheet = getSheet_("Questions");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "প্রশ্ন পাওয়া যায়নি" });
        sheet.deleteRow(rowIdx);
        return jsonOut_({ ok: true });
      }

      /* ---------- অ্যাডমিন: নোটিশ ---------- */

      case "adminAddNotice": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        if (!body.message) return jsonOut_({ ok: false, message: "নোটিশের লেখা দিন।" });
        const id = addNotice_(body.message);
        return jsonOut_({ ok: true, data: { id } });
      }

      case "adminListNotices": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: sheetToObjects_(getSheet_("Notices")) });
      }

      case "adminDeleteNotice": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        const sheet = getSheet_("Notices");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "নোটিশ পাওয়া যায়নি" });
        sheet.deleteRow(rowIdx);
        return jsonOut_({ ok: true });
      }

      /* ---------- লাইভ পরীক্ষার সময় ---------- */

      case "liveExamStatus": {
        return jsonOut_({ ok: true, data: isLiveExamOpen_() });
      }

      /* ---------- স্টুডেন্ট: অনুধাবনমূলক / বানান পরীক্ষা ---------- */

      case "startWrittenExam": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized — আবার লগইন করুন।" });
        if (reg.status !== "confirmed") return jsonOut_({ ok: false, message: "আপনার রেজিস্ট্রেশন এখনও কনফার্ম হয়নি।" });
        const examType = body.examType === "live" ? "live" : "mock";
        if (examType === "live") {
          const win = isLiveExamOpen_();
          if (!win.open) return jsonOut_({ ok: false, message: win.reason });
        }
        const sets = getWrittenSets_(examType, body.kind === "spelling" ? "spelling" : "written");
        if (sets.length === 0 || sets.every((s) => (s.subQuestions || []).length === 0)) {
          return jsonOut_({ ok: false, message: "এখনো কোনো প্রশ্ন প্রকাশ করা হয়নি। পরে আবার চেষ্টা করুন।" });
        }
        return jsonOut_({ ok: true, data: { sessionId: Utilities.getUuid(), sets } });
      }

      case "submitWrittenAnswer": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized — আবার লগইন করুন।" });
        if (!body.imageBase64) return jsonOut_({ ok: false, message: "ছবি পাওয়া যায়নি।" });
        const imageUrl = uploadImageToDrive_(body.imageBase64, body.mimeType, "answer_" + Utilities.getUuid() + ".jpg");
        const id = saveWrittenAttempt_({
          registrationId: reg.id,
          phone: reg.phone,
          email: reg.email,
          examType: body.examType || "mock",
          kind: body.kind === "spelling" ? "spelling" : "written",
          sessionId: body.sessionId,
          writtenQuestionId: body.writtenQuestionId,
          subQuestionId: body.subQuestionId,
          subQuestionText: body.subQuestionText,
          points: body.points,
          imageUrl,
        });
        return jsonOut_({ ok: true, data: { id, imageUrl } });
      }

      case "studentWrittenAttempts": {
        const reg = findRegistrationByStudentToken_(body.token);
        if (!reg) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: listWrittenAttemptsForStudent_(reg.id) });
      }

      case "leaderboard": {
        const examType = body.examType === "live" ? "live" : "mock";
        return jsonOut_({ ok: true, data: getLeaderboard_(examType) });
      }

      /* ---------- অ্যাডমিন: অনুধাবনমূলক/বানান প্রশ্ন ব্যাংক ---------- */

      case "adminAddWrittenQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        if (!body.subQuestions || body.subQuestions.length === 0) {
          return jsonOut_({ ok: false, message: "অন্তত একটা প্রশ্ন যোগ করুন।" });
        }
        const id = addWrittenQuestion_(body);
        return jsonOut_({ ok: true, data: { id } });
      }

      case "adminUpdateWrittenQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        if (!body.id) return jsonOut_({ ok: false, message: "আইডি পাওয়া যায়নি" });
        const okUpdated = updateWrittenQuestion_(body.id, body);
        if (!okUpdated) return jsonOut_({ ok: false, message: "প্রশ্ন পাওয়া যায়নি" });
        return jsonOut_({ ok: true });
      }

      case "adminListWrittenQuestions": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: parsedWrittenQuestions_() });
      }

      case "adminDeleteWrittenQuestion": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        const sheet = getSheet_("WrittenQuestions");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "প্রশ্ন পাওয়া যায়নি" });
        sheet.deleteRow(rowIdx);
        return jsonOut_({ ok: true });
      }

      /* ---------- অ্যাডমিন: খাতা মূল্যায়ন ---------- */

      case "adminListPendingWritten": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: listPendingWrittenAttempts_() });
      }

      case "adminGradeWritten": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        let annotatedImageUrl = "";
        if (body.annotatedImageBase64) {
          annotatedImageUrl = uploadImageToDrive_(body.annotatedImageBase64, "image/jpeg", "graded_" + Utilities.getUuid() + ".jpg");
        }
        const okGraded = gradeWrittenAttempt_(body.id, body.score, annotatedImageUrl, body.adminComment);
        if (!okGraded) return jsonOut_({ ok: false, message: "পাওয়া যায়নি" });
        return jsonOut_({ ok: true });
      }

      /* ---------- অ্যাডমিন: লাইভ ফলাফল ---------- */

      case "adminLiveResults": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: getLeaderboard_("live") });
      }

      default:
        return jsonOut_({ ok: false, message: "অজানা action" });
    }
  } catch (err) {
    return jsonOut_({ ok: false, message: String(err) });
  }
}
