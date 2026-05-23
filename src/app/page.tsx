"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Sparkles, LayoutDashboard, BrainCircuit, BookOpen, BarChart3, Layers } from "lucide-react";
import questionsData from "@/data/questions.json";
import { Question, UserProgressState, loadProgressState, saveProgressState } from "@/utils/leitner";
import Navbar, { NavTab } from "@/components/Navbar";
import DashboardView from "@/components/DashboardView";
import StudyView from "@/components/StudyView";
import QuestionsView from "@/components/QuestionsView";
import AnalyticsView from "@/components/AnalyticsView";
import RepetitionView from "@/components/RepetitionView";

// Safe cast of questions from JSON import
const typedQuestions = questionsData as Question[];

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [progressState, setProgressState] = useState<UserProgressState | null>(null);
  const [isStudying, setIsStudying] = useState(false);
  const [studyMode, setStudyMode] = useState<"all" | "box1" | "starred" | "new" | "repetition" | "group1" | "group2" | "group3" | "group4" | "group5" | "group6">("all");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Recover local storage progress state after mounting (avoid Next.js SSR hydration clash)
  useEffect(() => {
    const loadedState = loadProgressState(typedQuestions);
    setProgressState(loadedState);
    setIsLoading(false);
  }, []);

  const handleUpdateProgressState = (nextState: UserProgressState) => {
    setProgressState(nextState);
    saveProgressState(nextState);
  };

  const handleStartStudy = (
    mode:
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
      | "group6"
  ) => {
    setStudyMode(mode);
    setIsStudying(true);
  };

  const handleCloseStudy = () => {
    setIsStudying(false);
    // Refresh state after ending study session to update dashboard metrics
    if (progressState) {
      setProgressState(loadProgressState(typedQuestions));
    }
  };

  // 2. Loading State Shell
  if (isLoading || !progressState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-screen text-slate-400 gap-4 select-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 rounded-full border-t-2 border-primary border-r-2 border-primary/20 flex items-center justify-center text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Brain size={24} />
        </motion.div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">
          Tegura Amategeko...
        </span>
      </div>
    );
  }

  // 3. Fullscreen Study Mode (Distraction-Free)
  if (isStudying) {
    return (
      <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
        <main className="flex-1 w-full max-w-md md:max-w-3xl mx-auto px-5 py-6 flex flex-col justify-start overflow-y-auto">
          <StudyView
            state={progressState}
            questions={typedQuestions}
            studyMode={studyMode}
            onUpdateState={handleUpdateProgressState}
            onClose={handleCloseStudy}
          />
        </main>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard" as NavTab, label: "Ibikoresho", icon: LayoutDashboard },
    { id: "study" as NavTab, label: "Kwiga", icon: BrainCircuit },
    { id: "repetition" as NavTab, label: "Gusubiramo", icon: Layers },
    { id: "questions" as NavTab, label: "Ibibazo", icon: BookOpen },
    { id: "analytics" as NavTab, label: "Imibare", icon: BarChart3 },
  ];

  return (
    <div className="w-full flex h-screen bg-background text-slate-100 overflow-hidden select-none">
      {/* Sidebar for Desktop / Laptop views */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/60 bg-slate-950/20 backdrop-blur-md px-6 py-8 select-none shrink-0 relative z-30 h-full overflow-y-auto">
        {/* Sidebar Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Brain size={22} className="fill-primary/5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white leading-none block">
              Amategeko
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary leading-none block mt-1">
              Spaced Repetition
            </span>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none group ${
                  isActive
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={18} className={isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-200"} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="desktopActiveIndicator"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Info Banner */}
        <div className="mt-auto bg-slate-900/35 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-wider uppercase text-slate-400">
            <Sparkles size={12} className="text-primary" />
            <span>AMATEGEKO Y'UMUHANDA</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Koresha uburyo bugezweho bwa Spaced Repetition n' Active Recall kugira ngo utsinde ikizamini neza 100%.
          </p>
        </div>
      </aside>

      {/* Main viewport body */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden px-4 md:px-8 py-4 md:py-6">
        {/* Dynamic Glow Overlay for Background (stretched widescreen on desktop) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-72 bg-gradient-to-b from-primary/10 to-transparent -z-20 blur-3xl rounded-b-[100px] pointer-events-none" />

        {/* Global responsive viewport header */}
        <header className="w-full flex items-center justify-between z-10 select-none md:border-b md:border-slate-900/40 md:pb-4 md:mb-5">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Brain size={18} className="fill-primary/5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white leading-none block">
                Amategeko
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-primary leading-none block mt-0.5">
                Spaced Repetition
              </span>
            </div>
          </div>

          {/* Desktop header title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Amategeko Y'umuhanda
              <span className="text-[10px] font-black px-2 py-0.5 bg-primary/10 border border-primary/25 rounded-md text-primary select-none">
                Leitner System
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black tracking-wider uppercase bg-slate-900/40 border border-slate-800/80 px-2.5 py-1.5 rounded-xl">
            <Sparkles size={11} className="text-primary fill-primary/20 animate-pulse" />
            <span>RWANDA</span>
          </div>
        </header>

        {/* Responsive main content container */}
        <main className="flex-1 w-full overflow-y-auto pb-4">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <DashboardView
                key="dashboard"
                state={progressState}
                questions={typedQuestions}
                onStartStudy={handleStartStudy}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "study" && (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] gap-4 select-none">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Brain size={30} />
                </div>
                <h2 className="text-lg font-black text-white leading-tight">Tangira Isubiramo</h2>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Koresha Spaced Repetition n' Active Recall kugira ngo urangize amategeko yose mu byumweru 2.
                </p>
                <button
                  onClick={() => handleStartStudy("all")}
                  className="mt-3 px-8 py-3.5 bg-primary text-white font-extrabold text-sm rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_6px_15px_rgba(16,185,129,0.4)]"
                >
                  TANGIRA KWIGA
                </button>
              </div>
            )}

            {activeTab === "questions" && (
              <QuestionsView
                key="questions"
                state={progressState}
                questions={typedQuestions}
                onUpdateState={handleUpdateProgressState}
              />
            )}

            {activeTab === "repetition" && (
              <RepetitionView
                key="repetition"
                state={progressState}
                questions={typedQuestions}
                onStartStudy={handleStartStudy}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsView
                key="analytics"
                state={progressState}
                questions={typedQuestions}
                onUpdateState={handleUpdateProgressState}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Floating Bottom safe navbar tray (mobile only) */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
