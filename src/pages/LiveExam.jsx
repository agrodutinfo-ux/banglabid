import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import McqExamRunner from "../components/McqExamRunner";
import WrittenExamRunner from "../components/WrittenExamRunner";
import Loader from "../components/Loader";

export default function LiveExam() {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState("mcq"); // mcq -> written -> finished

  useEffect(() => {
    api.liveExamStatus().then((res) => {
      setStatus(res.ok ? res.data : { open: false, reason: "যাচাই করা যায়নি।" });
      setChecking(false);
    });
  }, []);

  if (checking) return <Loader full label="লাইভ পরীক্ষার সময় যাচাই হচ্ছে…" />;

  if (!status?.open) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-lg font-bold text-[var(--color-ink)]">লাইভ পরীক্ষা এখন চালু নেই</p>
        <p className="mt-2 rounded-lg bg-[var(--color-marigold)]/10 px-4 py-3 text-sm text-[var(--color-marigold-dark)]">
          {status?.reason}
        </p>
        <Link to="/student" className="mt-6 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          পোর্টালে ফিরুন
        </Link>
      </div>
    );
  }

  if (step === "finished") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-2xl font-bold text-[var(--color-greenpen)]">লাইভ পরীক্ষা সম্পন্ন হয়েছে ✓</p>
        <p className="mt-2 text-sm text-[var(--color-text)]/70">
          এমসিকিউ অংশের ফলাফল আপনার পোর্টালে সাথে সাথে দেখা যাচ্ছে। অনুধাবনমূলক অংশ মূল্যায়নের পর
          দেখা যাবে। লাইভ পরীক্ষার মেরিট তালিকা পোর্টাল থেকে দেখতে পারবেন।
        </p>
        <Link to="/student" className="mt-6 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white">
          পোর্টালে ফিরুন
        </Link>
      </div>
    );
  }

  if (step === "written") {
    return <WrittenExamRunner examType="live" kind="written" onFinished={() => setStep("finished")} />;
  }

  return <McqExamRunner examType="live" onFinished={() => setStep("written")} />;
}
