import { Link } from "react-router-dom";

export function TopBar() {
  return (
    <header className="border-b border-[var(--color-paper-line)] bg-[var(--color-paper)]/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/images/agrodut-logo.png"
            alt="অগ্রদূত"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-display text-lg font-bold text-[var(--color-ink)]">
            অগ্রদূত
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)] sm:gap-4">
          <Link
            to="/status"
            className="rounded-full bg-[var(--color-marigold)] px-3 py-1.5 font-display text-xs font-bold text-[var(--color-ink-dark)] shadow-sm transition hover:brightness-110 sm:px-4 sm:text-sm"
          >
            নিবন্ধন স্ট্যাটাস
          </Link>
          <Link
            to={localStorage.getItem("banglabid_student_token") ? "/student" : "/student/login"}
            className="rounded-full bg-[var(--color-ink)] px-3 py-1.5 font-display text-xs font-bold text-white shadow-sm transition hover:brightness-110 sm:px-4 sm:text-sm"
          >
            স্টুডেন্ট লগইন
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-paper-line)] bg-[var(--color-ink)] py-6 text-center text-sm text-[var(--color-paper)]/80">
      <p>© ২০২৬ অগ্রদূত। সর্বস্বত্ব সংরক্ষিত।</p>
    </footer>
  );
}
