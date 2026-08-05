import { useEffect, useState } from "react";

function useCountdown(deadline) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ expired: true });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft({ d, h, m, s, expired: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return left;
}

export default function CountdownBanner({ price, deadline, maintenanceMode }) {
  const left = useCountdown(deadline);

  if (maintenanceMode) {
    return (
      <div className="bg-[var(--color-redpen)] px-4 py-2 text-center text-sm font-semibold text-white">
        সাইটটি বর্তমানে রক্ষণাবেক্ষণের কাজ চলছে — কিছুক্ষণ পর আবার চেষ্টা করুন।
      </div>
    );
  }

  if (!deadline || !price) return null;

  return (
    <div className="bg-[var(--color-marigold)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-ink-dark)]">
      {left?.expired ? (
        <span>সীমিত-সময়ের ছাড়ের মেয়াদ শেষ হয়েছে — নিয়মিত মূল্যে ভর্তি চলছে।</span>
      ) : left ? (
        <span>
          মাত্র ৳{price} টাকায় ভর্তি চলছে — বাকি সময়:{" "}
          <span className="font-display tabular-nums">
            {left.d} দিন {String(left.h).padStart(2, "0")}:{String(left.m).padStart(2, "0")}:
            {String(left.s).padStart(2, "0")}
          </span>
        </span>
      ) : null}
    </div>
  );
}
