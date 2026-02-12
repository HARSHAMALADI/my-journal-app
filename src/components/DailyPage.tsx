"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pen, Eraser } from "lucide-react";

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
  habits: string[];
  dailyHabits: { [name: string]: boolean };
  onPrioritiesChange: (val: string) => void;
  onTodoToggle: (index: number) => void;
  onTodoTextChange: (index: number, text: string) => void;
  onHabitToggle: (name: string) => void;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (data) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = data;
    }
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
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
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
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
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {!readOnly && (
          <>
            <button
              onClick={() => setTool("pen")}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors ${tool === "pen" ? "bg-ink-light/20 text-ink-dark" : "text-ink-light"}`}
            >
              <Pen size={18} />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors ${tool === "eraser" ? "bg-ink-light/20 text-ink-dark" : "text-ink-light"}`}
            >
              <Eraser size={18} />
            </button>
            <button onClick={clearCanvas} className="text-ink-light hover:text-ink-dark text-xs tracking-wider uppercase cursor-pointer ml-auto px-3 py-2">
              Clear
            </button>
          </>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={`w-full flex-1 min-h-[300px] sm:min-h-[400px] drawing-canvas stylus-area bg-transparent border border-line/40 rounded-lg ${readOnly ? "pointer-events-none" : ""}`}
        onPointerDown={readOnly ? undefined : startDrawing}
        onPointerMove={readOnly ? undefined : draw}
        onPointerUp={readOnly ? undefined : stopDrawing}
        onPointerLeave={readOnly ? undefined : stopDrawing}
        onPointerCancel={readOnly ? undefined : stopDrawing}
      />
    </div>
  );
}

/* ─── Tab definitions ─── */
const TAB_LIST = [
  { key: "priorities", label: "Priorities" },
  { key: "todo", label: "To Do" },
  { key: "intention", label: "Intention" },
  { key: "habits", label: "Habits" },
  { key: "schedule", label: "Schedule" },
  { key: "notes", label: "Notes" },
  { key: "sketch", label: "Sketch" },
];

/* ─── Main Daily Page ─── */
export default function DailyPage({
  date, priorities, todoItems, intention, schedule, dailyNotes, drawingData,
  habits, dailyHabits,
  onPrioritiesChange, onTodoToggle, onTodoTextChange, onHabitToggle, onIntentionChange, onScheduleChange,
  onNotesChange, onDrawingChange, onBack, onPrevDay, onNextDay,
}: DailyPageProps) {
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const readOnly = isPastDate(date);

  const [activeTab, setActiveTab] = useState(0);
  const touchStart = useRef(0);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Filter out habits tab if no habits defined
  const visibleTabs = TAB_LIST.filter(
    (t) => t.key !== "habits" || (habits && habits.length > 0)
  );

  // Safety: ensure todoItems is always a clean array
  const safeTodos: TodoItem[] = Array.isArray(todoItems)
    ? todoItems.map((item) => {
        if (item && typeof item === "object") {
          const text = String(item.text || "");
          return { text: text.includes("[object Object]") ? "" : text, done: !!item.done };
        }
        const str = String(item || "");
        return { text: str.includes("[object Object]") ? "" : str, done: false };
      })
    : Array.from({ length: 6 }, () => ({ text: "", done: false }));

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 60 && activeTab < visibleTabs.length - 1) setActiveTab((a) => a + 1);
    if (delta < -60 && activeTab > 0) setActiveTab((a) => a - 1);
  };

  // Scroll active tab into view
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeEl = tabBarRef.current.children[activeTab] as HTMLElement;
    if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  const currentTab = visibleTabs[activeTab]?.key || "priorities";

  /* ─── Tab Content Renderers ─── */
  const renderTabContent = () => {
    switch (currentTab) {
      case "priorities":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-3 sm:mb-4">
              What matters most today?
            </p>
            <textarea
              value={priorities}
              onChange={(e) => onPrioritiesChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full flex-1 bg-transparent text-ink-dark text-sm sm:text-base md:text-lg font-sans resize-none lined-textarea min-h-[300px] sm:min-h-[400px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "Write your top priorities for today..."}
            />
          </div>
        );

      case "todo":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-3 sm:mb-4">
              Tasks to complete today
            </p>
            <div className="space-y-1 sm:space-y-2 flex-1">
              {safeTodos.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <button
                    onClick={() => !readOnly && onTodoToggle(idx)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                      item.done
                        ? "bg-ink-light/30 border-ink-light/40"
                        : "border-ink-light/30 hover:border-ink-light/50"
                    } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {item.done && (
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onTodoTextChange(idx, e.target.value)}
                    readOnly={readOnly}
                    className={`flex-1 bg-transparent text-sm sm:text-base md:text-lg font-sans min-w-0 py-1.5 sm:py-2 border-b border-line/30 transition-all ${
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
        );

      case "intention":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-3 sm:mb-4">
              Set your focus for the day
            </p>
            <textarea
              value={intention}
              onChange={(e) => onIntentionChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full flex-1 bg-transparent text-ink-dark text-sm sm:text-base md:text-lg font-sans resize-none lined-textarea min-h-[300px] sm:min-h-[400px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "What's your intention or focus for today?"}
            />
          </div>
        );

      case "habits":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-4 sm:mb-6">
              Track your daily habits
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {habits.map((habit) => {
                const done = dailyHabits?.[habit] || false;
                return (
                  <button
                    key={habit}
                    onClick={() => !readOnly && onHabitToggle(habit)}
                    className={`flex items-center gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-5 rounded-xl border-2 transition-all ${
                      done
                        ? "bg-sage/12 border-sage/40"
                        : "border-line/50 hover:border-ink-light/40"
                    } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      done
                        ? "bg-sage/60 border-sage/70"
                        : "border-ink-light/30"
                    }`}>
                      {done && (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm sm:text-base md:text-lg font-sans ${done ? "text-ink-dark" : "text-ink-light"}`}>
                      {habit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-3 sm:mb-4">
              Plan your day hour by hour
            </p>
            <div className="space-y-0 flex-1 overflow-y-auto diary-scroll">
              {schedule.map((slot, idx) => (
                <div key={idx} className="flex items-center border-b border-line/30 h-9 sm:h-11">
                  <span className="w-16 sm:w-20 text-xs sm:text-sm text-ink-light font-medium shrink-0 tabular-nums">
                    {slot.time}
                  </span>
                  <input
                    type="text"
                    value={slot.task}
                    onChange={(e) => onScheduleChange(idx, e.target.value)}
                    readOnly={readOnly}
                    className={`flex-1 bg-transparent text-sm sm:text-base text-ink-dark font-sans pl-2 sm:pl-3 min-w-0 ${readOnly ? "opacity-70 cursor-default" : ""}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="flex flex-col flex-1">
            <p className="text-ink-light text-xs sm:text-sm tracking-wide mb-3 sm:mb-4">
              Thoughts, ideas, reflections
            </p>
            <textarea
              value={dailyNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              readOnly={readOnly}
              className={`w-full flex-1 bg-transparent text-ink-dark text-sm sm:text-base md:text-lg font-sans resize-none lined-textarea min-h-[300px] sm:min-h-[400px] ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder={readOnly ? "" : "Write your thoughts, ideas, reflections..."}
            />
          </div>
        );

      case "sketch":
        return <DrawingCanvas data={drawingData} onChange={onDrawingChange} readOnly={readOnly} />;

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.3 }}
      className="paper-texture min-h-[100dvh] flex flex-col"
    >
      {/* Fixed Header Area */}
      <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Nav */}
          <div className="flex items-center justify-between mb-3">
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

          {/* Date header */}
          <div className="flex items-end gap-2 sm:gap-3 mb-4 sm:mb-5">
            <span className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-ink-dark leading-none">
              {dayNum}
            </span>
            <div className="pb-0.5 sm:pb-1">
              <p className="font-serif text-base sm:text-lg md:text-xl text-ink font-medium">{monthName}</p>
              <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-ink-light font-medium">{dayOfWeek}</p>
            </div>
          </div>

          {/* Read-only banner */}
          {readOnly && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-ink-light/[0.07] border border-ink-light/20">
              <svg className="w-3.5 h-3.5 text-ink-light shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 9v3m-7.07 5.07a9 9 0 1114.14 0A9 9 0 014.93 17.07z" />
              </svg>
              <p className="text-[10px] sm:text-xs text-ink-light font-sans tracking-wide">
                Past date — view only
              </p>
            </div>
          )}

          {/* Tab bar */}
          <div
            ref={tabBarRef}
            className="flex gap-1 overflow-x-auto pb-3 sm:pb-4 hide-scrollbar"
          >
            {visibleTabs.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(idx)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-sans whitespace-nowrap transition-all cursor-pointer ${
                  idx === activeTab
                    ? "bg-ink-dark text-cream font-medium shadow-sm"
                    : "text-ink-light hover:text-ink-dark hover:bg-cream-dark/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-[0.5px] bg-ink-light/25" />
        </div>
      </div>

      {/* Tab content area — swipeable */}
      <div
        className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 py-4 sm:py-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Tab title */}
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-ink-dark font-semibold mb-2 sm:mb-3">
                {visibleTabs[activeTab]?.label}
              </h2>

              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom spacer */}
        <div className="h-6 sm:h-10" />
      </div>
    </motion.div>
  );
}
