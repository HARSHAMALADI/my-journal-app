"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pen, Type, Eraser } from "lucide-react";

interface DailyPageProps {
  date: Date;
  priorities: string;
  todoItems: string;
  intention: string;
  schedule: { time: string; task: string }[];
  dailyNotes: string;
  drawingData: string;
  onPrioritiesChange: (val: string) => void;
  onTodoChange: (val: string) => void;
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

/* ─── Handwriting Canvas ─── */
function DrawingCanvas({ data, onChange }: { data: string; onChange: (d: string) => void }) {
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
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[160px] sm:h-[200px] drawing-canvas stylus-area bg-transparent"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        onPointerCancel={stopDrawing}
      />
    </div>
  );
}

/* ─── Main Daily Page ─── */
export default function DailyPage({
  date, priorities, todoItems, intention, schedule, dailyNotes, drawingData,
  onPrioritiesChange, onTodoChange, onIntentionChange, onScheduleChange,
  onNotesChange, onDrawingChange, onBack, onPrevDay, onNextDay,
}: DailyPageProps) {
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const { weeks, currentDay } = getMiniCalendar(date);

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

        {/* Three Boxes: Priorities / To Do / Intention */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {[
            { title: "Priorities", value: priorities, onChange: onPrioritiesChange, placeholder: "Top priorities for today..." },
            { title: "To Do", value: todoItems, onChange: onTodoChange, placeholder: "Tasks to complete..." },
            { title: "Intention", value: intention, onChange: onIntentionChange, placeholder: "Today's intention or focus..." },
          ].map((box) => (
            <div key={box.title} className="border border-line/60 rounded-sm p-2.5 sm:p-3">
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
                {box.title}
              </h3>
              <textarea
                value={box.value}
                onChange={(e) => box.onChange(e.target.value)}
                className="w-full bg-transparent text-ink-dark text-[11px] sm:text-xs font-sans resize-none lined-textarea h-[84px] sm:h-[112px]"
                placeholder={box.placeholder}
              />
            </div>
          ))}
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
                    className="flex-1 bg-transparent text-[11px] sm:text-xs text-ink-dark font-sans pl-1.5 sm:pl-2 min-w-0"
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
              className="w-full bg-transparent text-ink-dark text-[11px] sm:text-xs font-sans resize-none lined-textarea h-[200px] sm:h-[280px]"
              placeholder="Thoughts, ideas, reflections..."
            />
          </div>
        </div>

        {/* Drawing / Handwriting Canvas */}
        <DrawingCanvas data={drawingData} onChange={onDrawingChange} />

        {/* Bottom spacer for mobile scroll */}
        <div className="h-8 sm:h-12" />
      </div>
    </motion.div>
  );
}
