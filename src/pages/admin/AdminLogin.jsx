import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import Loader from "../../components/Loader";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.adminLogin(username, password);
      if (res.ok) {
        localStorage.setItem("banglabid_admin_token", res.data.token);
        navigate("/system-3212/admin-panel");
      } else {
        setError(res.message || "ভুল ইউজারনেম বা পাসওয়ার্ড।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-[var(--color-paper)] p-8 shadow-2xl">
        <img src="/images/agrodut-logo.png" alt="অগ্রদূত" className="mx-auto h-16 w-16 rounded-full object-cover" />
        <h1 className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">অ্যাডমিন লগইন</h1>
        <p className="mt-1 text-sm text-[var(--color-text)]/70">বাংলাবিদ অ্যাডমিন প্যানেল</p>

        {error && (
          <p className="mt-4 rounded-lg bg-[var(--color-redpen)]/10 px-3 py-2 text-sm text-[var(--color-redpen)]">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-3">
          <input className="input" placeholder="ইউজারনেম" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="input" type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-[var(--color-marigold)] px-6 py-3 font-display font-bold text-[var(--color-ink-dark)] disabled:opacity-60"
        >
          {loading ? "লগইন হচ্ছে…" : "লগইন করুন"}
        </button>
        {loading && <Loader />}
      </form>
    </div>
  );
}
