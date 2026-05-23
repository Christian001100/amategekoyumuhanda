"use client";

import React, { useState, useEffect } from "react";
import { X, Star, ArrowRight, CheckCircle2, AlertCircle, Award, RefreshCcw, Timer as ClockIcon, Eye, EyeOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProgressState, Question, submitAnswer, toggleStarred } from "@/utils/leitner";
import SignRenderer from "./SignRenderer";

interface StudyViewProps {
  state: UserProgressState;
  questions: Question[];
  studyMode:
    | "all"
    | "box1"
    | "starred"
    | "new"
    | "repetition"
    | "group1"
    | "group2"
    | "group3"
    | "group4"
    | "group5"
    | "group6";
  onUpdateState: (newState: UserProgressState) => void;
  onClose: () => void;
}

export default function StudyView({
  state,
  questions,
  studyMode,
  onUpdateState,
  onClose,
}: StudyViewProps) {
  const [queue, setQueue] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [revealAnswersImmediately, setRevealAnswersImmediately] = useState(false);
  const [sessionReview, setSessionReview] = useState<
    Array<{
      question: Question;
      selectedOption: string | null;
      isCorrect: boolean;
    }>
  >([]);

  // 1. Generate study queue based on mode
  useEffect(() => {
    let list: Question[] = [];
    let isSequential = false;
    
    if (studyMode === "box1") {
      // Study questions currently assigned to Box 1
      list = questions.filter((q) => state.boxes[1].includes(q.id));
    } else if (studyMode === "starred") {
      // Study starred questions
      list = questions.filter((q) => state.starredIds.includes(q.id));
    } else if (studyMode === "new") {
      // Study new questions (those that are still in Box 1 and have never been answered correctly/completed)
      list = questions.filter(
        (q) => state.boxes[1].includes(q.id) && !state.completedIds.includes(q.id)
      );
    } else if (studyMode.startsWith("group")) {
      isSequential = true;
      const grpNum = parseInt(studyMode.replace("group", ""), 10);
      const start = (grpNum - 1) * 30 + 1;
      const end = grpNum === 6 ? 999 : grpNum * 30;
      list = questions.filter((q) => q.originalNum >= start && q.originalNum <= end);
    } else {
      // Fallback / all questions / repetition
      list = [...questions];
    }

    // Process the list queue (limit to 30 for repetition/groups, 15 for Leitner boxes)
    const limit = (studyMode === "repetition" || studyMode.startsWith("group")) ? 30 : 15;
    
    let processed = [...list];
    if (isSequential) {
      // Sort sequentially to match original PDF sheets
      processed.sort((a, b) => a.originalNum - b.originalNum);
    } else {
      // Shuffle for active recall efficacy
      processed.sort(() => Math.random() - 0.5);
    }

    const shuffled = processed.slice(0, limit);
    setQueue(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIsSessionComplete(shuffled.length === 0);
    setTimeLeft(60);
    setSessionReview([]);
    setRevealAnswersImmediately(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyMode, questions]);

  // 2. Timer countdown effect
  useEffect(() => {
    if (!timerEnabled || isAnswered || isSessionComplete || queue.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, isAnswered, isSessionComplete, queue, currentIndex]);

  // Decoupled effect to watch timeLeft hitting 0 safely
  useEffect(() => {
    if (timerEnabled && timeLeft === 0 && !isAnswered && !isSessionComplete && queue.length > 0) {
      handleTimeout();
    }
  }, [timeLeft, timerEnabled, isAnswered, isSessionComplete]);

  // 3. Reveal answers immediately in Revision Mode
  useEffect(() => {
    if (revealAnswersImmediately && queue.length > 0 && !isAnswered && !isSessionComplete) {
      const letter = currentQ.answer.toLowerCase();
      setSelectedOption(letter);
      setIsAnswered(true);

      setSessionReview((prev) => [
        ...prev,
        { question: currentQ, selectedOption: letter, isCorrect: true }
      ]);
    }
  }, [revealAnswersImmediately, currentIndex, queue, isAnswered, isSessionComplete]);

  const handleTimeout = () => {
    setSelectedOption(null);
    setIsAnswered(true);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 80, 100]);
    }

    setSessionReview((prev) => [
      ...prev,
      { question: currentQ, selectedOption: null, isCorrect: false }
    ]);

    const nextState = submitAnswer(currentQ.id, false, state);
    onUpdateState(nextState);
  };

  if (queue.length === 0 && !isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] gap-4">
        <AlertCircle size={48} className="text-amber-500 animate-bounce" />
        <h2 className="text-xl font-black text-white">Nta bibazo bibonetse!</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Nta bibazo bihari bihuye n'ubu buryo bwo kwiga wahisemo. Subira inyuma uhitemo ubundi buryo!
        </p>
        <button onClick={onClose} className="mt-4 px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-extrabold text-sm hover:bg-slate-800">
          Subira Inyuma
        </button>
      </div>
    );
  }

  const currentQ = queue[currentIndex];

  const handleSelectOption = (letter: string) => {
    if (isAnswered) return;
    setSelectedOption(letter);
    setIsAnswered(true);

    const isCorrect = letter === currentQ.answer;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // Haptic single short pulse for correct answer
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(60);
      }
    } else {
      // Haptic double-pulse vibration for incorrect answer
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 80, 100]);
      }
    }

    setSessionReview((prev) => [
      ...prev,
      { question: currentQ, selectedOption: letter, isCorrect: isCorrect }
    ]);

    // Submit back to Leitner state engine
    const nextState = submitAnswer(currentQ.id, isCorrect, state);
    onUpdateState(nextState);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(60);
    
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSessionComplete(true);
    }
  };

  const isStarred = currentQ && state.starredIds.includes(currentQ.id);
  const handleToggleStar = () => {
    const nextState = toggleStarred(currentQ.id, state);
    onUpdateState(nextState);
  };

  // 2. Victory Celebration Panel
  if (isSessionComplete) {
    const scorePct = queue.length > 0 ? (correctCount / queue.length) * 100 : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-6 text-center gap-6 min-h-[70vh]"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Award size={48} className="animate-spin-slow" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            Uyu munsi wakoze neza!
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Umutwe wungutse ubumenyi buhambaye.
          </p>
        </div>

        {/* Scoring Matrix */}
        <div className="w-full max-w-xs glass-panel rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400 font-bold">Ibibazo byose</span>
            <span className="text-sm font-black text-white">{queue.length}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400 font-bold">Ibyo watsinze</span>
            <span className="text-sm font-black text-primary">{correctCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">Ijanisha</span>
            <span className={`text-sm font-black ${scorePct >= 70 ? "text-primary" : "text-amber-500"}`}>
              {Math.round(scorePct)}%
            </span>
          </div>
        </div>

        {/* Victory CTAs */}
        <div className="flex flex-col w-full max-w-xs gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-extrabold text-sm hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)]"
          >
            Subira Ahabanza
          </button>
        </div>

        {/* Detailed Session Review Accordion list */}
        {sessionReview.length > 0 && (
          <div className="w-full mt-6 text-left max-w-md mx-auto">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 px-1">
              <Sparkles size={14} className="text-primary fill-primary/20" />
              <span>Gusuzuma Ibyo Wasubije (Session Review)</span>
            </h3>
            <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-slate-800">
              {sessionReview.map((rec, idx) => {
                const q = rec.question;
                const optCorrect = q.options.find(o => o.letter.toLowerCase() === q.answer.toLowerCase());
                const optSelected = q.options.find(o => o.letter.toLowerCase() === rec.selectedOption);

                return (
                  <div
                    key={`${q.id}-${idx}`}
                    className={`p-4 rounded-2xl border text-left flex flex-col gap-2 ${
                      rec.isCorrect
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase select-none ${
                        rec.isCorrect
                          ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/25 text-red-400"
                      }`}>
                        Ikibazo {q.originalNum} — {rec.isCorrect ? "Yego (Correct)" : "Ikosa (Wrong)"}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold select-none">
                        Urupapuro {q.page}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white leading-relaxed select-text mt-1">
                      {q.question}
                    </p>

                    {/* Display mapped official sign crop if applicable */}
                    {q.hasImage && q.imagePath && (() => {
                      const basePath = typeof window !== "undefined" && window.location.pathname.startsWith("/amategekoyumuhanda")
                        ? "/amategekoyumuhanda"
                        : "";
                      const fullImagePath = q.imagePath.startsWith("http") ? q.imagePath : `${basePath}${q.imagePath}`;
                      return (
                        <div className="my-1.5 self-start bg-white p-1 rounded border border-slate-800 shadow-sm max-w-[80px]">
                          <img src={fullImagePath} alt="" className="max-h-12 object-contain" />
                        </div>
                      );
                    })()}

                    <div className="text-[10px] flex flex-col gap-1.5 mt-1 border-t border-slate-800/40 pt-2 font-medium">
                      {rec.selectedOption ? (
                        <div className="flex gap-1.5">
                          <span className="text-slate-400">Wahisemo (You picked):</span>
                          <span className={rec.isCorrect ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            ({rec.selectedOption.toUpperCase()}) {optSelected?.text}
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <span className="text-red-400 font-bold">Igihe cyarangiye (Timed Out)</span>
                        </div>
                      )}

                      {!rec.isCorrect && (
                        <div className="flex gap-1.5 items-start">
                          <span className="text-slate-400 font-bold">Igisubizo (Correct):</span>
                          <span className="text-emerald-400 font-bold">
                            ({q.answer.toUpperCase()}) {optCorrect?.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Calculate session percentage
  const sessionProgress = ((currentIndex) / queue.length) * 100;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Session Top Controller */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Horizontal Mini Session Progress Bar */}
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
            <span>Uburyo: {studyMode.startsWith("group") ? `Group ${studyMode.replace("group", "")} (PDF)` : studyMode === "box1" ? "Review Box 1" : studyMode === "new" ? "New Questions" : "Quiz"}</span>
            <span>{currentIndex + 1} / {queue.length}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800/50">
            <div className="h-full bg-primary" style={{ width: `${sessionProgress}%` }} />
          </div>

          {/* Glowing Animated Countdown Bar */}
          {timerEnabled && !isAnswered && (
            <div className="w-full h-1 bg-slate-950 overflow-hidden border border-slate-900 rounded-full mt-2">
              <motion.div
                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full rounded-full ${
                  timeLeft > 30
                    ? "bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : timeLeft > 10
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                }`}
              />
            </div>
          )}
        </div>

        {/* Controls on the Right: Stopwatch Timer Toggle + Star Favorite Toggle */}
        <div className="flex items-center gap-2 select-none">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1.5 px-2">
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`p-0.5 rounded transition-colors ${
                timerEnabled
                  ? timeLeft > 10
                    ? "text-primary hover:text-primary/80"
                    : "text-red-500 animate-bounce"
                  : "text-slate-600 hover:text-slate-500"
              }`}
            >
              <ClockIcon size={16} />
            </button>
            {timerEnabled && (
              <span
                className={`text-[10px] font-black tracking-tighter w-5 text-center tabular-nums ${
                  timeLeft > 10 ? "text-white" : "text-red-500 animate-pulse"
                }`}
              >
                {timeLeft}s
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (revealAnswersImmediately) {
                setIsAnswered(false);
                setSelectedOption(null);
                setRevealAnswersImmediately(false);
              } else {
                setRevealAnswersImmediately(true);
              }
            }}
            className={`p-2 rounded-lg border transition-colors ${
              revealAnswersImmediately
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
            }`}
            title={revealAnswersImmediately ? "Hisha ibisubizo (Hide Answers)" : "Soma ibisubizo (Show Answers)"}
          >
            {revealAnswersImmediately ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleStar}
            className={`p-2 rounded-lg border transition-colors ${
              isStarred
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
            }`}
          >
            <Star size={18} fill={isStarred ? "currentColor" : "transparent"} />
          </motion.button>
        </div>
      </div>

      {/* Active Question Flashcard Frame with Premium Buttery-Smooth Spring Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.8 }}
          className="flex flex-col gap-4"
        >
          {/* Question Text & Layout Details */}
          <div className="glass-panel rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-black tracking-wider uppercase select-none">
                Ikibazo {currentQ.originalNum}
              </span>
              <span className="text-[9px] text-slate-500 font-bold select-none">
                Urupapuro {currentQ.page}
              </span>
            </div>
            
            <h3 className="text-sm font-extrabold text-white leading-relaxed select-text">
              {currentQ.question}
            </h3>

            {/* Render road signs/situations dynamically if applicable */}
            {currentQ.hasImage && (
              <div className="mt-4">
                <SignRenderer questionText={currentQ.question} originalNum={currentQ.originalNum} />
              </div>
            )}
          </div>

          {/* Multiple Choices List */}
          <div className="flex flex-col gap-2.5">
            {currentQ.options.map((opt) => {
              const letter = opt.letter.toLowerCase();
              const isSelected = selectedOption === letter;
              const isCorrectAnswer = letter === currentQ.answer.toLowerCase();
              
              // Styling dynamic tokens based on answer status
              let buttonStyle = "bg-slate-900/50 border-slate-800 text-slate-200 hover:bg-slate-900/80 active:scale-[0.99]";
              let iconEl = null;

              if (isAnswered) {
                if (isCorrectAnswer) {
                  // Always show the correct answer in glowing emerald
                  buttonStyle = "bg-primary/15 border-primary text-primary shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                  iconEl = <CheckCircle2 size={16} className="text-primary flex-shrink-0" />;
                } else if (isSelected) {
                  // User selected wrong answer
                  buttonStyle = "bg-danger/15 border-danger text-danger shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                  iconEl = <AlertCircle size={16} className="text-danger flex-shrink-0" />;
                } else {
                  // Non-selected wrong answer dim down
                  buttonStyle = "bg-slate-950/20 border-slate-900/60 text-slate-500 opacity-60";
                }
              }

              return (
                <motion.button
                  key={letter}
                  whileTap={{ scale: isAnswered ? 1 : 0.985 }}
                  onClick={() => handleSelectOption(letter)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between text-left gap-3 transition-all duration-200 ${buttonStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border uppercase flex-shrink-0 ${
                      isAnswered
                        ? isCorrectAnswer
                          ? "bg-primary/20 border-primary text-primary"
                          : isSelected
                          ? "bg-danger/20 border-danger text-danger"
                          : "bg-slate-950 border-slate-800 text-slate-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 group-hover:text-white"
                    }`}>
                      {letter}
                    </span>
                    <span className="text-xs font-bold leading-relaxed">{opt.text}</span>
                  </div>
                  {iconEl}
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Feedback Panel (Manual Continue + Correct Answer Display) */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`mt-2 p-5 rounded-2xl border flex flex-col gap-4 shadow-lg ${
                  selectedOption === currentQ.answer.toLowerCase()
                    ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                    : "bg-red-500/10 border-red-500/35 text-red-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  {selectedOption === currentQ.answer.toLowerCase() ? (
                    <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                      {selectedOption === currentQ.answer.toLowerCase() ? "Watsinze neza! (Correct)" : "Habaye ikosa! (Incorrect)"}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {selectedOption === currentQ.answer.toLowerCase() ? (
                        "Wahisemo igisubizo cy'ukuri neza. Komeza ku kibazo gikurikira!"
                      ) : selectedOption === null ? (
                        <span>
                          Nta gihishe wahisemo kubera ko <strong>igihe cyarangiye</strong>! Igisubizo cy'ukuri cyari:{" "}
                          <span className="text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-1">
                            ({currentQ.answer.toUpperCase()}) {
                              currentQ.options.find(opt => opt.letter.toLowerCase() === currentQ.answer.toLowerCase())?.text || ""
                            }
                          </span>
                        </span>
                      ) : (
                        <span>
                          Igihishe wahisemo ni kibi. Igisubizo cy'ukuri cyari:{" "}
                          <span className="text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-1">
                            ({currentQ.answer.toUpperCase()}) {
                              currentQ.options.find(opt => opt.letter.toLowerCase() === currentQ.answer.toLowerCase())?.text || ""
                            }
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Manual Continue Button */}
                <button
                  onClick={handleNext}
                  className={`w-full py-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    selectedOption === currentQ.answer.toLowerCase()
                      ? "bg-primary text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:brightness-105"
                      : "bg-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:brightness-105"
                  }`}
                >
                  <span>Komeza Usubiremo</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
