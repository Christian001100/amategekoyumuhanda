"use client";

import React, { useState, useMemo } from "react";
import { Search, Star, ChevronDown, ChevronUp, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProgressState, Question, toggleStarred } from "@/utils/leitner";
import SignRenderer from "./SignRenderer";

interface QuestionsViewProps {
  state: UserProgressState;
  questions: Question[];
  onUpdateState: (newState: UserProgressState) => void;
}

type FilterType = "all" | "starred" | "incorrect" | "box1" | "box2" | "box3" | "box4" | "box5";

export default function QuestionsView({
  state,
  questions,
  onUpdateState,
}: QuestionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 1. Segmented filter pills configuration
  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "Zose", count: questions.length },
    { id: "starred", label: "Starred", count: state.starredIds.length },
    { id: "incorrect", label: "Incorrect", count: state.incorrectIds.length },
    { id: "box1", label: "Box 1", count: state.boxes[1].length },
    { id: "box2", label: "Box 2", count: state.boxes[2].length },
    { id: "box3", label: "Box 3", count: state.boxes[3].length },
    { id: "box4", label: "Box 4", count: state.boxes[4].length },
    { id: "box5", label: "Box 5", count: state.boxes[5].length },
  ];

  // 2. Perform filtering and searching in memory
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Apply active filter tab
      if (activeFilter === "starred" && !state.starredIds.includes(q.id)) return false;
      if (activeFilter === "incorrect" && !state.incorrectIds.includes(q.id)) return false;
      if (activeFilter === "box1" && !state.boxes[1].includes(q.id)) return false;
      if (activeFilter === "box2" && !state.boxes[2].includes(q.id)) return false;
      if (activeFilter === "box3" && !state.boxes[3].includes(q.id)) return false;
      if (activeFilter === "box4" && !state.boxes[4].includes(q.id)) return false;
      if (activeFilter === "box5" && !state.boxes[5].includes(q.id)) return false;

      // Apply text search matching query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesText = q.question.toLowerCase().includes(query);
        const matchesNum = q.originalNum.toString() === query;
        return matchesText || matchesNum;
      }

      return true;
    });
  }, [questions, activeFilter, state, searchQuery]);

  const handleToggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleToggleStar = (e: React.MouseEvent, questionId: number) => {
    e.stopPropagation(); // prevent expanding accordion row when star is tapped
    const nextState = toggleStarred(questionId, state);
    onUpdateState(nextState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-4 pb-6"
    >
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow">
          Gushakashaka Ibibazo
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Shakisha, urebe ibisubizo, unagaragaze ibyo gukosora cyane.
        </p>
      </div>

      {/* Floating Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Shakisha ikibazo cyangwa numero..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* Horizontal Segmented Filters Scrollable tray */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 select-none">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          if (filter.count === 0 && filter.id !== "all" && filter.id !== "starred") return null;

          return (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setExpandedId(null); // collapse accordions on switch
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black whitespace-nowrap border transition-all ${
                isActive
                  ? "bg-primary border-primary text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]"
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-slate-950 text-slate-500"
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions Scrollable Accordion List */}
      <div className="flex flex-col gap-2.5 mt-1">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.slice(0, 100).map((q) => {
            const isExpanded = expandedId === q.id;
            const isStarred = state.starredIds.includes(q.id);
            const isIncorrect = state.incorrectIds.includes(q.id);

            return (
              <div
                key={q.id}
                onClick={() => handleToggleExpand(q.id)}
                className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  isExpanded
                    ? "bg-slate-900/80 border-slate-800 shadow-md"
                    : "glass-panel-interactive border-slate-800/80"
                }`}
              >
                {/* Accordion Collapsed Row */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border flex-shrink-0 select-none ${
                      isIncorrect
                        ? "bg-danger/10 border-danger/20 text-danger"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}>
                      {q.originalNum}
                    </span>
                    <div className="min-w-0 mt-0.5">
                      <p className="text-xs font-extrabold text-white line-clamp-2 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Inline Star toggle */}
                    <button
                      onClick={(e) => handleToggleStar(e, q.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isStarred ? "text-amber-500" : "text-slate-600 hover:text-slate-500"
                      }`}
                    >
                      <Star size={16} fill={isStarred ? "currentColor" : "transparent"} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </div>

                {/* Accordion Expanded Details Frame */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="border-t border-slate-800/80 bg-slate-950/40"
                    >
                      <div className="p-4 flex flex-col gap-4">
                        {/* Rendering sign renderer inside expanding detail */}
                        {q.hasImage && (
                          <div className="w-full">
                            <SignRenderer questionText={q.question} originalNum={q.originalNum} />
                          </div>
                        )}

                        {/* List of Options with correct highlight */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 select-none mb-1">
                            Amahitamo (Choices)
                          </span>
                          {q.options.map((opt) => {
                            const isCorrect = opt.letter.toLowerCase() === q.answer.toLowerCase();
                            return (
                              <div
                                key={opt.letter}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2.5 leading-relaxed ${
                                  isCorrect
                                    ? "bg-primary/10 border-primary/20 text-primary shadow-[inset_0_0_10px_rgba(16,185,129,0.02)]"
                                    : "bg-slate-900/30 border-slate-800/80 text-slate-400"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black border uppercase flex-shrink-0 ${
                                  isCorrect ? "bg-primary/20 border-primary" : "bg-slate-950 border-slate-800"
                                }`}>
                                  {opt.letter}
                                </span>
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Source layout details footer */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-slate-900 pt-3 select-none">
                          <span>Igisubizo: <span className="text-primary font-black uppercase">{q.answer}</span></span>
                          <span>Urupapuro rwa PDF: {q.page}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/10 border border-slate-800/40 rounded-3xl gap-3 select-none">
            <AlertCircle size={28} className="text-slate-600" />
            <h4 className="text-sm font-black text-white">Nta kibazo kibonetse!</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">
              Gakora ku nteruro cyangwa imibare itandukanye na "{searchQuery}".
            </p>
          </div>
        )}

        {filteredQuestions.length > 100 && (
          <div className="text-center p-3">
            <p className="text-[10px] text-slate-500 font-bold">
              Kwereka ibibazo 100 bya mbere kubera umuvuduko. Shakisha kugira ngo ubindure!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
