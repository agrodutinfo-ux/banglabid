import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toDirectImageUrl } from "../lib/image";
import CountdownBanner from "../components/CountdownBanner";
import PunchHoles from "../components/PunchHoles";
import Loader from "../components/Loader";

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((res) => setSettings(res.data || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {settings && (
        <CountdownBanner
          price={settings.price}
          deadline={settings.discountDeadline}
          maintenanceMode={settings.maintenanceMode}
        />
      )}

      <section className="relative overflow-hidden">
        <div className="margin-rule paper-lines mx-auto max-w-5xl px-4 py-14 md:py-20">
          <PunchHoles />
          <div className="grid items-center gap-10 pl-6 md:grid-cols-2 md:pl-16">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-tight text-[var(--color-ink)] md:text-5xl">
                অগ্রদূত বাংলাবিদ
              </h1>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--color-marigold-dark)]">
                প্রস্তুতি মডেল টেস্ট কোর্স
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]/90 md:text-lg">
                ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের জন্য বাংলাবিদ এর আদলে তৈরি পরিপূর্ণ মডেল টেস্ট 
                কোর্স। বহু নির্বাচনী ও লিখিত মক টেস্ট, লাইভ পরীক্ষা, বিভাগীয় সেরা ২০ লাইভ মক, 
                বিস্তারিত বিশ্লেষণ ও র‍্যাঙ্কিং — সবকিছু এক জায়গায়।
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white shadow-lg shadow-[var(--color-redpen)]/20 transition hover:brightness-110 active:scale-95"
                >
                  এখনই নিবন্ধন করুন
                </Link>
                <Link
                  to="/status"
                  className="rounded-xl bg-[var(--color-marigold)] px-6 py-3 font-display text-base font-bold text-[var(--color-ink-dark)] shadow-lg shadow-[var(--color-marigold)]/30 transition hover:brightness-110 active:scale-95"
                >
                  নিবন্ধন স্ট্যাটাস দেখুন
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 border-white bg-[var(--color-ink)] shadow-2xl">
                {settings?.courseImageUrl ? (
                  <img
                    src={toDirectImageUrl(settings.courseImageUrl)}
                    alt="বাংলাবিদ কোর্স"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-paper)]/70">
                    <span className="font-display text-5xl">বাংলাবিদ</span>
                    <span className="text-sm">কোর্স প্লান লোড হচ্ছে</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-4 -left-4 rotate-[-4deg] rounded-lg bg-[var(--color-marigold)] px-4 py-2 font-display text-sm font-bold text-[var(--color-ink-dark)] shadow-lg">
                {loading ? "মূল্য লোড হচ্ছে…" : settings?.price ? `৳${settings.price} টাকায়` : "ফ্রি"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
          কোর্সে যা যা থাকছে
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["আনলিমিটেড মক টেস্ট", "যতবার ইচ্ছা অনুশীলন , কোনো সীমা নেই।"],
            ["আসল পরীক্ষার অনুরূপ", "প্রশ্নের মান ও ধরন হুবহু আসল পরীক্ষার অনুরূপ"],
            ["লাইভ পরীক্ষা", "নির্দিষ্ট সময়ে সবার সাথে প্রতিযোগিতামূলক পরীক্ষা ও র‍্যাঙ্কিং"],
            ["অভিজ্ঞ মেন্টর দ্বারা মূল্যায়ন", "লিখিত খাতা সরাসরি অভিজ্ঞ মেন্টরদের দ্বারা মূল্যায়ন"],
            ["সারা দেশের মেরিট", "সারা দেশের শিক্ষার্থীদের সাথে নিজের অবস্থান যাচাই"],
            ["বিভাগীয় সেরা ২০", "বিভাগীয় সেরা ২০ প্রস্তুতির জন্য বিশেষ লাইভ মক টেস্ট"],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--color-paper-line)] bg-white/60 p-5 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text)]/80">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-dashed border-[var(--color-paper-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text)]/70">
            বহুনির্বাচনি মক টেস্ট, অনুধাবনমূলক পরীক্ষা, বিভাগীয় সেরা ২০ বানান প্রতিযোগিতা ও লাইভ পরীক্ষা
            — সবই এখন চালু আছে। স্টুডেন্ট লগইন করে পোর্টাল থেকে অংশ নিন।
          </p>
          <Link
            to="/student/login"
            className="shrink-0 rounded-xl bg-[var(--color-ink)] px-5 py-2.5 font-display text-sm font-bold text-white transition hover:brightness-110"
          >
            স্টুডেন্ট লগইন
          </Link>
        </div>
      </section>
    </div>
  );
}