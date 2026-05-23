"use client";

import React from "react";
import { Folder, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { UserProgressState, Question } from "@/utils/leitner";

interface RepetitionViewProps {
  state: UserProgressState;
  questions: Question[];
  onStartStudy: (mode: "group1" | "group2" | "group3" | "group4" | "group5" | "group6") => void;
}

export default function RepetitionView({ state, questions, onStartStudy }: RepetitionViewProps) {
  // Define static groups corresponding to the PDF ranges
  const groups = [
    { id: "group1" as const, title: "Itsinda rya 1 (Group 1)", start: 1, end: 30, color: "from-emerald-500 to-teal-400" },
    { id: "group2" as const, title: "Itsinda rya 2 (Group 2)", start: 31, end: 60, color: "from-indigo-500 to-purple-400" },
    { id: "group3" as const, title: "Itsinda rya 3 (Group 3)", start: 61, end: 90, color: "from-blue-500 to-cyan-400" },
    { id: "group4" as const, title: "Itsinda rya 4 (Group 4)", start: 91, end: 120, color: "from-amber-500 to-orange-400" },
    { id: "group5" as const, title: "Itsinda rya 5 (Group 5)", start: 121, end: 150, color: "from-rose-500 to-pink-400" },
    { id: "group6" as const, title: "Itsinda rya 6 (Group 6)", start: 151, end: 999, label: "151+", color: "from-violet-500 to-fuchsia-400" },
  ];

  // Helper to calculate exact progress statistics for each static question block
  const getGroupProgress = (start: number, end: number) => {
    const groupQs = questions.filter(
      (q) => q.originalNum >= start && q.originalNum <= end
    );
    if (groupQs.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completedCount = groupQs.filter((q) => state.completedIds.includes(q.id)).length;
    return {
      completed: completedCount,
      total: groupQs.length,
      percentage: Math.round((completedCount / groupQs.length) * 100),
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6 select-none"
    >
      {/* Premium Informational Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-950/20 relative overflow-hidden flex flex-col gap-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
          <Sparkles size={14} className="fill-primary/20 animate-pulse" />
          <span>Gusubiramo mu Matsinda (Grouped Repetition)</span>
        </div>
        <h2 className="text-base font-black text-white leading-snug">
          Ibibazo 30 mu Gatsiko kamwe
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
          Ibi bibazo byagabanyijwe mu matsinda ya 30 kugira ngo ubone uko ubisoma no kwimenyereza byoroshye. Nyuma yo gusoma urupapuro rwa PDF rushinzwe itsinda ryawe, uza hano ugakora imyitozo ihuye neza naryo!
        </p>
      </div>

      {/* Grid Layout for Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((grp) => {
          const stats = getGroupProgress(grp.start, grp.end);
          const isFinished = stats.completed === stats.total && stats.total > 0;

          return (
            <motion.div
              key={grp.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="glass-panel-interactive rounded-2xl p-5 border border-slate-800/60 flex flex-col justify-between gap-5 relative overflow-hidden group"
            >
              {/* Subtle background glow mapping folder color */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${grp.color} opacity-[0.03] rounded-full blur-xl pointer-events-none group-hover:opacity-[0.06] transition-opacity`} />

              {/* Folder Details */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grp.color} bg-opacity-15 border border-slate-800 flex items-center justify-center text-white shrink-0 shadow-md`}>
                  <Folder size={22} className="text-white fill-white/10 group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-white truncate leading-none">
                      {grp.title}
                    </h3>
                    {isFinished && (
                      <CheckCircle2 size={13} className="text-primary fill-primary/10 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1.5">
                    Ibibazo: {grp.label || `${grp.start} - ${grp.end}`}
                  </span>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="w-full">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5">
                  <span>Wize: {stats.completed} / {stats.total}</span>
                  <span className={isFinished ? "text-primary" : "text-slate-300"}>
                    {stats.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-900/65 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${grp.color} rounded-full transition-all duration-500`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>

              {/* Action Trigger */}
              <button
                onClick={() => onStartStudy(grp.id)}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 hover:border-slate-700/80 text-white font-extrabold text-xs flex items-center justify-center gap-2 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm"
              >
                <Play size={12} fill="currentColor" className="shrink-0" />
                <span>Tangira Kwitoza</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
