export default function PunchHoles({ count = 6 }) {
  return (
    <div className="absolute left-2 top-0 bottom-0 hidden w-4 flex-col items-center justify-evenly md:flex">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full bg-[var(--color-paper)] ring-2 ring-inset ring-[var(--color-paper-line)]"
        />
      ))}
    </div>
  );
}
