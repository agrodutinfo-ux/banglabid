import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import Loader from "../../components/Loader";
import RichTextEditor from "../../components/RichTextEditor";
import GradingCanvas from "../../components/GradingCanvas";

function useAdminToken() {
  const navigate = useNavigate();
  const token = localStorage.getItem("banglabid_admin_token");
  useEffect(() => {
    if (!token) navigate("/system-3212/admin-panel/login");
  }, [token, navigate]);
  return token;
}

export default function AdminDashboard() {
  const token = useAdminToken();
  const [tab, setTab] = useState("registrations");
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("banglabid_admin_token");
    navigate("/system-3212/admin-panel/login");
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="flex items-center justify-between border-b border-[var(--color-paper-line)] bg-white/70 px-4 py-3">
        <h1 className="font-display text-xl font-bold text-[var(--color-ink)]">অ্যাডমিন প্যানেল — বাংলাবিদ</h1>
        <button onClick={logout} className="rounded-lg border-2 border-[var(--color-redpen)] px-3 py-1.5 text-sm font-bold text-[var(--color-redpen)]">
          লগআউট
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-2">
          {[
            ["registrations", "রেজিস্ট্রেশন"],
            ["questions", "এমসিকিউ প্রশ্ন"],
            ["writtenQuestions", "অনুধাবনমূলক/বানান প্রশ্ন"],
            ["grading", "খাতা মূল্যায়ন"],
            ["notices", "নোটিশ"],
            ["liveResults", "লাইভ ফলাফল"],
            ["settings", "সেটিংস"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 font-display text-sm font-bold ${
                tab === key ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "registrations" && <Registrations token={token} />}
          {tab === "questions" && <Questions token={token} />}
          {tab === "writtenQuestions" && <WrittenQuestions token={token} />}
          {tab === "grading" && <Grading token={token} />}
          {tab === "notices" && <Notices token={token} />}
          {tab === "liveResults" && <LiveResults token={token} />}
          {tab === "settings" && <Settings token={token} />}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = { pending: "পেন্ডিং", confirmed: "কনফার্মড", rejected: "রিজেক্টেড" };
const STATUS_CLS = {
  pending: "bg-[var(--color-marigold)]/20 text-[var(--color-marigold-dark)]",
  confirmed: "bg-[var(--color-greenpen)]/15 text-[var(--color-greenpen)]",
  rejected: "bg-[var(--color-redpen)]/15 text-[var(--color-redpen)]",
};

function Registrations({ token }) {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");

  function load() {
    setRows(null);
    api.adminListRegistrations(token).then((res) => setRows(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  async function updateStatus(id, status) {
    setBusyId(id);
    await api.adminUpdateRegistrationStatus(token, id, status);
    setBusyId(null);
    load();
  }

  if (rows === null) return <Loader label="রেজিস্ট্রেশন লোড হচ্ছে…" />;

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-4 flex gap-2 text-sm">
        {["all", "pending", "confirmed", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-semibold ${
              filter === f ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-ink)]"
            }`}
          >
            {f === "all" ? "সব" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 && <p className="text-sm text-[var(--color-text)]/60">কোনো রেজিস্ট্রেশন নেই।</p>}
        {visible.map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-[var(--color-ink)]">{r.name}</p>
                <p className="text-sm text-[var(--color-text)]/70">
                  {r.className} শ্রেণি · {r.school} · {r.division}
                </p>
                <p className="text-sm text-[var(--color-text)]/70">{r.phone} · {r.email}</p>
                <p className="mt-1 text-sm text-[var(--color-bluepen)]">
                  বিকাশ: {r.bkashSender} · TrxID: {r.transactionId}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>

            {r.status !== "confirmed" && r.status !== "rejected" && (
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busyId === r.id}
                  onClick={() => updateStatus(r.id, "confirmed")}
                  className="rounded-lg bg-[var(--color-greenpen)] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  কনফার্ম করুন
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => updateStatus(r.id, "rejected")}
                  className="rounded-lg bg-[var(--color-redpen)] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  রিজেক্ট করুন
                </button>
              </div>
            )}
            {(r.status === "confirmed" || r.status === "rejected") && (
              <button
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, "pending")}
                className="mt-3 text-xs font-semibold text-[var(--color-bluepen)] underline"
              >
                পেন্ডিং-এ ফিরিয়ে নিন
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ token }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => setForm(res.data || {}));
  }, []);

  if (!form) return <Loader label="সেটিংস লোড হচ্ছে…" />;

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await api.adminUpdateSettings(token, form);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-5">
      <Field label="কোর্স ফি (৳)">
        <input className="input" value={form.price || ""} onChange={set("price")} placeholder="যেমনঃ 99" />
      </Field>
      <Field label="ছাড়ের মেয়াদ শেষ হওয়ার তারিখ-সময়">
        <input className="input" type="datetime-local" value={form.discountDeadline || ""} onChange={set("discountDeadline")} />
      </Field>
      <Field label="কোর্স ছবির URL (Google Drive/Imgur লিংক)">
        <input className="input" value={form.courseImageUrl || ""} onChange={set("courseImageUrl")} placeholder="https://..." />
        <span className="mt-1 block text-xs text-[var(--color-text)]/60">
          Google Drive: ছবিতে রাইট-ক্লিক → Share → "Anyone with the link" সিলেক্ট করে লিংক কপি করুন
          (শেয়ার লিংক দিলেই চলবে, বিশেষ ফরম্যাটে বদলাতে হবে না)। Imgur: ছবি আপলোডের পর যে লিংক
          পাবেন সেটাই দিন।
        </span>
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <input type="checkbox" checked={!!form.maintenanceMode} onChange={set("maintenanceMode")} />
        মেইনটেন্যান্স মোড চালু করুন
      </label>

      <div className="rounded-lg border border-[var(--color-paper-line)] p-3">
        <p className="mb-2 text-sm font-bold text-[var(--color-ink)]">লাইভ পরীক্ষার সময়সূচি</p>
        <Field label="শুরুর তারিখ ও সময়">
          <input className="input" type="datetime-local" value={form.liveExamStart || ""} onChange={set("liveExamStart")} />
        </Field>
        <Field label="শেষের তারিখ ও সময়">
          <input className="input" type="datetime-local" value={form.liveExamEnd || ""} onChange={set("liveExamEnd")} />
        </Field>
        <p className="text-xs text-[var(--color-text)]/60">
          এই সময়ের মধ্যে যেকোনো সময় স্টুডেন্ট লাইভ পরীক্ষা শুরু করতে পারবে (এমসিকিউ ৪০ মিনিট, তারপর
          স্বয়ংক্রিয়ভাবে অনুধাবনমূলক অংশ ৩০ মিনিট)।
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
      >
        {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
      </button>
      {saved && <p className="text-center text-sm font-semibold text-[var(--color-greenpen)]">সেভ হয়েছে ✓</p>}
    </form>
  );
}

const emptyQuestion = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
  forMock: true,
  forLive: false,
  category: "",
  subCategory: "",
};

function Questions({ token }) {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    setList(null);
    api.adminListQuestions(token).then((res) => setList(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function saveQuestion(e) {
    e.preventDefault();
    setError("");
    if (!form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      setError("সব ঘর পূরণ করুন।");
      return;
    }
    if (!form.category) {
      setError("প্রশ্নের ক্যাটাগরি (সাহিত্য/ব্যাকরণ) নির্বাচন করুন।");
      return;
    }
    if (form.category === "ব্যাকরণ" && !form.subCategory) {
      setError("ব্যাকরণ প্রশ্নের জন্য উপ-ক্যাটাগরি (বানান/অন্যান্য) নির্বাচন করুন।");
      return;
    }
    setSaving(true);
    const res = editingId
      ? await api.adminUpdateQuestion(token, { ...form, id: editingId })
      : await api.adminAddQuestion(token, form);
    setSaving(false);
    if (res.ok) {
      cancelEdit();
      load();
    } else {
      setError(res.message || "সেভ করা যায়নি।");
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setForm({
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation || "",
      forMock: q.forMock === true || q.forMock === "TRUE",
      forLive: q.forLive === true || q.forLive === "TRUE",
      category: q.category || "",
      subCategory: q.subCategory || "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyQuestion);
  }

  async function deleteQuestion(id) {
    setBusyId(id);
    await api.adminDeleteQuestion(token, id);
    setBusyId(null);
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveQuestion} className="h-fit space-y-3 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-5">
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">
          {editingId ? "প্রশ্ন এডিট করুন" : "নতুন প্রশ্ন যোগ করুন"}
        </h3>
        {error && <p className="rounded-lg bg-[var(--color-redpen)]/10 px-3 py-2 text-sm text-[var(--color-redpen)]">{error}</p>}

        <Field label="ক্যাটাগরি">
          <select className="input" value={form.category} onChange={set("category")}>
            <option value="">নির্বাচন করুন</option>
            <option value="সাহিত্য">সাহিত্য</option>
            <option value="ব্যাকরণ">ব্যাকরণ</option>
          </select>
        </Field>
        {form.category === "ব্যাকরণ" && (
          <Field label="উপ-ক্যাটাগরি">
            <select className="input" value={form.subCategory} onChange={set("subCategory")}>
              <option value="">নির্বাচন করুন</option>
              <option value="বানান">বানান</option>
              <option value="অন্যান্য">অন্যান্য</option>
            </select>
          </Field>
        )}

        <Field label="প্রশ্ন">
          <textarea className="input" rows={2} value={form.question} onChange={set("question")} />
        </Field>
        <Field label="অপশন ক">
          <input className="input" value={form.optionA} onChange={set("optionA")} />
        </Field>
        <Field label="অপশন খ">
          <input className="input" value={form.optionB} onChange={set("optionB")} />
        </Field>
        <Field label="অপশন গ">
          <input className="input" value={form.optionC} onChange={set("optionC")} />
        </Field>
        <Field label="অপশন ঘ">
          <input className="input" value={form.optionD} onChange={set("optionD")} />
        </Field>
        <Field label="সঠিক উত্তর">
          <select className="input" value={form.correctOption} onChange={set("correctOption")}>
            <option value="A">অপশন ক</option>
            <option value="B">অপশন খ</option>
            <option value="C">অপশন গ</option>
            <option value="D">অপশন ঘ</option>
          </select>
        </Field>
        <Field label="সংক্ষিপ্ত ব্যাখ্যা (ঐচ্ছিক)">
          <input className="input" value={form.explanation} onChange={set("explanation")} />
        </Field>
        <div className="flex gap-4 text-sm font-semibold text-[var(--color-ink)]">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.forMock} onChange={set("forMock")} /> মক টেস্ট
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.forLive} onChange={set("forLive")} /> লাইভ টেস্ট
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
          >
            {saving ? "সেভ হচ্ছে…" : editingId ? "পরিবর্তন সেভ করুন" : "প্রশ্ন যোগ করুন"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border-2 border-[var(--color-ink)] px-4 py-3 font-display font-bold text-[var(--color-ink)]"
            >
              বাতিল
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">
          প্রশ্ন ব্যাংক {list ? `(${list.length}টি)` : ""}
        </h3>
        {list === null ? (
          <Loader label="প্রশ্ন লোড হচ্ছে…" />
        ) : (
          <div className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">
            {list.length === 0 && <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো প্রশ্ন যোগ করা হয়নি।</p>}
            {list.map((q) => (
              <div key={q.id} className="rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{q.question}</p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(q)}
                      className="text-xs font-bold text-[var(--color-bluepen)] underline"
                    >
                      এডিট
                    </button>
                    <button
                      disabled={busyId === q.id}
                      onClick={() => deleteQuestion(q.id)}
                      className="text-xs font-bold text-[var(--color-redpen)] underline disabled:opacity-50"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text)]/60">
                  সঠিক উত্তর: {q["option" + q.correctOption]}
                  {q.category ? ` · ${q.category}${q.subCategory ? " (" + q.subCategory + ")" : ""}` : " · ক্যাটাগরি নেই (পুরনো প্রশ্ন — চাইলে শিটে বসিয়ে দিন)"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Notices({ token }) {
  const [list, setList] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setList(null);
    api.adminListNotices(token).then((res) => setList(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  async function addNotice(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    await api.adminAddNotice(token, message.trim());
    setSaving(false);
    setMessage("");
    load();
  }

  async function deleteNotice(id) {
    setBusyId(id);
    await api.adminDeleteNotice(token, id);
    setBusyId(null);
    load();
  }

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={addNotice} className="space-y-3 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-5">
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">নতুন নোটিশ</h3>
        <textarea
          className="input"
          rows={3}
          placeholder="যেমনঃ আগামীকাল রাত ৯টায় লাইভ পরীক্ষা অনুষ্ঠিত হবে।"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
        >
          {saving ? "যোগ হচ্ছে…" : "নোটিশ যোগ করুন"}
        </button>
      </form>

      <div>
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">সব নোটিশ</h3>
        {list === null ? (
          <Loader label="নোটিশ লোড হচ্ছে…" />
        ) : (
          <div className="mt-3 space-y-2">
            {list.length === 0 && <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো নোটিশ নেই।</p>}
            {list.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-3">
                <p className="text-sm text-[var(--color-ink)]">{n.message}</p>
                <button
                  disabled={busyId === n.id}
                  onClick={() => deleteNotice(n.id)}
                  className="shrink-0 text-xs font-bold text-[var(--color-redpen)] underline disabled:opacity-50"
                >
                  মুছুন
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyWrittenQuestion = {
  passageHtml: "",
  subQuestions: [{ text: "", points: 10 }],
  kind: "written",
  status: "draft",
  forMock: true,
  forLive: false,
};

function WrittenQuestions({ token }) {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(emptyWrittenQuestion);
  const [editingId, setEditingId] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    setList(null);
    api.adminListWrittenQuestions(token).then((res) => setList(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  function updateSubQuestion(i, key, value) {
    setForm((f) => {
      const subQuestions = f.subQuestions.map((sq, idx) => (idx === i ? { ...sq, [key]: value } : sq));
      return { ...f, subQuestions };
    });
  }

  function addSubQuestion() {
    setForm((f) => ({ ...f, subQuestions: [...f.subQuestions, { text: "", points: 10 }] }));
  }

  function removeSubQuestion(i) {
    setForm((f) => ({ ...f, subQuestions: f.subQuestions.filter((_, idx) => idx !== i) }));
  }

  async function save(status) {
    setError("");
    const cleanSubQuestions = form.subQuestions.filter((sq) => sq.text.trim());
    if (cleanSubQuestions.length === 0) {
      setError("অন্তত একটা প্রশ্ন লিখুন।");
      return;
    }
    if (form.kind === "written" && !form.passageHtml.trim()) {
      setError("উদ্দীপক লিখুন।");
      return;
    }
    setSaving(true);
    const payload = { ...form, subQuestions: cleanSubQuestions, status };
    const res = editingId
      ? await api.adminUpdateWrittenQuestion(token, editingId, payload)
      : await api.adminAddWrittenQuestion(token, payload);
    setSaving(false);
    if (res.ok) {
      cancelEdit();
      load();
    } else {
      setError(res.message || "সেভ করা যায়নি।");
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setForm({
      passageHtml: q.passageHtml || "",
      subQuestions: (q.subQuestions || []).map((sq) => ({ id: sq.id, text: sq.text, points: sq.points })),
      kind: q.kind || "written",
      status: q.status || "draft",
      forMock: q.forMock === true || q.forMock === "TRUE",
      forLive: q.forLive === true || q.forLive === "TRUE",
    });
    setResetKey((k) => k + 1);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyWrittenQuestion);
    setResetKey((k) => k + 1);
  }

  async function deleteQ(id) {
    setBusyId(id);
    await api.adminDeleteWrittenQuestion(token, id);
    setBusyId(null);
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-fit space-y-3 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-5">
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">
          {editingId ? "প্রশ্ন এডিট করুন" : "নতুন প্রশ্ন যোগ করুন"}
        </h3>
        {error && <p className="rounded-lg bg-[var(--color-redpen)]/10 px-3 py-2 text-sm text-[var(--color-redpen)]">{error}</p>}

        <Field label="ধরন">
          <select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
            <option value="written">অনুধাবনমূলক পরীক্ষা (উদ্দীপক + প্রশ্ন)</option>
            <option value="spelling">বিভাগীয় সেরা ২০ বানান প্রতিযোগিতা</option>
          </select>
        </Field>

        {form.kind === "written" && (
          <Field label="উদ্দীপক">
            <RichTextEditor
              value={form.passageHtml}
              onChange={(html) => setForm((f) => ({ ...f, passageHtml: html }))}
              placeholder="এখানে উদ্দীপক লিখুন — কবিতা হলে প্রতিটা লাইনের পর Enter চাপুন..."
              resetKey={resetKey}
            />
          </Field>
        )}

        <div className="space-y-3">
          <span className="block text-sm font-semibold text-[var(--color-ink)]">
            {form.kind === "spelling" ? "ভুল বানানগুলো (একটা করে)" : "প্রশ্নসমূহ"}
          </span>
          {form.subQuestions.map((sq, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-paper-line)] bg-[var(--color-paper)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-ink)] font-display text-xs font-bold text-white">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSubQuestion(i)}
                  className="rounded-lg border border-[var(--color-redpen)] px-2 py-0.5 text-xs font-bold text-[var(--color-redpen)]"
                >
                  ✕ বাদ দিন
                </button>
              </div>
              {form.kind === "spelling" ? (
                <input
                  className="input"
                  placeholder="যেমনঃ সমীচিণ"
                  value={sq.text}
                  onChange={(e) => updateSubQuestion(i, "text", e.target.value)}
                />
              ) : (
                <RichTextEditor
                  value={sq.text}
                  onChange={(html) => updateSubQuestion(i, "text", html)}
                  placeholder={`${i + 1} নম্বর প্রশ্ন লিখুন...`}
                  resetKey={`${resetKey}-${i}`}
                />
              )}
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs font-semibold text-[var(--color-ink)]">নম্বর:</label>
                <input
                  className="input w-24"
                  type="number"
                  min="0"
                  value={sq.points}
                  onChange={(e) => updateSubQuestion(i, "points", Number(e.target.value))}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addSubQuestion}
            className="rounded-lg border border-[var(--color-paper-line)] px-3 py-1 text-xs font-bold text-[var(--color-ink)]"
          >
            + আরেকটা {form.kind === "spelling" ? "বানান" : "প্রশ্ন"} যোগ করুন
          </button>
        </div>

        <div className="flex gap-4 text-sm font-semibold text-[var(--color-ink)]">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.forMock} onChange={(e) => setForm((f) => ({ ...f, forMock: e.target.checked }))} /> মক টেস্ট
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.forLive} onChange={(e) => setForm((f) => ({ ...f, forLive: e.target.checked }))} /> লাইভ টেস্ট
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save("draft")}
            className="flex-1 rounded-xl border-2 border-[var(--color-ink)] px-4 py-3 font-display font-bold text-[var(--color-ink)] disabled:opacity-60"
          >
            ড্রাফট রাখুন
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("published")}
            className="flex-1 rounded-xl bg-[var(--color-ink)] px-4 py-3 font-display font-bold text-white disabled:opacity-60"
          >
            {saving ? "সেভ হচ্ছে…" : "প্রকাশ করুন"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-xl border-2 border-[var(--color-redpen)] px-3 font-display font-bold text-[var(--color-redpen)]">
              বাতিল
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">প্রশ্ন তালিকা {list ? `(${list.length}টি)` : ""}</h3>
        {list === null ? (
          <Loader label="লোড হচ্ছে…" />
        ) : (
          <div className="mt-3 max-h-[36rem] space-y-2 overflow-y-auto">
            {list.length === 0 && <p className="text-sm text-[var(--color-text)]/60">এখনো কোনো প্রশ্ন যোগ করা হয়নি।</p>}
            {list.map((q) => (
              <div key={q.id} className="rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${q.status === "published" ? "bg-[var(--color-greenpen)]/15 text-[var(--color-greenpen)]" : "bg-[var(--color-marigold)]/20 text-[var(--color-marigold-dark)]"}`}>
                      {q.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                    </span>{" "}
                    <span className="text-xs text-[var(--color-text)]/60">{q.kind === "spelling" ? "বানান" : "অনুধাবনমূলক"} · {(q.subQuestions || []).length}টি প্রশ্ন</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(q)} className="text-xs font-bold text-[var(--color-bluepen)] underline">এডিট</button>
                    <button disabled={busyId === q.id} onClick={() => deleteQ(q.id)} className="text-xs font-bold text-[var(--color-redpen)] underline disabled:opacity-50">মুছুন</button>
                  </div>
                </div>
                {q.passageHtml && <div className="mt-2 line-clamp-2 text-xs text-[var(--color-text)]/70" dangerouslySetInnerHTML={{ __html: q.passageHtml }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const KIND_LABEL_ADMIN = { written: "অনুধাবনমূলক", spelling: "বানান প্রতিযোগিতা" };
const EXAM_TYPE_LABEL_ADMIN = { mock: "মক", live: "লাইভ" };

function Grading({ token }) {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [annotated, setAnnotated] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setList(null);
    api.adminListPendingWritten(token).then((res) => setList(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  function openItem(item) {
    setSelected(item);
    setScore("");
    setComment("");
    setAnnotated(null);
  }

  async function save() {
    if (!score) return;
    setSaving(true);
    await api.adminGradeWritten(token, {
      id: selected.id,
      score: Number(score),
      annotatedImageBase64: annotated,
      adminComment: comment,
    });
    setSaving(false);
    setSelected(null);
    load();
  }

  if (selected) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setSelected(null)} className="mb-3 text-sm font-bold text-[var(--color-bluepen)] underline">← তালিকায় ফিরুন</button>
        <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: selected.subQuestionText }} />
        <GradingCanvas imageUrl={selected.imageUrl} onExport={setAnnotated} />
        {annotated && <p className="mt-2 text-xs text-[var(--color-greenpen)]">মার্কিং প্রস্তুত ✓ — নিচে নম্বর দিয়ে সাবমিট করুন।</p>}
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
          <Field label={`নম্বর (সর্বোচ্চ ${selected.points})`}>
            <input className="input" type="number" max={selected.points} value={score} onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="মন্তব্য (ঐচ্ছিক)">
            <textarea className="input" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <button
            disabled={saving || !score}
            onClick={save}
            className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
          >
            {saving ? "সেভ হচ্ছে…" : "মূল্যায়ন সেভ করুন"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">
        মূল্যায়নের অপেক্ষায় {list ? `(${list.length}টি)` : ""}
      </h3>
      {list === null ? (
        <Loader label="লোড হচ্ছে…" />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {list.length === 0 && <p className="text-sm text-[var(--color-text)]/60">এখন মূল্যায়নের অপেক্ষায় কিছু নেই।</p>}
          {list.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="rounded-lg border border-[var(--color-paper-line)] bg-white/70 p-2 text-left"
            >
              <img src={item.imageUrl} alt="উত্তরপত্র" className="h-32 w-full rounded-md object-cover" />
              <div className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: item.subQuestionText }} />
              <p className="text-xs text-[var(--color-text)]/60">
                {KIND_LABEL_ADMIN[item.kind] || item.kind} · {EXAM_TYPE_LABEL_ADMIN[item.examType] || item.examType} · {item.points} নম্বর
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveResults({ token }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.adminLiveResults(token).then((res) => setRows(res.ok ? res.data : []));
  }, [token]);

  if (rows === null) return <Loader label="লোড হচ্ছে…" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">লাইভ পরীক্ষার ফলাফল (এমসিকিউ)</h3>
        <button onClick={() => window.print()} className="rounded-lg bg-[var(--color-ink)] px-4 py-1.5 text-sm font-bold text-white">
          প্রিন্ট / PDF ডাউনলোড
        </button>
      </div>
      <p className="mb-2 text-xs text-[var(--color-text)]/60">
        প্রিন্ট বাটনে চাপলে ব্রাউজারের প্রিন্ট ডায়ালগ খুলবে — সেখান থেকে "Save as PDF" বেছে নিলে PDF হিসেবে সেভ হয়ে যাবে।
      </p>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-[var(--color-paper-line)] bg-white text-sm">
        <thead>
          <tr className="bg-[var(--color-ink)] text-white">
            <th className="p-2 text-left">ক্রম</th>
            <th className="p-2 text-left">নাম</th>
            <th className="p-2 text-left">শ্রেণি/বিদ্যালয়</th>
            <th className="p-2 text-left">বিভাগ</th>
            <th className="p-2 text-right">নম্বর</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--color-paper-line)]">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.className} · {r.school}</td>
              <td className="p-2">{r.division}</td>
              <td className="p-2 text-right font-bold">{r.score}/{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
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