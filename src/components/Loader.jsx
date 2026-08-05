export default function Loader({ label = "লোড হচ্ছে…", full = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-paper-line)]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-marigold)] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--color-redpen)] animate-spin [animation-direction:reverse] [animation-duration:0.9s]" />
      </div>
      <p className="font-display text-sm text-[var(--color-ink)]">{label}</p>
    </div>
  );

  if (!full) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-paper)]/90 backdrop-blur-sm">
      {content}
    </div>
  );
}
