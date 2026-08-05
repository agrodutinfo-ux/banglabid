import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const EXAM_MINUTES = 40;
const ORDINALS = ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
function ordinalBn(n) {
  return ORDINALS[n - 1] || `${n}তম`;
}

// বিল্ট-ইন API অবজেক্ট
const api = {
  async startMcqExam(token, examType) {
    const response = await fetch("https://script.google.com/macros/s/AKfycbx.../exec", {
      method: "POST",
      body: JSON.stringify({ action: "startMcqExam", token, examType })
    });
    return response.json();
  },
  async submitMcqExam(payload) {
    const response = await fetch("https://script.google.com/macros/s/AKfycbx.../exec", {
      method: "POST",
      body: JSON.stringify({ action: "submitMcqExam", ...payload })
    });
    return response.json();
  }
};

// সিকিউরিটি হুক (ইনলাইন ইমপ্লিমেন্টেশন)
function useExamSecurity({ enabled, onAutoSubmit }) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((v) => {
          const next = v + 1;
          if (next >= 3) {
            onAutoSubmit();
            setWarning({ message: "অতিরিক্ত ট্যাব পরিবর্তনের কারণে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা দেওয়া হয়েছে।", final: true });
          } else {
            setWarning({ message: `সতর্কতা #${next}: পরীক্ষা চলাকালীন অন্য ট্যাবে যাওয়া নিষেধ!` });
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, onAutoSubmit]);

  return {
    violations,
    warning,
    dismissWarning: () => setWarning(null),
    exitSecurityMode: () => {},
    requestFullscreen: () => {}
  };
}

// লোডার কম্পোনেন্ট
function Loader({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--color-ink)] border-r-transparent"></div>
        <p className="mt-4 font-display font-bold text-[var(--color-ink)]">{label || "লোড হচ্ছে..."}</p>
      </div>
    </div>
  );
}

export default function App({ examType = "mock", onFinished }) {
  const token = localStorage.getItem("banglabid_student_token");

  const [stage, setStage] = useState("loading");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(EXAM_MINUTES * 60);
  const [result, setResult] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const stageRef = useRef("loading");
  const submittingRef = useRef(false);
  const lastAutoSubmitFlagRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStage("exam"); // টোকেন না থাকলে লগইন ভিউ দেখানোর জন্য
      return;
    }
    // ডেমো ডেটা বা API ফেচ
    setTimeout(() => {
      setQuestions([
        {
          id: "q1",
          question: "বাংলা সাহিত্যের প্রথম সার্থক নাটক কোনটি?",
          options: ["ভদ্রার্জুন", "কীর্টিবিলাস", "শর্মিষ্ঠা", "পদ্মাবতী"]
        },
        {
          id: "q2",
          question: "সোপান শব্দের সঠিক অর্থ কী?",
          options: ["সিঁড়ি", "রাস্তা", "নদী", "পাহাড়"]
        }
      ]);
      setStage("exam");
    }, 1000);
  }, [examType, token]);

  async function submitExam({ autoSubmitted = false } = {}) {
    if (stageRef.current !== "exam" || submittingRef.current) return;
    submittingRef.current = true;
    lastAutoSubmitFlagRef.current = autoSubmitted;
    setStage("submitting");

    const payload = questionsRef.current.map((q) => ({
      id: q.id,
      selectedTexts: answersRef.current[q.id] || [],
    }));
    
    setTimeout(() => {
      setResult({
        score: 2,
        total: 2,
        ordinal: 1,
        details: questionsRef.current.map(q => ({
          ...q,
          selectedTexts: answersRef.current[q.id] || [],
          correctText: q.options[0],
          isCorrect: true,
          explanation: "এটি সঠিক উত্তরের ব্যাখ্যা।"
        }))
      });
      setStage("result");
      submittingRef.current = false;
    }, 1000);
  }

  function retrySubmit() {
    stageRef.current = "exam";
    submitExam({ autoSubmitted: lastAutoSubmitFlagRef.current });
  }

  const security = useExamSecurity({
    enabled: stage === "exam",
    onAutoSubmit: () => submitExam({ autoSubmitted: true }),
  });

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (stage !== "exam") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          submitExam({ autoSubmitted: false });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  function toggleOption(qId, opt) {
    setAnswers((a) => {
      const current = a[qId] || [];
      if (current.includes(opt)) return a;
      return { ...a, [qId]: [...current, opt] };
    });
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Link to="/student/login" className="rounded-xl bg-slate-800 px-6 py-3 font-bold text-white">
          স্টুডেন্ট লগইন করুন
        </Link>
      </div>
    );
  }

  if (stage === "loading") return <Loader label="পরীক্ষা প্রস্তুত হচ্ছে…" />;

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
        <Link to="/student" className="mt-4 inline-block rounded-xl bg-slate-800 px-6 py-3 font-bold text-white">
          পোর্টালে ফিরুন
        </Link>
      </div>
    );
  }

  if (stage === "submitting") return <Loader label="উত্তর জমা হচ্ছে…" />;

  if (stage === "result" && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-center shadow-sm">
          <p className="font-display text-lg font-semibold text-slate-800">
            {examType === "live" ? "লাইভ এমসিকিউ" : `${ordinalBn(result.ordinal)} মক টেস্টে`} প্রাপ্ত নম্বর
          </p>
          <p className="mt-2 font-display text-5xl font-extrabold text-emerald-600">
            {result.score} <span className="text-2xl text-slate-400">/ {result.total}</span>
          </p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-slate-800">সম্পূর্ণ বিশ্লেষণ</h2>
        <div className="mt-4 space-y-3">
          {result.details && result.details.map((d, i) => (
            <div
              key={d.id || i}
              className={`rounded-xl border p-4 ${
                d.isCorrect ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
              }`}
            >
              <p className="font-semibold text-slate-800">
                {i + 1}. {d.question}
              </p>
              <div className="mt-2 space-y-1">
                {d.options && d.options.map((opt) => {
                  const wasSelected = d.selectedTexts && d.selectedTexts.includes(opt);
                  const isCorrectOpt = opt === d.correctText;
                  return (
                    <div
                      key={opt}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        isCorrectOpt
                          ? "border-emerald-400 bg-emerald-100/50 font-semibold text-emerald-800"
                          : wasSelected
                          ? "border-rose-400 bg-rose-100/50 text-rose-800"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {opt}
                      {isCorrectOpt && " ✓ সঠিক উত্তর"}
                      {wasSelected && !isCorrectOpt && " — আপনার উত্তর"}
                    </div>
                  );
                })}
              </div>
              {d.explanation && <p className="mt-2 text-xs text-slate-500">ব্যাখ্যা: {d.explanation}</p>}
            </div>
          ))}
        </div>

        {onFinished ? (
          <button onClick={onFinished} className="mt-8 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white">
            পরবর্তী ধাপ: অনুধাবনমূলক পরীক্ষা শুরু করুন →
          </button>
        ) : (
          <Link to="/student" className="mt-8 inline-block rounded-xl bg-slate-800 px-6 py-3 font-bold text-white">
            পোর্টালে ফিরুন
          </Link>
        )}
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeUp = secondsLeft <= 300;

  return (
    <div
      className="min-h-screen bg-slate-50 pb-24 select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`sticky top-0 z-35 flex items-center justify-between px-4 py-2 font-bold text-white ${
          timeUp ? "bg-rose-600" : "bg-slate-900"
        }`}
      >
        <span>{examType === "live" ? "লাইভ পরীক্ষা — এমসিকিউ" : "এমসিকিউ মক টেস্ট"}</span>
        <span className="tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <p className="mx-auto mt-3 max-w-2xl px-4 text-xs text-slate-500">
        একটি অপশন সিলেক্ট করলে সেটি যোগ হবে। একাধিক অপশন সিলেক্ট করলে উত্তর ভুল হিসেবে গণ্য হতে পারে।
      </p>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {questions.map((q, i) => (
          <div key={q.id || i} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="font-semibold text-slate-800">
              {i + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options && q.options.map((opt) => {
                const selected = (answers[q.id] || []).includes(opt);
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition cursor-pointer ${
                      selected ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-amber-500"
                      checked={selected}
                      onChange={() => toggleOption(q.id, opt)}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => submitExam({ autoSubmitted: false })}
          className="w-full rounded-xl bg-rose-600 px-6 py-3 font-bold text-white shadow hover:bg-rose-700 transition"
        >
          পরীক্ষা জমা দিন
        </button>
      </div>

      {security.warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-lg font-bold text-rose-600">⚠ সতর্কতা</p>
            <p className="mt-2 text-sm text-slate-700">{security.warning.message}</p>
            {!security.warning.final && (
              <button
                onClick={security.dismissWarning}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2 font-bold text-white"
              >
                বুঝেছি, চালিয়ে যাই
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}