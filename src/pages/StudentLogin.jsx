import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Loader from "../components/Loader";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.studentLogin(email, password);
      if (res.ok) {
        localStorage.setItem("banglabid_student_token", res.data.token);
        navigate("/student");
      } else {
        setError(res.message || "ভুল ইমেইল বা পাসওয়ার্ড।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">স্টুডেন্ট লগইন</h1>
      <p className="mt-1 text-sm text-[var(--color-text)]/70">
        নিবন্ধনের সময় দেওয়া ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className="input" required type="email" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" required type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
        >
          {loading ? "লগইন হচ্ছে…" : "লগইন করুন"}
        </button>
        {loading && <Loader />}
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-text)]/60">
        এখনো নিবন্ধন করেননি? <a href="/register" className="font-semibold text-[var(--color-bluepen)]">এখানে নিবন্ধন করুন</a>
      </p>
    </div>
  );
}
