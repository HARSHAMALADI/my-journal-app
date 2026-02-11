"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface MonthlySpreadProps {
  month: number;
  year: number;
  onDayClick: (day: number) => void;
  monthlyGoals: string;
  monthlyTasks: { text: string; done: boolean }[];
  notes: string;
  onGoalsChange: (val: string) => void;
  onTaskToggle: (index: number) => void;
  onTaskChange: (index: number, text: string) => void;
  onNotesChange: (val: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onBackToCover: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MonthlySpread({
  month, year, onDayClick, monthlyGoals, monthlyTasks, notes,
  onGoalsChange, onTaskToggle, onTaskChange, onNotesChange,
  onPrevMonth, onNextMonth, onBackToCover,
}: MonthlySpreadProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = today.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.3 }}
      className="paper-texture min-h-[100dvh] diary-scroll overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBackToCover}
            className="flex items-center gap-1.5 text-ink-light hover:text-ink-dark text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer transition-colors"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Cover</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onPrevMonth} className="text-ink-light hover:text-ink-dark cursor-pointer transition-colors p-2 -m-2">
              <ChevronLeft size={18} />
            </button>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-ink-dark tracking-wide min-w-[200px] sm:min-w-[280px] text-center">
              {MONTH_NAMES[month]} {year}
            </h1>
            <button onClick={onNextMonth} className="text-ink-light hover:text-ink-dark cursor-pointer transition-colors p-2 -m-2">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="w-8 sm:w-12" />
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex-1 h-[0.5px] bg-ink-light/30" />
          <div className="w-1 h-1 rotate-45 bg-ink-light/40" />
          <div className="flex-1 h-[0.5px] bg-ink-light/30" />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="flex-1 min-w-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-0.5">
              {(typeof window !== "undefined" && window.innerWidth < 640 ? DAY_NAMES_SHORT : DAY_NAMES).map((d, i) => (
                <div key={i} className="text-center text-[9px] sm:text-[10px] tracking-widest uppercase text-ink-light font-medium py-1.5 sm:py-2">
                  <span className="sm:hidden">{DAY_NAMES_SHORT[i]}</span>
                  <span className="hidden sm:inline">{DAY_NAMES[i]}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-t border-l border-line/70">
              {cells.map((day, i) => (
                <button
                  key={i}
                  onClick={() => day && onDayClick(day)}
                  disabled={!day}
                  className={`
                    relative h-12 sm:h-16 md:h-20 border-r border-b border-line/70 p-1 sm:p-1.5 text-left transition-all duration-150
                    ${day ? "cursor-pointer hover:bg-cream-dark/40 active:bg-cream-dark/60" : ""}
                    ${isCurrentMonth && day === currentDay ? "bg-cream-dark/50" : ""}
                  `}
                >
                  {day && (
                    <span className={`
                      text-xs sm:text-sm font-medium
                      ${isCurrentMonth && day === currentDay
                        ? "text-ink-dark font-bold relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[1.5px] after:bg-ink-dark/40"
                        : "text-ink-dark/80"
                      }
                    `}>
                      {day}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-56 xl:w-64 space-y-4 sm:space-y-5">
            {/* Monthly Goals */}
            <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
                Monthly Goals
              </h3>
              <textarea
                value={monthlyGoals}
                onChange={(e) => onGoalsChange(e.target.value)}
                className="w-full bg-transparent text-ink-dark text-xs sm:text-sm font-sans resize-none lined-textarea h-[84px] sm:h-[112px] px-0.5"
                placeholder="What do you want to achieve?"
              />
            </div>

            {/* Monthly Tasks */}
            <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
                Monthly Tasks
              </h3>
              <div className="space-y-0">
                {monthlyTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2 h-6 sm:h-7">
                    <button
                      onClick={() => onTaskToggle(idx)}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border cursor-pointer flex-shrink-0 transition-colors ${
                        task.done ? "bg-ink border-ink" : "border-ink-light hover:border-ink"
                      }`}
                    />
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) => onTaskChange(idx, e.target.value)}
                      className={`flex-1 bg-transparent text-[11px] sm:text-xs font-sans border-b border-line/30 pb-0.5 min-w-0 ${
                        task.done ? "text-ink-light line-through" : "text-ink-dark"
                      }`}
                      placeholder="..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="border border-line/60 rounded-sm p-2.5 sm:p-3">
              <h3 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-ink font-semibold mb-1.5 pb-1 border-b border-line/40">
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="w-full bg-transparent text-ink-dark text-xs sm:text-sm font-sans resize-none lined-textarea h-[84px] sm:h-[112px] px-0.5"
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
