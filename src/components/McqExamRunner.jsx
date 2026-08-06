import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useExamSecurity } from "../hooks/useExamSecurity";
import Loader from "../components/Loader";

const EXAM_MINUTES = 40;
const ORDINALS = ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
function ordinalBn(n) {
  return ORDINALS[n - 1] || `${n}তম`;
}

/**
 * MCQ পরীক্ষা চালায় — মক অথবা লাইভ দুটোতেই ব্যবহারযোগ্য।
 * onFinished দিলে (লাইভ পরীক্ষার সিকোয়েন্সে ব্যবহারের জন্য) ফলাফল দেখানোর পর
 * "পরবর্তী ধাপ" বাটনে ক্লিক করলে সেটা কল হয়; না দিলে সরাসরি পোর্টালের লিংক দেখানো হয়।
 */
export default function McqExamRunner({ examType = "mock", onFinished }) {
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
    if (!token) return;
    api
      .startMcqExam(token, examType)
      .then((res) => {
        if (res.ok) {
          setQuestions(res.data.questions);
          setSecondsLeft(EXAM_MINUTES * 60);
          setAnswers({});
          setStage("exam");
        } else {
          setError(res.message || "পরীক্ষা শুরু করা যায়নি।");
          setStage("error");
        }
      })
      .catch(() => {
        setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
        setStage("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType]);

  async function submitExam({ autoSubmitted = false } = {}) {
    if (stageRef.current !== "exam" || submittingRef.current) return;
    submittingRef.current = true;
    lastAutoSubmitFlagRef.current = autoSubmitted;
    setStage("submitting");
    security.exitSecurityMode();

    const payload = questionsRef.current.map((q) => ({
      id: q.id,
      selectedTexts: answersRef.current[q.id] || [],
    }));
    try {
      const res = await api.submitMcqExam({
        token,
        examType,
        answers: payload,
        violations: security.violations,
        autoSubmitted,
      });
      if (res.ok) {
        setResult(res.data);
        setStage("result");
      } else {
        setError(res.message || "জমা দেওয়া যায়নি।");
        setStage("submit-failed");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি — ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
      setStage("submit-failed");
    } finally {
      submittingRef.current = false;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Link to="/student/login" className="rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          স্টুডেন্ট লগইন করুন
        </Link>
      </div>
    );
  }

  if (stage === "loading") return <Loader full label="পরীক্ষা প্রস্তুত হচ্ছে…" />;

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-lg bg-[var(--color-redpen)]/10 px-4 py-3 text-sm font-medium text-[var(--color-redpen)]">
          {error}
        </p>
        <Link to="/student" className="mt-4 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          পোর্টালে ফিরুন
        </Link>
      </div>
    );
  }

  if (stage === "submitting") return <Loader full label="উত্তর জমা হচ্ছে…" />;

  if (stage === "submit-failed") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-lg font-bold text-[var(--color-redpen)]">জমা দেওয়া যায়নি</p>
        <p className="mt-2 rounded-lg bg-[var(--color-redpen)]/10 px-4 py-3 text-sm font-medium text-[var(--color-redpen)]">
          {error}
        </p>
        <p className="mt-3 text-sm text-[var(--color-text)]/70">
          আপনার উত্তরগুলো এখনো সংরক্ষিত আছে — নিচের বাটনে চাপ দিয়ে আবার জমা দেওয়ার চেষ্টা করুন।
        </p>
        <button onClick={retrySubmit} className="mt-5 rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          আবার জমা দিন
        </button>
      </div>
    );
  }

  if (stage === "result" && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-paper-line)] bg-white/70 p-6 text-center">
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
            {examType === "live" ? "লাইভ বহুনির্বাচনি" : `${ordinalBn(result.ordinal)} মক টেস্টে`} প্রাপ্ত নম্বর
          </p>
          <p className="mt-2 font-display text-5xl font-extrabold text-[var(--color-greenpen)]">
            {result.score} <span className="text-2xl text-[var(--color-text)]/60">/ {result.total}</span>
          </p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-[var(--color-ink)]">সম্পূর্ণ বিশ্লেষণ</h2>
        <div className="mt-4 space-y-3">
          {result.details.map((d, i) => (
            <div
              key={d.id}
              className={`rounded-xl border p-4 ${
                d.isCorrect
                  ? "border-[var(--color-greenpen)]/30 bg-[var(--color-greenpen)]/5"
                  : "border-[var(--color-redpen)]/30 bg-[var(--color-redpen)]/5"
              }`}
            >
              <p className="font-semibold text-[var(--color-ink)]">
                {i + 1}. {d.question}
              </p>
              <div className="mt-2 space-y-1">
                {d.options.map((opt) => {
                  const wasSelected = d.selectedTexts.includes(opt);
                  const isCorrectOpt = opt === d.correctText;
                  return (
                    <div
                      key={opt}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        isCorrectOpt
                          ? "border-[var(--color-greenpen)] bg-[var(--color-greenpen)]/10 font-semibold text-[var(--color-greenpen)]"
                          : wasSelected
                          ? "border-[var(--color-redpen)] bg-[var(--color-redpen)]/10 text-[var(--color-redpen)]"
                          : "border-[var(--color-paper-line)] text-[var(--color-text)]/70"
                      }`}
                    >
                      {opt}
                      {isCorrectOpt && " ✓ সঠিক উত্তর"}
                      {wasSelected && !isCorrectOpt && " — আপনার উত্তর"}
                    </div>
                  );
                })}
                {d.selectedTexts.length === 0 && (
                  <p className="text-xs text-[var(--color-redpen)]">উত্তর দেওয়া হয়নি — ভুল হিসেবে গণ্য হয়েছে।</p>
                )}
              </div>
              {d.explanation && <p className="mt-2 text-xs text-[var(--color-text)]/60">ব্যাখ্যা: {d.explanation}</p>}
            </div>
          ))}
        </div>

        {onFinished ? (
          <button onClick={onFinished} className="mt-8 rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
            পরবর্তী ধাপ: অনুধাবনমূলক পরীক্ষা শুরু করুন →
          </button>
        ) : (
          <Link to="/student" className="mt-8 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
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
      className="min-h-screen bg-[var(--color-paper)] pb-24 select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`sticky top-0 z-30 flex items-center justify-between px-4 py-2 font-display font-bold text-white ${
          timeUp ? "bg-[var(--color-redpen)]" : "bg-[var(--color-ink)]"
        }`}
      >
        <span>{examType === "live" ? "লাইভ পরীক্ষা — বহুনির্বাচনি" : "বহুনির্বাচনি মক টেস্ট"}</span>
        <span className="tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <p className="mx-auto mt-3 max-w-2xl px-4 text-xs text-[var(--color-text)]/60">
        একটা অপশন সিলেক্ট করলে সেটা আর বাতিল করা যাবে না। একাধিক অপশন সিলেক্ট করলে সেই প্রশ্নের
        উত্তর ভুল হিসেবে গণ্য হবে।
      </p>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            <p className="font-semibold text-[var(--color-ink)]">
              {i + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => {
                const selected = (answers[q.id] || []).includes(opt);
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      selected ? "border-[var(--color-marigold)] bg-[var(--color-marigold)]/15" : "border-[var(--color-paper-line)] cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[var(--color-marigold)]"
                      checked={selected}
                      disabled={selected}
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
          className="w-full rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white"
        >
          পরীক্ষা জমা দিন
        </button>
      </div>

      {security.warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="font-display text-lg font-bold text-[var(--color-redpen)]">⚠ সতর্কতা</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{security.warning.message}</p>
            {!security.warning.final && (
              <button
                onClick={() => {
                  security.dismissWarning();
                  security.requestFullscreen();
                }}
                className="mt-4 rounded-xl bg-[var(--color-ink)] px-5 py-2 font-display font-bold text-white"
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
