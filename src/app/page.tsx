"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Cover from "@/components/Cover";
import MonthlySpread from "@/components/MonthlySpread";
import DailyPage from "@/components/DailyPage";
import LoginScreen from "@/components/LoginScreen";
import { useAuth } from "@/components/AuthProvider";
import { saveData, loadData, signOut } from "@/lib/firebase";
import { LogOut } from "lucide-react";

type View = "cover" | "monthly" | "daily";

interface MonthData {
  goals: string;
  tasks: { text: string; done: boolean }[];
  notes: string;
}

interface TodoItem {
  text: string;
  done: boolean;
}

interface DayData {
  priorities: string;
  todo: TodoItem[];
  intention: string;
  schedule: { time: string; task: string }[];
  notes: string;
  drawing: string;
}

// 5 AM to 12 AM (midnight) = 20 time slots
const DEFAULT_SCHEDULE = [
  "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM",
].map((time) => ({ time, task: "" }));

const DEFAULT_MONTHLY_TASKS = Array.from({ length: 8 }, () => ({ text: "", done: false }));
const DEFAULT_TODO_ITEMS: TodoItem[] = Array.from({ length: 6 }, () => ({ text: "", done: false }));

function mKey(year: number, month: number) { return `${year}-${month}`; }
function dKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }

/** Ensure todo is always a properly shaped TodoItem[] */
function normalizeTodo(todo: any): TodoItem[] {
  // If it's a plain string (old format), convert lines to items
  if (typeof todo === "string") {
    const lines = (todo as string).split("\n").filter((l: string) => l.trim());
    if (lines.length > 0) {
      const items = lines.map((text: string) => ({ text, done: false }));
      // Pad to at least 6 items
      while (items.length < 6) items.push({ text: "", done: false });
      return items;
    }
    return Array.from({ length: 6 }, () => ({ text: "", done: false }));
  }
  // If it's an array, ensure each item has proper shape
  if (Array.isArray(todo)) {
    const items = todo.map((item: any) => {
      if (typeof item === "string") return { text: item, done: false };
      if (item && typeof item === "object") return { text: item.text || "", done: !!item.done };
      return { text: "", done: false };
    });
    while (items.length < 6) items.push({ text: "", done: false });
    return items;
  }
  // Fallback
  return Array.from({ length: 6 }, () => ({ text: "", done: false }));
}

export default function Home() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [view, setView] = useState<View>("cover");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [monthData, setMonthData] = useState<MonthData>({
    goals: "", tasks: [...DEFAULT_MONTHLY_TASKS], notes: "",
  });
  const [dayData, setDayData] = useState<DayData>({
    priorities: "", todo: [...DEFAULT_TODO_ITEMS], intention: "",
    schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s })),
    notes: "", drawing: "",
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  // Load month data
  useEffect(() => {
    if (!isClient || !user) return;
    const key = mKey(currentYear, currentMonth);
    loadData<MonthData>("months", key, {
      goals: "", tasks: [...DEFAULT_MONTHLY_TASKS], notes: "",
    }).then(setMonthData);
  }, [currentMonth, currentYear, isClient, user]);

  // Save month data (debounced)
  useEffect(() => {
    if (!isClient || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const key = mKey(currentYear, currentMonth);
      saveData("months", key, monthData);
    }, 800);
  }, [monthData, currentMonth, currentYear, isClient, user]);

  // Load day data
  useEffect(() => {
    if (!isClient || !user) return;
    const key = dKey(selectedDate);
    loadData<DayData>("days", key, {
      priorities: "", todo: [...DEFAULT_TODO_ITEMS], intention: "",
      schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s })),
      notes: "", drawing: "",
    }).then((loaded) => {
      loaded.todo = normalizeTodo(loaded.todo);
      setDayData(loaded);
    });
  }, [selectedDate, isClient, user]);

  // Save day data (debounced)
  useEffect(() => {
    if (!isClient || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const key = dKey(selectedDate);
      // Don't save drawing to Firebase (too large), keep in localStorage
      const { drawing, ...rest } = dayData;
      saveData("days", key, rest);
      // Save drawing to localStorage separately
      try {
        if (drawing) {
          localStorage.setItem(`drawing-${key}`, drawing);
        }
      } catch { /* empty */ }
    }, 800);
  }, [dayData, selectedDate, isClient, user]);

  // Load drawing from localStorage when date changes
  useEffect(() => {
    if (!isClient) return;
    const key = dKey(selectedDate);
    try {
      const d = localStorage.getItem(`drawing-${key}`);
      if (d) setDayData((prev) => ({ ...prev, drawing: d }));
    } catch { /* empty */ }
  }, [selectedDate, isClient]);

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setView("daily");
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };
  const handlePrevDay = () => {
    const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
    setSelectedDate(d); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
    setSelectedDate(d); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
  };

  if (!isClient || loading) return <div className="min-h-[100dvh] bg-[#1a1a1e]" />;

  // Show login if not authenticated
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <LoginScreen key="login" />
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* User avatar + sign out button */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gold/30 shadow-md"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg
            bg-black/30 hover:bg-black/50 border border-gold/15 hover:border-gold/30
            text-gold/50 hover:text-gold/80 transition-all duration-200 cursor-pointer backdrop-blur-sm"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[10px] sm:text-xs font-sans hidden sm:inline">Sign out</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "cover" && (
          <Cover key="cover" onOpen={() => setView("monthly")} />
        )}

        {view === "monthly" && (
          <MonthlySpread
            key={`m-${currentYear}-${currentMonth}`}
            month={currentMonth} year={currentYear}
            onDayClick={handleDayClick}
            monthlyGoals={monthData.goals} monthlyTasks={monthData.tasks} notes={monthData.notes}
            onGoalsChange={(v) => setMonthData((p) => ({ ...p, goals: v }))}
            onTaskToggle={(i) => setMonthData((p) => ({ ...p, tasks: p.tasks.map((t, idx) => idx === i ? { ...t, done: !t.done } : t) }))}
            onTaskChange={(i, text) => setMonthData((p) => ({ ...p, tasks: p.tasks.map((t, idx) => idx === i ? { ...t, text } : t) }))}
            onNotesChange={(v) => setMonthData((p) => ({ ...p, notes: v }))}
            onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
            onBackToCover={() => setView("cover")}
          />
        )}

        {view === "daily" && (
          <DailyPage
            key={`d-${selectedDate.toISOString()}`}
            date={selectedDate}
            priorities={dayData.priorities} todoItems={dayData.todo} intention={dayData.intention}
            schedule={dayData.schedule} dailyNotes={dayData.notes} drawingData={dayData.drawing}
            onPrioritiesChange={(v) => setDayData((p) => ({ ...p, priorities: v }))}
            onTodoToggle={(i) => setDayData((p) => { const todos = normalizeTodo(p.todo); return { ...p, todo: todos.map((t, idx) => idx === i ? { ...t, done: !t.done } : t) }; })}
            onTodoTextChange={(i, text) => setDayData((p) => { const todos = normalizeTodo(p.todo); return { ...p, todo: todos.map((t, idx) => idx === i ? { ...t, text } : t) }; })}
            onIntentionChange={(v) => setDayData((p) => ({ ...p, intention: v }))}
            onScheduleChange={(i, task) => setDayData((p) => ({ ...p, schedule: p.schedule.map((s, idx) => idx === i ? { ...s, task } : s) }))}
            onNotesChange={(v) => setDayData((p) => ({ ...p, notes: v }))}
            onDrawingChange={(v) => setDayData((p) => ({ ...p, drawing: v }))}
            onBack={() => setView("monthly")}
            onPrevDay={handlePrevDay} onNextDay={handleNextDay}
          />
        )}
      </AnimatePresence>
    </>
  );
}
