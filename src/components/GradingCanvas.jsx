import { useEffect, useRef, useState } from "react";

const PENS = [
  { key: "black", color: "#16211f", label: "কালো কলম" },
  { key: "red", color: "#b23a2e", label: "লাল কলম" },
  { key: "blue", color: "#2b4f9e", label: "নীল কলম" },
  { key: "green", color: "#2f7a4f", label: "সবুজ কলম" },
  { key: "highlight", color: "#f5e642", label: "হাইলাইটার" },
];

const SHAPES = [
  { key: "rect", label: "▭ আয়তক্ষেত্র" },
  { key: "circle", label: "◯ বৃত্ত" },
  { key: "arrow", label: "→ তীর" },
  { key: "tick", label: "✓ ঠিক" },
  { key: "cross", label: "✗ ভুল" },
];

/** স্টুডেন্টের আপলোড করা উত্তরপত্রের ছবির উপর দাগানো/শেপ/টেক্সট দিয়ে
 *  মূল্যায়নের টুল। Save করলে ছবি+দাগ একসাথে ফ্ল্যাট করে একটা নতুন ছবি
 *  (dataURL) হিসেবে ফেরত দেয়। */
export default function GradingCanvas({ imageUrl, onExport }) {
  const wrapRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [tool, setTool] = useState("black");
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const drawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const base = baseCanvasRef.current;
    const overlay = overlayCanvasRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || 900;
      const h = img.naturalHeight || 1200;
      base.width = w;
      base.height = h;
      overlay.width = w;
      overlay.height = h;
      const ctx = base.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      setReady(true);
    };
    img.onerror = () => setReady(true); // ছবি লোড না হলেও যেন খালি ক্যানভাস দেখায়, একদম ভেঙে না যায়
    img.src = imageUrl;
  }, [imageUrl]);

  function posFromEvent(e) {
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function isShapeTool() {
    return SHAPES.some((s) => s.key === tool);
  }

  function pointerDown(e) {
    e.preventDefault();
    const pos = posFromEvent(e);
    startPosRef.current = pos;
    drawingRef.current = true;

    if (tool === "text") {
      const text = window.prompt("লিখুন:");
      drawingRef.current = false;
      if (!text) return;
      const ctx = baseCanvasRef.current.getContext("2d");
      ctx.fillStyle = "#b23a2e";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(text, pos.x, pos.y);
      return;
    }

    if (tool === "tick" || tool === "cross") {
      const ctx = baseCanvasRef.current.getContext("2d");
      ctx.strokeStyle = tool === "tick" ? "#2f7a4f" : "#b23a2e";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (tool === "tick") {
        ctx.moveTo(pos.x - 15, pos.y);
        ctx.lineTo(pos.x - 5, pos.y + 15);
        ctx.lineTo(pos.x + 20, pos.y - 20);
      } else {
        ctx.moveTo(pos.x - 15, pos.y - 15);
        ctx.lineTo(pos.x + 15, pos.y + 15);
        ctx.moveTo(pos.x + 15, pos.y - 15);
        ctx.lineTo(pos.x - 15, pos.y + 15);
      }
      ctx.stroke();
      drawingRef.current = false;
      return;
    }

    if (isShapeTool()) return; // প্রিভিউ pointerMove-এ overlay ক্যানভাসে হবে

    // ফ্রি-হ্যান্ড পেন
    const pen = PENS.find((p) => p.key === tool) || PENS[0];
    const ctx = baseCanvasRef.current.getContext("2d");
    ctx.globalAlpha = tool === "highlight" ? 0.35 : 1;
    ctx.globalCompositeOperation = tool === "highlight" ? "multiply" : "source-over";
    ctx.strokeStyle = pen.color;
    ctx.lineWidth = tool === "highlight" ? 22 : 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function pointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const pos = posFromEvent(e);

    if (isShapeTool()) {
      const overlay = overlayCanvasRef.current;
      const octx = overlay.getContext("2d");
      octx.clearRect(0, 0, overlay.width, overlay.height);
      drawShape(octx, tool, startPosRef.current, pos);
      return;
    }

    const ctx = baseCanvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function pointerUp(e) {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (isShapeTool()) {
      const pos = posFromEvent(e);
      const overlay = overlayCanvasRef.current;
      overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
      const ctx = baseCanvasRef.current.getContext("2d");
      drawShape(ctx, tool, startPosRef.current, pos);
    } else {
      const ctx = baseCanvasRef.current.getContext("2d");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawShape(ctx, shapeTool, start, end) {
    ctx.strokeStyle = "#b23a2e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    if (shapeTool === "rect") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (shapeTool === "circle") {
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shapeTool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - 16 * Math.cos(angle - Math.PI / 6), end.y - 16 * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - 16 * Math.cos(angle + Math.PI / 6), end.y - 16 * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }

  function undo() {
    // সরল Undo: ছবি আবার লোড করে ক্যানভাস রিসেট — একাধিক ধাপের হিস্ট্রি নেই,
    // কিন্তু ভুল দাগ পুরোপুরি মুছে নতুন করে শুরু করার জন্য যথেষ্ট।
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = baseCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, baseCanvasRef.current.width, baseCanvasRef.current.height);
      ctx.drawImage(img, 0, 0, baseCanvasRef.current.width, baseCanvasRef.current.height);
    };
    img.src = imageUrl;
  }

  function exportImage() {
    onExport(baseCanvasRef.current.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {PENS.map((p) => (
          <button
            key={p.key}
            type="button"
            title={p.label}
            onClick={() => setTool(p.key)}
            className={`h-7 w-7 rounded-full border-2 ${tool === p.key ? "border-[var(--color-ink)]" : "border-transparent"}`}
            style={{ backgroundColor: p.color }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--color-paper-line)]" />
        {SHAPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setTool(s.key)}
            className={`rounded-md border px-2 py-1 text-xs font-bold ${
              tool === s.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-paper-line)] bg-white text-[var(--color-ink)]"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTool("text")}
          className={`rounded-md border px-2 py-1 text-xs font-bold ${
            tool === "text" ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-paper-line)] bg-white text-[var(--color-ink)]"
          }`}
        >
          T টেক্সট
        </button>
        <span className="mx-1 h-5 w-px bg-[var(--color-paper-line)]" />
        <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="rounded-md border border-[var(--color-paper-line)] bg-white px-2 py-1 text-xs font-bold">
          জুম −
        </button>
        <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="rounded-md border border-[var(--color-paper-line)] bg-white px-2 py-1 text-xs font-bold">
          জুম +
        </button>
        <button type="button" onClick={undo} className="rounded-md border border-[var(--color-paper-line)] bg-white px-2 py-1 text-xs font-bold">
          মুছে শুরু করুন
        </button>
      </div>

      <div ref={wrapRef} className="max-h-[70vh] overflow-auto rounded-xl border border-[var(--color-paper-line)] bg-[var(--color-paper)]">
        {!ready && <div className="p-8 text-center text-sm text-[var(--color-text)]/60">ছবি লোড হচ্ছে…</div>}
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", position: "relative", width: "fit-content" }}>
          <canvas ref={baseCanvasRef} className="block max-w-none" style={{ width: 700 }} />
          <canvas
            ref={overlayCanvasRef}
            className="absolute left-0 top-0 max-w-none touch-none"
            style={{ width: 700 }}
            onMouseDown={pointerDown}
            onMouseMove={pointerMove}
            onMouseUp={pointerUp}
            onMouseLeave={pointerUp}
            onTouchStart={pointerDown}
            onTouchMove={pointerMove}
            onTouchEnd={pointerUp}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={exportImage}
        className="mt-3 w-full rounded-xl bg-[var(--color-greenpen)] px-6 py-3 font-display font-bold text-white"
      >
        মার্কিং সেভ করুন
      </button>
    </div>
  );
}
