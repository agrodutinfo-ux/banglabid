import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Loader from "../components/Loader";

const MINUTES = { written: 30, spelling: 20 };
const TITLE = { written: "অনুধাবনমূলক পরীক্ষা", spelling: "বিভাগীয় সেরা ২০ বানান প্রতিযোগিতা" };

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WrittenExamRunner({ examType = "mock", kind = "written", onFinished }) {
  const token = localStorage.getItem("banglabid_student_token");
  const minutes = MINUTES[kind] || 30;

  const [stage, setStage] = useState("loading"); // loading -> exam -> submitting -> done -> error
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sets, setSets] = useState([]);
  const [images, setImages] = useState({}); // { [subQuestionId]: { dataUrl, mimeType } }
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

  const stageRef = useRef("loading");
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const setsRef = useRef(sets);
  setsRef.current = sets;
  const sessionIdRef = useRef("");

  useEffect(() => {
    if (!token) return;
    api
      .startWrittenExam(token, examType, kind)
      .then((res) => {
        if (res.ok) {
          setSessionId(res.data.sessionId);
          sessionIdRef.current = res.data.sessionId;
          setSets(res.data.sets);
          setSecondsLeft(minutes * 60);
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
  }, []);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (stage !== "exam") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          submitAll();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function handleFile(subQ, file) {
    if (!file) return;
    const dataUrl = await fileToBase64(file);
    setImages((prev) => ({ ...prev, [subQ.id]: { dataUrl, mimeType: file.type, subQ } }));
  }

  async function submitAll() {
    if (stageRef.current !== "exam") return;
    setStage("submitting");
    const entries = Object.values(imagesRef.current);
    try {
      for (const entry of entries) {
        await api.submitWrittenAnswer({
          token,
          examType,
          kind,
          sessionId: sessionIdRef.current,
          writtenQuestionId: entry.subQ.writtenQuestionId,
          subQuestionId: entry.subQ.id,
          subQuestionText: entry.subQ.text,
          points: entry.subQ.points,
          imageBase64: entry.dataUrl,
          mimeType: entry.mimeType,
        });
      }
      setStage("done");
    } catch {
      setError("কিছু উত্তর জমা দেওয়া যায়নি — ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
      setStage("exam"); // উত্তরগুলো এখনো আছে, আবার Submit চাপা যাবে
    }
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

  if (stage === "loading") return <Loader full label="প্রশ্ন প্রস্তুত হচ্ছে…" />;

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-lg bg-[var(--color-redpen)]/10 px-4 py-3 text-sm font-medium text-[var(--color-redpen)]">{error}</p>
        <Link to="/student" className="mt-4 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          পোর্টালে ফিরুন
        </Link>
      </div>
    );
  }

  if (stage === "submitting") return <Loader full label="খাতা জমা হচ্ছে…" />;

  if (stage === "done") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-2xl font-bold text-[var(--color-greenpen)]">খাতা জমা হয়েছে ✓</p>
        <p className="mt-2 text-sm text-[var(--color-text)]/70">
          আপনার উত্তর মূল্যায়নের অপেক্ষায় আছে (পেন্ডিং)। মূল্যায়ন শেষ হলে পোর্টালে ফলাফল দেখতে পারবেন।
        </p>
        {onFinished ? (
          <button onClick={onFinished} className="mt-6 rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
            পরীক্ষা সম্পন্ন করুন →
          </button>
        ) : (
          <Link to="/student" className="mt-6 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
            পোর্টালে ফিরুন
          </Link>
        )}
      </div>
    );
  }

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const answeredCount = Object.keys(images).length;
  const totalCount = sets.reduce((n, s) => n + (s.subQuestions || []).length, 0);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] pb-24">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[var(--color-ink)] px-4 py-2 font-display font-bold text-white">
        <span>{TITLE[kind]}</span>
        <span className="tabular-nums">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
      </div>

      <p className="mx-auto mt-3 max-w-2xl px-4 text-xs text-[var(--color-text)]/60">
        উত্তরপত্র খাতায় লিখে ক্যামেরা দিয়ে ছবি তুলুন অথবা গ্যালারি থেকে আপলোড করুন। এখানে
        MCQ-এর মতো কঠোর সিকিউরিটি নেই। উত্তর দেওয়া: {answeredCount}/{totalCount}
      </p>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4">
        {sets.map((set, si) => (
          <div key={set.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            {set.passageHtml && (
              <div
                className="mb-3 rounded-lg bg-[var(--color-paper)] p-3 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: set.passageHtml }}
              />
            )}
            <div className="space-y-4">
              {(set.subQuestions || []).map((sq, qi) => (
                <div key={sq.id} className="border-t border-dashed border-[var(--color-paper-line)] pt-3 first:border-t-0 first:pt-0">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {kind === "spelling" ? `${qi + 1 + si * (set.subQuestions?.length || 0)}. ` : `${qi + 1}. `}
                    {sq.text} <span className="text-xs font-normal text-[var(--color-text)]/50">({sq.points} নম্বর)</span>
                  </p>
                  <label className="mt-2 block">
                    <span className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">উত্তরের ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFile(sq, e.target.files?.[0])}
                      className="block w-full text-xs"
                    />
                  </label>
                  {images[sq.id] && (
                    <img src={images[sq.id].dataUrl} alt="উত্তরের প্রিভিউ" className="mt-2 max-h-40 rounded-lg border border-[var(--color-paper-line)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p className="rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">{error}</p>
        )}

        <button
          onClick={submitAll}
          className="w-full rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white"
        >
          সবগুলো জমা দিন
        </button>
      </div>
    </div>
  );
}
