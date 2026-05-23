"use client";

import React from "react";
import { LayoutDashboard, BrainCircuit, BookOpen, BarChart3, Layers } from "lucide-react";
import { motion } from "framer-motion";

export type NavTab = "dashboard" | "study" | "repetition" | "questions" | "analytics";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Ibikoresho", icon: LayoutDashboard },
    { id: "study" as NavTab, label: "Kwiga", icon: BrainCircuit },
    { id: "repetition" as NavTab, label: "Gusubiramo", icon: Layers },
    { id: "questions" as NavTab, label: "Ibibazo", icon: BookOpen },
    { id: "analytics" as NavTab, label: "Imibare", icon: BarChart3 },
  ];

  return (
    <div className="w-full shrink-0 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md py-2 md:hidden">
      <nav className="flex items-center justify-around max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors duration-200 text-slate-400 hover:text-white tap-highlight-none focus:outline-none flex-1"
            >
              {/* Active pill background slider */}
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                />
              )}

              {/* Icon Container with subtle scale bounce */}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`${isActive ? "text-primary" : "text-slate-400"}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>

              {/* Label */}
              <span
                className={`text-[9px] mt-1 font-medium tracking-wide transition-all ${
                  isActive ? "text-primary font-bold" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
