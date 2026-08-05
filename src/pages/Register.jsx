import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Loader from "../components/Loader";

const DIVISIONS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "সিলেট",
  "রংপুর",
  "ময়মনসিংহ",
  "কুমিল্লা",
];

const CLASSES = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];

const empty = {
  name: "",
  className: "",
  school: "",
  division: "",
  phone: "",
  email: "",
  password: "",
  bkashSender: "",
  transactionId: "",
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPhoneLike = (key) => (e) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setForm((f) => ({ ...f, [key]: digitsOnly }));
  };

  function validateStep1() {
    if (!form.name || !form.className || !form.school || !form.division || !form.phone || !form.email || !form.password) {
      return "সব ঘর পূরণ করুন।";
    }
    if (!/^01[0-9]{9}$/.test(form.phone)) {
      return "সঠিক মোবাইল নম্বর দিন (১১ ডিজিট, ০১ দিয়ে শুরু)।";
    }
    if (form.password.length < 4) {
      return "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।";
    }
    return "";
  }

  function goNext() {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep(2);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.bkashSender || !form.transactionId) {
      setError("বিকাশ নম্বর ও ট্রানজেকশন আইডি দিন।");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await api.register(form);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-[var(--color-greenpen)]/30 bg-[var(--color-greenpen)]/10 p-8">
          <h1 className="font-display text-2xl font-bold text-[var(--color-greenpen)]">
            রেজিস্ট্রেশন সম্পন্ন হয়েছে!
          </h1>
          <p className="mt-3 text-[var(--color-text)]/80">
            আপনার রেজিস্ট্রেশন এখন <b>পেন্ডিং</b> অবস্থায় আছে। পেমেন্ট যাচাই হলে অ্যাডমিন এটি
            কনফার্ম করবেন। স্ট্যাটাস পেজে গিয়ে যেকোনো সময় দেখে নিতে পারবেন।
          </p>
          <button
            onClick={() => navigate("/status")}
            className="mt-6 rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white"
          >
            স্ট্যাটাস দেখুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">রেজিস্ট্রেশন ফর্ম</h1>
      <p className="mt-1 text-sm text-[var(--color-text)]/70">
        ধাপ {step} / ২ — {step === 1 ? "শিক্ষার্থীর তথ্য" : "পেমেন্ট নিশ্চিতকরণ"}
      </p>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-paper-line)]">
        <div
          className="h-full bg-[var(--color-marigold)] transition-all"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">
          {error}
        </p>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNext();
          }}
          className="mt-6 space-y-4"
        >
          <Field label="শিক্ষার্থীর নাম (বাংলায়)">
            <input className="input" required value={form.name} onChange={set("name")} placeholder="যেমনঃ রিয়ন খান" />
          </Field>
          <Field label="শ্রেণি">
            <select className="input" required value={form.className} onChange={set("className")}>
              <option value="">নির্বাচন করুন</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="বিদ্যালয়ের নাম">
            <input className="input" required value={form.school} onChange={set("school")} placeholder="যেমনঃ জামালপুর জিলা স্কুল" />
          </Field>
          <Field label="বিভাগ">
            <select className="input" required value={form.division} onChange={set("division")}>
              <option value="">নির্বাচন করুন</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="মোবাইল নম্বর">
            <input
              className="input"
              required
              value={form.phone}
              onChange={setPhoneLike("phone")}
              placeholder="০১XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
            />
          </Field>
          <Field label="ইমেইল">
            <input className="input" required type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </Field>
          <Field label="পাসওয়ার্ড (পরবর্তীতে লগইনের জন্য)">
            <input className="input" required type="password" value={form.password} onChange={set("password")} />
          </Field>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display text-base font-bold text-white transition hover:brightness-110"
          >
            পরবর্তী ধাপ →
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="rounded-xl border border-[var(--color-marigold)]/40 bg-[var(--color-marigold)]/10 p-4 text-sm leading-relaxed">
            নিচের বিকাশ নম্বরে{" "}
            <span className="font-display text-base font-bold text-[var(--color-ink)]">০১৭১০১৭৬৩০১</span>{" "}
            নির্দিষ্ট পরিমাণ টাকা <b>Send Money</b> করুন, তারপর যে নম্বর থেকে টাকা পাঠিয়েছেন
            সেটি ও ট্রানজেকশন আইডি নিচে লিখে জমা দিন। পেমেন্ট যাচাইয়ের পর রেজিস্ট্রেশন কনফার্ম
            করা হবে।
          </div>

          <Field label="আপনার বিকাশ নম্বর (যেটি থেকে টাকা পাঠিয়েছেন)">
            <input
              className="input"
              required
              value={form.bkashSender}
              onChange={setPhoneLike("bkashSender")}
              placeholder="০১XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
            />
          </Field>
          <Field label="ট্রানজেকশন আইডি (Transaction ID)">
            <input className="input" required value={form.transactionId} onChange={set("transactionId")} placeholder="যেমনঃ 9F7A2XYZ1" />
          </Field>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border-2 border-[var(--color-ink)] px-5 py-3 font-display font-bold text-[var(--color-ink)]"
            >
              ← পেছনে
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "জমা হচ্ছে…" : "রেজিস্ট্রেশন সম্পন্ন করুন"}
            </button>
          </div>
          {submitting && <Loader label="তথ্য জমা হচ্ছে…" />}
        </form>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">{label}</span>
      {children}
    </label>
  );
}
