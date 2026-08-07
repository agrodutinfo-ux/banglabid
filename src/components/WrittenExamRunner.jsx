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

/** ছবি Google Drive-এ আপলোড হতে দেরি হওয়ার প্রধান কারণ ফোনের ক্যামেরার আসল ছবি
 *  অনেক বড় (কয়েক MB) হয় — এটাকে ব্রাউজারেই ছোট করে (সর্বোচ্চ ১৪০০px চওড়া,
 *  JPEG quality 0.72) নেটওয়ার্কে পাঠানো হয়, যাতে আপলোড অনেক দ্রুত হয়। */
function compressImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1400;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** ছবি তোলা/আপলোডের জন্য দুইটা আলাদা বাটন — কিছু ফোনে "capture" দেওয়া থাকলে
 *  ক্যামেরা খোলে না (শুধু ফাইল/গ্যালারি কাজ করে), আবার কিছু ফোনে সম্মিলিত
 *  চুজার ব্যবহার করলে সমস্যা দেখা যায় — তাই দুইটা সম্পূর্ণ আলাদা <input>
 *  হিসেবে রাখা হয়েছে যাতে একটা কাজ না করলেও অন্যটা দিয়ে চালানো যায়। */
function PhotoPicker({ onFile }) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-marigold)] bg-[var(--color-marigold)]/10 px-4 py-4 font-display text-sm font-bold text-[var(--color-marigold-dark)] transition hover:bg-[var(--color-marigold)]/20">
        📷 ক্যামেরা দিয়ে ছবি তুলুন
        <input type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
      </label>
      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-bluepen)] bg-[var(--color-bluepen)]/10 px-4 py-4 font-display text-sm font-bold text-[var(--color-bluepen)] transition hover:bg-[var(--color-bluepen)]/20">
        🖼️ গ্যালারি থেকে বাছাই করুন
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
      </label>
    </div>
  );
}

export default function WrittenExamRunner({ examType = "mock", kind = "written", onFinished }) {
  const token = localStorage.getItem("banglabid_student_token");
  const minutes = MINUTES[kind] || 30;
  const isSpelling = kind === "spelling";

  const [stage, setStage] = useState("loading");
  const [error, setError] = useState("");
  const [sets, setSets] = useState([]);
  const [images, setImages] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [submitProgress, setSubmitProgress] = useState({ done: 0, total: 0 });

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

  async function handleFile(setId, file) {
    if (!file) return;
    const rawDataUrl = await fileToBase64(file);
    const dataUrl = await compressImage(rawDataUrl);
    setImages((prev) => ({ ...prev, [setId]: { dataUrl, mimeType: "image/jpeg" } }));
  }

  function clearImage(setId) {
    setImages((prev) => {
      const next = { ...prev };
      delete next[setId];
      return next;
    });
  }

  async function submitAll() {
    if (stageRef.current !== "exam") return;
    setStage("submitting");

    const entries = setsRef.current
      .map((set) => ({ set, image: imagesRef.current[set.id] }))
      .filter((e) => e.image && (e.set.subQuestions || []).length > 0);

    setSubmitProgress({ done: 0, total: entries.length });
    try {
      for (const { set, image } of entries) {
        const items = (set.subQuestions || []).map((sq) => ({
          writtenQuestionId: sq.writtenQuestionId,
          subQuestionId: sq.id,
          subQuestionText: sq.text,
          points: sq.points,
        }));
        await api.submitWrittenAnswersBatch({
          token,
          examType,
          kind,
          sessionId: sessionIdRef.current,
          items,
          imageBase64: image.dataUrl,
          mimeType: image.mimeType,
        });
        setSubmitProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      setStage("done");
    } catch {
      setError("কিছু উত্তর জমা দেওয়া যায়নি — ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
      setStage("exam");
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

  if (stage === "submitting") {
    return (
      <Loader full label={submitProgress.total ? `জমা হচ্ছে… (${submitProgress.done}/${submitProgress.total})` : "জমা হচ্ছে…"} />
    );
  }

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
  const answeredSets = sets.filter((s) => images[s.id]).length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] pb-24">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[var(--color-ink)] px-4 py-2 font-display font-bold text-white">
        <span>{TITLE[kind]}</span>
        <span className="tabular-nums">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
      </div>

      <p className="mx-auto mt-3 max-w-2xl px-4 text-xs text-[var(--color-text)]/60">
        {isSpelling
          ? "সবগুলো বানানের উত্তর একই পৃষ্ঠায় লিখে একটাই ছবি তুলুন/আপলোড করুন।"
          : "একটা উদ্দীপকের সবগুলো প্রশ্নের উত্তর একই পৃষ্ঠায় (বা টানা কয়েক পৃষ্ঠায়) লিখে তার একটাই ছবি তুলুন/আপলোড করুন।"}{" "}
        এখানে MCQ-এর মতো কঠোর সিকিউরিটি নেই। উত্তরপত্র জমা: {answeredSets}/{sets.length}
      </p>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4">
        {sets.map((set) => (
          <div key={set.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            {set.passageHtml && (
              <div className="mb-3 rounded-lg bg-[var(--color-paper)] p-3 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: set.passageHtml }} />
            )}

            <ol className="list-decimal space-y-1 pl-5">
              {(set.subQuestions || []).map((sq) => (
                <li key={sq.id} className="font-semibold text-[var(--color-ink)]">
                  {isSpelling ? sq.text : <span dangerouslySetInnerHTML={{ __html: sq.text }} />}{" "}
                  <span className="text-xs font-normal text-[var(--color-text)]/50">({sq.points} নম্বর)</span>
                </li>
              ))}
            </ol>

            {!images[set.id] ? (
              <PhotoPicker onFile={(file) => handleFile(set.id, file)} />
            ) : (
              <div className="relative mt-3 inline-block">
                <img src={images[set.id].dataUrl} alt="উত্তরের প্রিভিউ" className="max-h-64 rounded-lg border border-[var(--color-paper-line)]" />
                <button
                  type="button"
                  onClick={() => clearImage(set.id)}
                  title="ছবি বাদ দিয়ে আবার তুলুন"
                  className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-redpen)] font-bold text-white shadow-md"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}

        {error && <p className="rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">{error}</p>}

        <button onClick={submitAll} className="w-full rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white">
          সবগুলো জমা দিন
        </button>
      </div>
    </div>
  );
}