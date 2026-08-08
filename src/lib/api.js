// এই ফাইলে একটাই কাজ: আমাদের Google Apps Script API-তে রিকোয়েস্ট পাঠানো।
// .env ফাইলে VITE_API_URL সেট করতে হবে (Apps Script Web App-এর URL)।

const API_URL = import.meta.env.VITE_API_URL || "";

async function callApi(action, payload = {}, { method = "POST" } = {}) {
  if (!API_URL) {
    throw new Error(
      "API URL সেট করা নেই। .env ফাইলে VITE_API_URL বসান (README_BN.md দেখুন)।"
    );
  }

  if (method === "GET") {
    const params = new URLSearchParams({ action, ...payload });
    const res = await fetch(`${API_URL}?${params.toString()}`);
    return res.json();
  }

  // Apps Script doPost simple-CORS ট্রিক: text/plain দিয়ে পাঠাতে হয়,
  // নাহলে ব্রাউজার preflight (OPTIONS) পাঠাবে যা Apps Script সাপোর্ট করে না।
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export const api = {
  getSettings: () => callApi("getSettings", {}, { method: "GET" }),
  register: (data) => callApi("register", data),
  checkStatus: (phone, email) => callApi("checkStatus", { phone, email }),
  liveExamStatus: () => callApi("liveExamStatus", {}),

  studentLogin: (email, password) => callApi("studentLogin", { email, password }),
  studentMe: (token) => callApi("studentMe", { token }),
  studentNotices: (token) => callApi("studentNotices", { token }),
  studentAttempts: (token) => callApi("studentAttempts", { token }),
  studentWrittenAttempts: (token) => callApi("studentWrittenAttempts", { token }),

  startMcqExam: (token, examType = "mock") => callApi("startMcqExam", { token, examType }),
  submitMcqExam: (payload) => callApi("submitMcqExam", payload),

  startWrittenExam: (token, examType, kind) => callApi("startWrittenExam", { token, examType, kind }),
  submitWrittenAnswer: (payload) => callApi("submitWrittenAnswer", payload),
  submitWrittenAnswersBatch: (payload) => callApi("submitWrittenAnswersBatch", payload),

  leaderboard: (examType) => callApi("leaderboard", { examType }),

  adminLogin: (username, password) => callApi("adminLogin", { username, password }),
  adminListRegistrations: (token) => callApi("adminListRegistrations", { token }),
  adminUpdateRegistrationStatus: (token, id, status) =>
    callApi("adminUpdateRegistrationStatus", { token, id, status }),
  adminUpdateSettings: (token, settings) =>
    callApi("adminUpdateSettings", { token, ...settings }),
  adminAddQuestion: (token, question) => callApi("adminAddQuestion", { token, ...question }),
  adminUpdateQuestion: (token, question) => callApi("adminUpdateQuestion", { token, ...question }),
  adminListQuestions: (token) => callApi("adminListQuestions", { token }),
  adminDeleteQuestion: (token, id) => callApi("adminDeleteQuestion", { token, id }),
  adminAddNotice: (token, message) => callApi("adminAddNotice", { token, message }),
  adminListNotices: (token) => callApi("adminListNotices", { token }),
  adminDeleteNotice: (token, id) => callApi("adminDeleteNotice", { token, id }),

  adminAddWrittenQuestion: (token, q) => callApi("adminAddWrittenQuestion", { token, ...q }),
  adminUpdateWrittenQuestion: (token, id, q) => callApi("adminUpdateWrittenQuestion", { token, id, ...q }),
  adminListWrittenQuestions: (token) => callApi("adminListWrittenQuestions", { token }),
  adminDeleteWrittenQuestion: (token, id) => callApi("adminDeleteWrittenQuestion", { token, id }),
  adminListPendingWritten: (token) => callApi("adminListPendingWritten", { token }),
  adminGradeWritten: (token, payload) => callApi("adminGradeWritten", { token, ...payload }),
  adminGradeWrittenBatch: (token, payload) => callApi("adminGradeWrittenBatch", { token, ...payload }),
  adminLiveResults: (token) => callApi("adminLiveResults", { token }),
  adminGenerateOfflineMcq: (token) => callApi("adminGenerateOfflineMcq", { token }),
  adminGenerateQuestionBankPdf: (token) => callApi("adminGenerateQuestionBankPdf", { token }),
  adminGenerateOfflineWritten: (token) => callApi("adminGenerateOfflineWritten", { token }),
  adminGenerateOfflineSpelling: (token) => callApi("adminGenerateOfflineSpelling", { token }),
};