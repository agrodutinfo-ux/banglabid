import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Loader from "../components/Loader";

const EXAM_TYPE_LABEL = { mock: "মক টেস্ট", live: "লাইভ টেস্ট" };
const KIND_LABEL = { written: "অনুধাবনমূলক পরীক্ষা", spelling: "বানান প্রতিযোগিতা" };

export default function StudentPortal() {
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [writtenAttempts, setWrittenAttempts] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("banglabid_student_token");

  useEffect(() => {
    if (!token) {
      navigate("/student/login");
      return;
    }
    api.studentMe(token).then((res) => {
      if (!res.ok) {
        localStorage.removeItem("banglabid_student_token");
        navigate("/student/login");
        return;
      }
      setProfile(res.data);
    });
    api.studentNotices(token).then((res) => setNotices(res.ok ? res.data : []));
    api.studentAttempts(token).then((res) => setAttempts(res.ok ? res.data : []));
    api.studentWrittenAttempts(token).then((res) => setWrittenAttempts(res.ok ? res.data : []));
  }, [token, navigate]);

  function logout() {
    localStorage.removeItem("banglabid_student_token");
    navigate("/");
  }

  if (!profile) return <Loader full label="প্রোফাইল লোড হচ্ছে…" />;

  const confirmed = profile.status === "confirmed";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="flex items-center justify-between border-b border-[var(--color-paper-line)] bg-white/70 px-4 py-3">
        <div>
          <p className="font-display text-lg font-bold text-[var(--color-ink)]">{profile.name}</p>
          <p className="text-xs text-[var(--color-text)]/60">
            {profile.className} শ্রেণি · {profile.school}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/leaderboard" className="rounded-lg border-2 border-[var(--color-ink)] px-3 py-1.5 text-sm font-bold text-[var(--color-ink)]">
            মেরিট তালিকা
          </Link>
          <button onClick={logout} className="rounded-lg border-2 border-[var(--color-redpen)] px-3 py-1.5 text-sm font-bold text-[var(--color-redpen)]">
            লগআউট
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {!confirmed && (
          <div className="mb-6 rounded-xl border border-[var(--color-marigold)]/40 bg-[var(--color-marigold)]/10 p-4 text-sm text-[var(--color-marigold-dark)]">
            আপনার রেজিস্ট্রেশন এখনও কনফার্ম হয়নি ({profile.status === "rejected" ? "রিজেক্টেড" : "পেন্ডিং"})।
            কনফার্ম হওয়ার পর পরীক্ষা দিতে পারবেন।
          </div>
        )}

        {notices && notices.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="font-display font-bold text-[var(--color-ink)]">নোটিশ</h2>
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-[var(--color-bluepen)]/30 bg-[var(--color-bluepen)]/10 p-3 text-sm text-[var(--color-ink)]">
                {n.message}
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display font-bold text-[var(--color-ink)]">পরীক্ষা কেন্দ্র</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <ExamCard title="এমসিকিউ মক টেস্ট" enabled={confirmed} to="/exam/mcq" />
          <ExamCard title="অনুধাবনমূলক পরীক্ষা" enabled={confirmed} to="/exam/written" />
          <ExamCard title="বিভাগীয় সেরা ২০ বানান প্রতিযোগিতা" enabled={confirmed} to="/exam/spelling" />
          <ExamCard title="লাইভ পরীক্ষা" enabled={confirmed} to="/exam/live" />
        </div>

        <h2 className="mt-8 font-display font-bold text-[var(--color-ink)]">এমসিকিউ ফলাফল</h2>
        <div className="mt-3 space-y-2">
          {attempts === null && <Loader label="ফলাফল লোড হচ্ছে…" />}
          {attempts && attempts.length === 0 && (
            <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো এমসিকিউ পরীক্ষা দেননি।</p>
          )}
          {attempts &&
            attempts.map((a) => (
              <div key={a.id} className="rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-3 text-sm">
                {ordinalBn(a.ordinal)} {EXAM_TYPE_LABEL[a.examType] || a.examType}-এ প্রাপ্ত নম্বর:{" "}
                <span className="font-display font-bold text-[var(--color-ink)]">
                  {a.score}/{a.total}
                </span>
              </div>
            ))}
        </div>

        <h2 className="mt-8 font-display font-bold text-[var(--color-ink)]">অনুধাবনমূলক ও বানান ফলাফল</h2>
        <div className="mt-3 space-y-2">
          {writtenAttempts === null && <Loader label="ফলাফল লোড হচ্ছে…" />}
          {writtenAttempts && writtenAttempts.length === 0 && (
            <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো খাতা জমা দেননি।</p>
          )}
          {writtenAttempts && writtenAttempts.length > 0 && (
            <WrittenResultsList sessions={writtenAttempts} />
          )}
        </div>
      </div>
    </div>
  );
}

const ORDINALS = ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
function ordinalBn(n) {
  return ORDINALS[n - 1] || `${n}তম`;
}

function WrittenResultsList({ sessions }) {
  const [openId, setOpenId] = useState(null);

  // ordinal সংখ্যা বসানোর জন্য পুরনো থেকে নতুন ক্রমে গুনতে হয় (sessions প্রপে
  // নতুন থেকে পুরনো ক্রমে আসে ব্যাকএন্ড থেকে)
  const ordinalBySessionId = {};
  const countByKind = {};
  [...sessions]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((s) => {
      countByKind[s.kind] = (countByKind[s.kind] || 0) + 1;
      ordinalBySessionId[s.sessionId] = countByKind[s.kind];
    });

  return (
    <>
      {sessions.map((session) => {
        const graded = session.items.every((i) => i.status === "graded");
        const total = session.items.reduce((n, i) => n + (Number(i.points) || 0), 0);
        const score = session.items.reduce((n, i) => n + (Number(i.score) || 0), 0);
        const isOpen = openId === session.sessionId;
        const label = `${KIND_LABEL[session.kind] || session.kind} ${ordinalBySessionId[session.sessionId]}`;

        return (
          <div key={session.sessionId} className="rounded-lg border border-[var(--color-paper-line)] bg-white/70 text-sm">
            <button
              onClick={() => setOpenId(isOpen ? null : session.sessionId)}
              className="flex w-full items-center justify-between px-3 py-3 text-left"
            >
              <span className="font-semibold text-[var(--color-ink)]">
                {label} <span className="text-xs font-normal text-[var(--color-text)]/50">({EXAM_TYPE_LABEL[session.examType] || session.examType})</span>
              </span>
              <span className="flex items-center gap-2">
                {graded ? (
                  <span className="font-display font-bold text-[var(--color-greenpen)]">{score}/{total}</span>
                ) : (
                  <span className="rounded-full bg-[var(--color-marigold)]/20 px-3 py-0.5 text-xs font-bold text-[var(--color-marigold-dark)]">পেন্ডিং</span>
                )}
                <span className="text-[var(--color-text)]/40">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-[var(--color-paper-line)] p-3">
                {groupByImage_(session.items).map((group) => (
                  <div key={group.imageUrl} className="rounded-md bg-[var(--color-paper)] p-2">
                    <img
                      src={group.items[0].annotatedImageUrl || group.imageUrl}
                      alt="উত্তরপত্র"
                      className="mb-2 max-h-56 rounded-md border border-[var(--color-paper-line)]"
                    />
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="border-t border-dashed border-[var(--color-paper-line)] pt-2 first:border-t-0 first:pt-0">
                          <div className="text-xs text-[var(--color-text)]/70" dangerouslySetInnerHTML={{ __html: item.subQuestionText }} />
                          {item.status === "graded" ? (
                            <>
                              <p className="mt-1 text-xs font-bold text-[var(--color-ink)]">নম্বর: {item.score}/{item.points}</p>
                              {item.adminComment && <p className="mt-1 text-xs text-[var(--color-bluepen)]">মন্তব্য: {item.adminComment}</p>}
                            </>
                          ) : (
                            <p className="mt-1 text-xs font-semibold text-[var(--color-marigold-dark)]">মূল্যায়নের অপেক্ষায়</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function groupByImage_(items) {
  const groups = {};
  items.forEach((item) => {
    if (!groups[item.imageUrl]) groups[item.imageUrl] = { imageUrl: item.imageUrl, items: [] };
    groups[item.imageUrl].items.push(item);
  });
  return Object.values(groups);
}

function ExamCard({ title, enabled, to }) {
  const body = (
    <div
      className={`rounded-xl border p-4 text-center font-display text-sm font-bold ${
        enabled
          ? "border-[var(--color-marigold)] bg-[var(--color-marigold)]/15 text-[var(--color-ink)]"
          : "border-[var(--color-paper-line)] bg-white/50 text-[var(--color-text)]/40"
      }`}
    >
      {title}
      {!enabled && <div className="mt-1 text-xs font-normal">কনফার্ম হওয়ার পর চালু হবে</div>}
    </div>
  );
  return enabled ? <Link to={to}>{body}</Link> : <div>{body}</div>;
}