"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pen, Type, Eraser } from "lucide-react";

interface TodoItem {
  text: string;
  done: boolean;
}

interface DailyPageProps {
  date: Date;
  priorities: string;
  todoItems: TodoItem[];
  intention: string;
  schedule: { time: string; task: string }[];
  dailyNotes: string;
  drawingData: string;
  onPrioritiesChange: (val: string) => void;
  onTodoToggle: (index: number) => void;
  onTodoTextChange: (index: number, text: string) => void;
  onIntentionChange: (val: string) => void;
  onScheduleChange: (index: number, task: string) => void;
  onNotesChange: (val: string) => void;
  onDrawingChange: (data: string) => void;
  onBack: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getMiniCalendar(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const currentDay = date.getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
  return { weeks, currentDay };
}

/* ─── Check if date is in the past ─── */
function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(date);
  check.setHours(0, 0, 0, 0);
  return check < today;
}

/* ─── Handwriting Canvas ─── */
function DrawingCanvas({ data, onChange, readOnly }: { data: string; onChange: (d: string) => void; readOnly?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Load saved drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Restore
    if (data) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = data;
    }
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
    // Only respond to pen/touch/mouse
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPoint.current = getPos(e);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const pos = getPos(e);
    // Pressure sensitivity for Apple Pencil
    const pressure = e.pressure || 0.5;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#5c4033";
      ctx.lineWidth = Math.max(1, pressure * 3);
    }

    ctx.stroke();
    lastPoint.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
    // Save
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    onChange("");
  };

  return (
    <div className="border border-line/60 rounded-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-line/40">
        <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mr-auto">
          Sketch / Write
        </h3>
        {!readOnly && (
          <>
            <button
              onClick={() => setTool("pen")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${tool === "pen" ? "bg-ink-light/20 text-ink-dark" : "text-ink-light"}`}
            >
              <Pen size={13} />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${tool === "eraser" ? "bg-ink-light/20 text-ink-dark" : "text-ink-light"}`}
            >
              <Eraser size={13} />
            </button>
            <button onClick={clearCanvas} className="text-ink-light hover:text-ink-dark text-[9px] tracking-wider uppercase cursor-pointer ml-1 p-1">
              Clear
            </button>
          </>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={`w-full h-[160px] sm:h-[200px] drawing-canvas stylus-area bg-transparent ${readOnly ? "pointer-events-none" : ""}`}
        onPointerDown={readOnly ? undefined : startDrawing}
        onPointerMove={readOnly ? undefined : draw}
        onPointerUp={readOnly ? undefined : stopDrawing}
        onPointerLeave={readOnly ? undefined : stopDrawing}
        onPointerCancel={readOnly ? undefined : stopDrawing}
      />
    </div>
  );
}

/* ─── Main Daily Page ─── */
export default function DailyPage({
  date, priorities, todoItems, intention, schedule, dailyNotes, drawingData,
  onPrioritiesChange, onTodoToggle, onTodoTextChange, onIntentionChange, onScheduleChange,
  onNotesChange, onDrawingChange, onBack, onPrevDay, onNextDay,
}: DailyPageProps) {
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const { weeks, currentDay } = getMiniCalendar(date);
  const readOnly = isPastDate(date);

  // Safety: ensure todoItems is always an array
  const safeTodos: TodoItem[] = Array.isArray(todoItems)
    ? todoItems.map((item) =>
        item && typeof item === "object"
          ? { text: item.text || "", done: !!item.done }
          : { text: String(item || ""), done: false }
      )
    : Array.from({ length: 6 }, () => ({ text: "", done: false }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.3 }}
      className="paper-texture min-h-[100dvh] diary-scroll overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button onClick={onBack} className="text-ink-light hover:text-ink-dark text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer transition-colors">
            {monthName}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onPrevDay} className="text-ink-light hover:text-ink-dark cursor-pointer transition-colors p-2 -m-2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={onNextDay} className="text-ink-light hover:text-ink-dark cursor-pointer transition-colors p-2 -m-2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="flex-1 h-[0.5px] bg-ink-light/30" />
          <div className="w-1 h-1 rotate-45 bg-ink-light/40" />
          <div className="flex-1 h-[0.5px] bg-ink-light/30" />
        </div>

        {/* Date + Mini Calendar */}
        <div className="flex items-start justify-between mb-5 sm:mb-6">
          <div className="flex items-end gap-2 sm:gap-3">
            <span className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-ink-dark leading-none">
              {dayNum}
            </span>
            <div className="pb-0.5 sm:pb-1.5">
              <p className="font-serif text-lg sm:text-xl md:text-2xl text-ink font-medium">{monthName}</p>
              <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-ink-light font-medium">{dayOfWeek}</p>
            </div>
          </div>

          <div className="hidden sm:block">
            <table className="text-[8px] sm:text-[9px] text-ink-light">
              <thead>
                <tr>
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <th key={i} className="w-4 sm:w-5 h-3 sm:h-4 font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((d, di) => (
                      <td key={di} className={`w-4 sm:w-5 h-3 sm:h-4 text-center ${d === currentDay ? "text-ink-dark font-bold" : ""}`}>
                        {d || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Read-only banner for past dates */}
        {readOnly && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-sm bg-ink-light/[0.07] border border-ink-light/20">
            <svg className="w-3.5 h-3.5 text-ink-light shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 9v3m-7.07 5.07a9 9 0 1114.14 0A9 9 0 014.93 17.07z" />
            </svg>
            <p className="text-[10px] sm:text-xs text-ink-light font-sans tracking-wide">
              Past date — view only
            </p>
          </div>
        )}

        {/* Three Boxes: Priorities / To Do / Intention */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {/* Priorities */}
          <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
            <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
              Priorities
            </h3>
            <textarea
              value={priorities}
              onChange={(e) => onPrioritiesChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full bg-transparent text-ink-dark text-[11px] sm:text-xs font-sans resize-none lined-textarea h-[84px] sm:h-[112px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "Top priorities for today..."}
            />
          </div>

          {/* To Do — Checklist with strikethrough */}
          <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
            <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
              To Do
            </h3>
            <div className="space-y-0.5 h-[84px] sm:h-[112px] overflow-y-auto diary-scroll">
              {safeTodos.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 group">
                  <button
                    onClick={() => !readOnly && onTodoToggle(idx)}
                    className={`w-3.5 h-3.5 shrink-0 rounded-[3px] border flex items-center justify-center transition-all ${
                      item.done
                        ? "bg-ink-light/30 border-ink-light/40"
                        : "border-ink-light/30 hover:border-ink-light/50"
                    } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {item.done && (
                      <svg className="w-2.5 h-2.5 text-ink-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onTodoTextChange(idx, e.target.value)}
                    readOnly={readOnly}
                    className={`flex-1 bg-transparent text-[11px] sm:text-xs font-sans min-w-0 py-0.5 transition-all ${
                      item.done
                        ? "line-through text-ink-light/50"
                        : "text-ink-dark"
                    } ${readOnly ? "opacity-70 cursor-default" : ""}`}
                    placeholder={readOnly ? "" : `Task ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Intention */}
          <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
            <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
              Intention
            </h3>
            <textarea
              value={intention}
              onChange={(e) => onIntentionChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full bg-transparent text-ink-dark text-[11px] sm:text-xs font-sans resize-none lined-textarea h-[84px] sm:h-[112px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "Today's intention or focus..."}
            />
          </div>
        </div>

        {/* Schedule + Notes side by side */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-5 sm:mb-6">
          {/* Schedule 5AM - 12AM */}
          <div className="md:w-1/2">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 pb-1 border-b border-line/50">
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold">Schedule</h3>
              <span className="text-[8px] text-ink-light/50">|</span>
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold">Tasks</h3>
            </div>
            <div className="space-y-0 max-h-[400px] sm:max-h-[520px] overflow-y-auto diary-scroll">
              {schedule.map((slot, idx) => (
                <div key={idx} className="flex items-center border-b border-line/30 h-7 sm:h-8">
                  <span className="w-12 sm:w-16 text-[9px] sm:text-[10px] text-ink-light font-medium shrink-0 tabular-nums">
                    {slot.time}
                  </span>
                  <input
                    type="text"
                    value={slot.task}
                    onChange={(e) => onScheduleChange(idx, e.target.value)}
                    readOnly={readOnly}
                    className={`flex-1 bg-transparent text-[11px] sm:text-xs text-ink-dark font-sans pl-1.5 sm:pl-2 min-w-0 ${readOnly ? "opacity-70 cursor-default" : ""}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="md:w-1/2">
            <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-2 pb-1 border-b border-line/50">
              Notes
            </h3>
            <textarea
              value={dailyNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full bg-transparent text-ink-dark text-[11px] sm:text-xs font-sans resize-none lined-textarea h-[200px] sm:h-[280px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "Thoughts, ideas, reflections..."}
            />
          </div>
        </div>

        {/* Drawing / Handwriting Canvas */}
        <DrawingCanvas data={drawingData} onChange={onDrawingChange} readOnly={readOnly} />

        {/* Bottom spacer for mobile scroll */}
        <div className="h-8 sm:h-12" />
      </div>
    </motion.div>
  );
}
