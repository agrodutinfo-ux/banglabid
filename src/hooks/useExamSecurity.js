import { useCallback, useEffect, useRef, useState } from "react";

const MAX_VIOLATIONS = 3;

/**
 * পরীক্ষার সিকিউরিটি হুক।
 *
 * সততার সাথে বলে রাখা ভালো — এই হুক যা যা আটকাতে পারেঃ
 *   - রাইট-ক্লিক মেনু, টেক্সট সিলেকশন, কপি/কাট/পেস্ট
 *   - ফুলস্ক্রিন থেকে বের হওয়া, ট্যাব পরিবর্তন করা, উইন্ডো মিনিমাইজ করা (ব্লার)
 *   - DevTools খোলার সাধারণ শর্টকাট (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 *   - PrintScreen কী চাপা (কী-প্রেসটা শনাক্ত করা যায়, কিন্তু ছবি ততক্ষণে OS
 *     ইতিমধ্যে ক্যাপচার করে ফেলে — এটা আটকানো সম্ভব না)
 *
 * যা এটা আটকাতে পারে নাঃ ফোন দিয়ে স্ক্রিনের ছবি তোলা, অন্য ডিভাইস দিয়ে স্ক্রিন
 * রেকর্ড করা, বা OS/ব্রাউজারের নিজস্ব স্ক্রিনশট টুল (এটা কোনো ওয়েবসাইটের
 * প্রযুক্তিগত সীমার মধ্যে পড়ে না)।
 */
export function useExamSecurity({ enabled, onAutoSubmit }) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null); // { message } | null
  const [isFullscreen, setIsFullscreen] = useState(false);
  const submittedRef = useRef(false);
  const violationsRef = useRef(0);

  const registerViolation = useCallback(
    (reason) => {
      if (!enabled || submittedRef.current) return;
      violationsRef.current += 1;
      setViolations(violationsRef.current);

      if (violationsRef.current >= MAX_VIOLATIONS) {
        submittedRef.current = true;
        setWarning({
          message: `"${reason}" — সর্বোচ্চ সতর্কতার সীমা (৩ বার) পার হয়ে গেছে। পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হচ্ছে।`,
          final: true,
        });
        onAutoSubmit?.();
      } else {
        setWarning({
          message: `সতর্কতা ${violationsRef.current}/${MAX_VIOLATIONS}: "${reason}" — এটি নকল করার চেষ্টা হিসেবে গণ্য হবে। আর ${
            MAX_VIOLATIONS - violationsRef.current
          } বার হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।`,
          final: false,
        });
      }
    },
    [enabled, onAutoSubmit]
  );

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }, []);

  const exitSecurityMode = useCallback(() => {
    submittedRef.current = true; // আর কোনো ভায়োলেশন গোনা হবে না
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    submittedRef.current = false;
    violationsRef.current = 0;
    setViolations(0);
    requestFullscreen();

    const onFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && !submittedRef.current) registerViolation("ফুলস্ক্রিন থেকে বের হওয়া হয়েছে");
    };

    const onVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) registerViolation("ট্যাব পরিবর্তন/মিনিমাইজ করা হয়েছে");
    };

    const onBlur = () => {
      if (!submittedRef.current) registerViolation("পরীক্ষার উইন্ডো থেকে বাইরে যাওয়া হয়েছে");
    };

    const onContextMenu = (e) => e.preventDefault();
    const onCopy = (e) => e.preventDefault();
    const onCut = (e) => e.preventDefault();
    const onPaste = (e) => e.preventDefault();
    const onSelectStart = (e) => e.preventDefault();

    const onKeyDown = (e) => {
      const key = e.key;
      const blockedCombo =
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(key)) ||
        (e.ctrlKey && ["u", "U", "s", "S", "p", "P"].includes(key)) ||
        (e.metaKey && e.altKey && ["I", "i"].includes(key));

      if (blockedCombo) {
        e.preventDefault();
        registerViolation("ডেভেলপার টুলস/সেভ/প্রিন্ট শর্টকাট ব্যবহারের চেষ্টা হয়েছে");
      }
      if (key === "PrintScreen") {
        registerViolation("স্ক্রিনশট নেওয়ার চেষ্টা শনাক্ত হয়েছে");
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    violations,
    maxViolations: MAX_VIOLATIONS,
    warning,
    dismissWarning: () => setWarning(null),
    isFullscreen,
    requestFullscreen,
    exitSecurityMode,
  };
}
