import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Loader from "../components/Loader";

export default function Leaderboard() {
  const [examType, setExamType] = useState("live");
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    api.leaderboard(examType).then((res) => setRows(res.ok ? res.data : []));
  }, [examType]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">মেরিট তালিকা</h1>

      <div className="mt-4 flex gap-2">
        {[
          ["live", "লাইভ পরীক্ষা"],
          ["mock", "মক টেস্ট (সর্বোচ্চ স্কোর)"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setExamType(key)}
            className={`rounded-full px-4 py-1.5 font-display text-sm font-bold ${
              examType === key ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {rows === null && <Loader label="তালিকা লোড হচ্ছে…" />}
        {rows && rows.length === 0 && <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো ফলাফল নেই।</p>}
        {rows &&
          rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-3">
              <div className="flex items-center gap-3">
                <span className="font-display w-7 text-center font-bold text-[var(--color-marigold-dark)]">{i + 1}</span>
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{r.name}</p>
                  <p className="text-xs text-[var(--color-text)]/60">
                    {r.className} শ্রেণি · {r.school} · {r.division}
                  </p>
                </div>
              </div>
              <span className="font-display font-bold text-[var(--color-ink)]">
                {r.score}/{r.total}
              </span>
            </div>
          ))}
      </div>

      <Link to="/student" className="mt-8 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
        পোর্টালে ফিরুন
      </Link>
    </div>
  );
}
