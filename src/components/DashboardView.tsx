"use client";

import React, { useEffect, useState } from "react";
import { Award, Flame, Play, AlertCircle, Bookmark, Star, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { UserProgressState, Question } from "@/utils/leitner";
import ProgressRing from "./ProgressRing";

interface DashboardViewProps {
  state: UserProgressState;
  questions: Question[];
  onStartStudy: (mode: "all" | "box1" | "starred" | "new" | "repetition") => void;
  setActiveTab: (tab: "dashboard" | "study" | "questions" | "analytics") => void;
}

export default function DashboardView({
  state,
  questions,
  onStartStudy,
  setActiveTab,
}: DashboardViewProps) {
  const [greeting, setGreeting] = useState("Muraho");
  
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 12) setGreeting("Mwaramutse");
    else if (hr >= 12 && hr < 18) setGreeting("Mwiriwe");
    else setGreeting("Mwiriwe neza");
  }, []);

  const totalQuestions = questions.length;
  const completedCount = state.completedIds.length;
  const progressPercentage = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;
  
  // Calculate today's completed questions count from history
  const todayStr = new Date().toISOString().split("T")[0];
  const todayHistory = state.history.find((h) => h.date === todayStr);
  const todayCompleted = todayHistory ? todayHistory.totalCount : 0;
  const dailyTargetProgress = Math.min(100, (todayCompleted / state.dailyTargetCount) * 100);

  // Check counts in each Leitner Box
  const box1Count = state.boxes[1].length;
  const box2Count = state.boxes[2].length;
  const box3Count = state.boxes[3].length;
  const box4Count = state.boxes[4].length;
  const box5Count = state.boxes[5].length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-6 pb-6"
    >
      {/* Header Greeting Section */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow">
            {greeting}, Umunyamuryango!
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Wige amategeko y'umuhanda mu buryo bwiza.
          </p>
        </div>
        {/* Streak Flame Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.15)]"
        >
          <Flame size={18} className="fill-amber-500 animate-bounce" />
          <span className="text-sm font-black tracking-tight">{state.streakCount} D</span>
        </motion.div>
      </div>

      {/* Progress Circular & Quick Stats Panel */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex-shrink-0">
          <ProgressRing
            progress={progressPercentage}
            size={160}
            strokeWidth={12}
            centerText={`${completedCount}/${totalQuestions}`}
            subText="BIMAZWE"
          />
        </div>
        
        <div className="flex-1 w-full flex flex-col justify-center gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white leading-tight">Intego ya buri munsi</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Ugomba kwiga ibibazo {state.dailyTargetCount} buri munsi kugira ngo urangize mu byumweru 2!
            </p>
          </div>
          
          {/* Daily Progress Target Indicator Bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Ibigezweho uyu munsi</span>
              <span className="text-primary">{todayCompleted} / {state.dailyTargetCount}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dailyTargetProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  dailyTargetProgress >= 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-primary"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Study CTA Callouts */}
      <div className="flex flex-col gap-3">
        {box1Count > 0 ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartStudy("box1")}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-white font-extrabold text-sm flex items-center justify-between shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_24px_-4px_rgba(16,185,129,0.6)] hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <Play size={18} fill="currentColor" />
              <div className="text-left">
                <span className="block font-black leading-none">Subira mu byo wize</span>
                <span className="text-[10px] text-emerald-900/80 font-bold uppercase tracking-wider mt-0.5 block">
                  Ibibazo {box1Count} biri muri Box 1
                </span>
              </div>
            </div>
            <Award size={20} />
          </motion.button>
        ) : (
          <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-primary flex items-start gap-3 select-none">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="block font-black text-xs">Yego kabisa! Box 1 iruzuye neza!</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Nta bibazo bikiri muri Box 1. Ibuka gushyiramo ibishya kugira ngo ugende neza!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Master New Questions Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onStartStudy("new")}
            className="p-4 rounded-2xl glass-panel-interactive text-left flex flex-col justify-between gap-6"
          >
            <Play size={20} className="text-secondary" fill="currentColor" />
            <div>
              <span className="block font-black text-sm text-white">Ibibazo Bishya</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Iga ibikiri bishya
              </span>
            </div>
          </motion.button>

          {/* Starred Questions Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (state.starredIds.length > 0) {
                onStartStudy("starred");
              } else {
                setActiveTab("questions");
              }
            }}
            className="p-4 rounded-2xl glass-panel-interactive text-left flex flex-col justify-between gap-6"
          >
            <Star
              size={20}
              className={state.starredIds.length > 0 ? "text-amber-500 fill-amber-500" : "text-slate-500"}
            />
            <div>
              <span className="block font-black text-sm text-white">Ibibazo wahanze</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                {state.starredIds.length} Ibibazo bikarambye
              </span>
            </div>
          </motion.button>
        </div>

        {/* Premium Repetition Mode Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onStartStudy("repetition")}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-secondary to-indigo-500 text-white font-extrabold text-sm flex items-center justify-between shadow-[0_8px_20px_-6px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(99,102,241,0.5)] hover:brightness-105 active:scale-[0.99] transition-all mt-1"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} fill="currentColor" className="text-amber-200" />
            <div className="text-left">
              <span className="block font-black leading-none text-white">Gusubiramo: Ibibazo 30 (Repetition)</span>
              <span className="text-[10px] text-indigo-100/80 font-bold uppercase tracking-wider mt-0.5 block">
                Gusubiramo no kwimenyereza ibibazo 30 bidsatuye
              </span>
            </div>
          </div>
          <Flame size={20} className="text-amber-300 fill-amber-400" />
        </motion.button>
      </div>

      {/* Leitner Box Matrix Grid */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase drop-shadow-sm select-none">
          Leitner Boxes (Ahabitswe Ibibazo)
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 1, label: "Daily", count: box1Count, active: true },
            { num: 2, label: "2 Days", count: box2Count, active: false },
            { num: 3, label: "4 Days", count: box3Count, active: false },
            { num: 4, label: "7 Days", count: box4Count, active: false },
            { num: 5, label: "Mastered", count: box5Count, active: false, highlight: true },
          ].map((box) => (
            <div
              key={box.num}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow ${
                box.highlight && box.count > 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-primary shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]"
                  : box.active && box.count > 0
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-400"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 tracking-wide select-none">BOX {box.num}</span>
              <span className="text-lg font-black tracking-tight my-1 text-white">{box.count}</span>
              <span className="text-[8px] font-black uppercase text-slate-400 select-none">{box.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
