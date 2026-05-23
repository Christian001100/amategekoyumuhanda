"use client";

import React, { useMemo } from "react";
import { BarChart3, TrendingUp, Calendar, AlertCircle, RefreshCcw, Award } from "lucide-react";
import { motion } from "framer-motion";
import { UserProgressState, Question, resetProgress } from "@/utils/leitner";

interface AnalyticsViewProps {
  state: UserProgressState;
  questions: Question[];
  onUpdateState: (newState: UserProgressState) => void;
}

export default function AnalyticsView({
  state,
  questions,
  onUpdateState,
}: AnalyticsViewProps) {
  const totalQuestions = questions.length;
  const completedCount = state.completedIds.length;
  const progressPct = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  // 1. Calculate box counts and percentages
  const box1Count = state.boxes[1].length;
  const box2Count = state.boxes[2].length;
  const box3Count = state.boxes[3].length;
  const box4Count = state.boxes[4].length;
  const box5Count = state.boxes[5].length;

  const box1Pct = totalQuestions > 0 ? (box1Count / totalQuestions) * 100 : 0;
  const box2Pct = totalQuestions > 0 ? (box2Count / totalQuestions) * 100 : 0;
  const box3Pct = totalQuestions > 0 ? (box3Count / totalQuestions) * 100 : 0;
  const box4Pct = totalQuestions > 0 ? (box4Count / totalQuestions) * 100 : 0;
  const box5Pct = totalQuestions > 0 ? (box5Count / totalQuestions) * 100 : 0;

  // 2. 14-Day Timeline Projection Analysis
  // Calculate average daily rate required (404 questions / 14 days = 28.85 ~ 29 per day)
  const targetCompletedCount = Math.round((29 * state.streakCount));
  const isAheadOfSchedule = completedCount >= targetCompletedCount;
  const targetCompletedPct = totalQuestions > 0 ? (targetCompletedCount / totalQuestions) * 100 : 0;
  const scheduleDiff = completedCount - targetCompletedCount;

  // 3. Weekly velocity data extraction
  const weeklyVelocity = useMemo(() => {
    // Generate dates for past 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const weekdayStr = d.toLocaleDateString("rw", { weekday: "short" });
      
      const hist = state.history.find((h) => h.date === dateStr);
      result.push({
        dayName: weekdayStr,
        count: hist ? hist.totalCount : 0,
        correctCount: hist ? hist.correctCount : 0,
      });
    }
    return result;
  }, [state.history]);

  const maxVelocity = Math.max(...weeklyVelocity.map((v) => v.count), 10);

  // Total answers submitted in history
  const totalAnswersSubmitted = state.history.reduce((acc, h) => acc + h.totalCount, 0);
  const totalCorrectAnswers = state.history.reduce((acc, h) => acc + h.correctCount, 0);
  const correctRatio = totalAnswersSubmitted > 0 ? (totalCorrectAnswers / totalAnswersSubmitted) * 100 : 0;

  const handleReset = () => {
    if (confirm("Urareba ko ushaka gusiba ibyo wize byose? Ibi bizasubiza ibibazo byose muri Box 1!")) {
      const nextState = resetProgress(questions);
      onUpdateState(nextState);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-6 pb-6"
    >
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow">
            Raporo n'Imibare
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Reba uko utera imbere no kwizera kurihuta.
          </p>
        </div>
        {/* Reset progress */}
        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-danger hover:border-danger/30 transition-colors"
          title="Reset Study Progress"
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* 14-Day Mastery Projection Panel */}
      <div className="glass-panel rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-wider mb-3 select-none">
          <TrendingUp size={16} />
          <span>Igenzura ry’iminsi 14</span>
        </div>

        <h3 className="text-base font-extrabold text-white leading-snug">
          {progressPct >= 100
            ? "Wahaye intego yawe ishema! Warangije kwiga!"
            : isAheadOfSchedule
            ? `Wimbuye ibyo wize! Urikubura ibibazo ${Math.abs(scheduleDiff)} imbere y'igihe.`
            : `Guma ku muvuduko! Urakenera ibibazo ${Math.abs(scheduleDiff)} kugira ngo ugaruke ku ntego.`}
        </h3>

        {/* Schedule Projection Bar Slider */}
        <div className="w-full mt-4">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1.5 select-none">
            <span>Ijanisha ryerekana kwiga kwabo</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-900">
            {/* Linear Schedule Target Mark pointer */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-sky-500 z-10"
              style={{ left: `${Math.min(100, targetCompletedPct)}%` }}
              title="Target position for current day"
            />
            {/* Actual Completed Progress Bar */}
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 font-black tracking-wider uppercase mt-1 select-none">
            <span>Ahabanza (Day 1)</span>
            <span className="text-sky-500 font-bold">Uyu munsi intego ({Math.round(targetCompletedPct)}%)</span>
            <span>Intsinzi (Day 14)</span>
          </div>
        </div>
      </div>

      {/* Leitner Box Visual Distribution Bar Chart */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col gap-4 shadow-md">
        <div className="flex items-center justify-between select-none">
          <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase">
            Gukwirakwira kw'ibibazo
          </h3>
          <span className="text-[9px] text-slate-500 font-extrabold">Ibipimo muri Leitner</span>
        </div>

        {/* Stacked Percentage visual bar */}
        <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-950 border border-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          {box1Pct > 0 && <div className="h-full bg-amber-500" style={{ width: `${box1Pct}%` }} title={`Box 1: ${box1Count}`} />}
          {box2Pct > 0 && <div className="h-full bg-sky-500" style={{ width: `${box2Pct}%` }} title={`Box 2: ${box2Count}`} />}
          {box3Pct > 0 && <div className="h-full bg-purple-500" style={{ width: `${box3Pct}%` }} title={`Box 3: ${box3Count}`} />}
          {box4Pct > 0 && <div className="h-full bg-teal-500" style={{ width: `${box4Pct}%` }} title={`Box 4: ${box4Count}`} />}
          {box5Pct > 0 && <div className="h-full bg-primary" style={{ width: `${box5Pct}%` }} title={`Box 5: ${box5Count}`} />}
        </div>

        {/* Distribution Details Legend rows */}
        <div className="flex flex-col gap-2.5">
          {[
            { id: 1, label: "Box 1 — Review Daily", colorBg: "bg-amber-500", count: box1Count, pct: box1Pct },
            { id: 2, label: "Box 2 — Review Every 2 Days", colorBg: "bg-sky-500", count: box2Count, pct: box2Pct },
            { id: 3, label: "Box 3 — Review Every 4 Days", colorBg: "bg-purple-500", count: box3Count, pct: box3Pct },
            { id: 4, label: "Box 4 — Review Every 7 Days", colorBg: "bg-teal-500", count: box4Count, pct: box4Pct },
            { id: 5, label: "Box 5 — Mastered", colorBg: "bg-primary", count: box5Count, pct: box5Pct },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${item.colorBg} flex-shrink-0`} />
                <span className="text-[10px] font-bold text-slate-400 truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 select-none">
                <span className="text-[10px] text-white font-black">{item.count}</span>
                <span className="text-[9px] text-slate-600 font-bold">({Math.round(item.pct)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Study Velocity Bar Chart */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col gap-4 shadow-md">
        <div>
          <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase select-none">
            Ibibazo wize muri iki cyumweru
          </h3>
          <p className="text-[9px] text-slate-500 font-semibold mt-0.5 select-none">
            Umuvuduko w'isubiramo (Daily Question Review Velocity)
          </p>
        </div>

        {/* Dynamic bar charts */}
        <div className="h-28 flex items-end justify-between gap-2.5 pt-4 px-2 select-none">
          {weeklyVelocity.map((day, idx) => {
            const barHeight = `${Math.max(10, (day.count / maxVelocity) * 100)}%`;
            return (
              <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <div className="relative w-full h-full flex items-end justify-center group">
                  {/* Tooltip on hover */}
                  <span className="absolute -top-6 bg-slate-950 border border-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {day.count} Qs
                  </span>
                  
                  {/* Vertical bar cylinder */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                    className={`w-full rounded-t-lg bg-gradient-to-t ${
                      day.count > 0
                        ? "from-primary to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "from-slate-900 to-slate-800/80"
                    }`}
                  />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Secondary Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 select-none">
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-center gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Birebwa Byose</span>
          <span className="text-xl font-black text-white">{totalAnswersSubmitted}</span>
          <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">Ibisubizo watanze byose</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-center gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ijanisha ry'imitsindo</span>
          <span className="text-xl font-black text-primary">{Math.round(correctRatio)}%</span>
          <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">Ibisubizo by'ukuri byose</span>
        </div>
      </div>
    </motion.div>
  );
}
