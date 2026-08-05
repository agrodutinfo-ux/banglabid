import { useState } from "react";
import { api } from "../lib/api";
import Loader from "../components/Loader";

const LABELS = {
  pending: { text: "পেন্ডিং", cls: "bg-[var(--color-marigold)]/20 text-[var(--color-marigold-dark)]" },
  confirmed: { text: "কনফার্মড", cls: "bg-[var(--color-greenpen)]/15 text-[var(--color-greenpen)]" },
  rejected: { text: "রিজেক্টেড", cls: "bg-[var(--color-redpen)]/15 text-[var(--color-redpen)]" },
};

export default function CheckStatus() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api.checkStatus(phone, email);
      if (res.ok) {
        setResult(res.data);
      } else {
        setError(res.message || "কোনো নিবন্ধন পাওয়া যায়নি।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">নিবন্ধন স্ট্যাটাস</h1>
      <p className="mt-1 text-sm text-[var(--color-text)]/70">
        মোবাইল নম্বর ও ইমেইল দিয়ে আপনার নিবন্ধনের অবস্থা দেখুন।
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className="input" placeholder="মোবাইল নম্বর" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white"
        >
          স্ট্যাটাস দেখুন
        </button>
      </form>

      {loading && <Loader label="খোঁজা হচ্ছে…" />}

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-[var(--color-paper-line)] bg-white/60 p-5">
          <p className="font-display font-bold text-[var(--color-ink)]">{result.name}</p>
          <p className="mt-1 text-sm text-[var(--color-text)]/70">
            {result.className} শ্রেণি · {result.school} · {result.division}
          </p>
          <span
            className={`mt-3 inline-block rounded-full px-4 py-1 font-display text-sm font-bold ${LABELS[result.status]?.cls}`}
          >
            {LABELS[result.status]?.text || result.status}
          </span>
          {result.status === "rejected" && result.note && (
            <p className="mt-3 text-sm text-[var(--color-redpen)]">কারণ: {result.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
