"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  centerText?: string;
  subText?: string;
}

export default function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 14,
  centerText,
  subText,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Container */}
      <svg className="transform -rotate-95 w-full h-full">
        {/* Background Track Circle */}
        <circle
          className="text-slate-800/60"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Dynamic Foreground Progress Circle */}
        <motion.circle
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: "drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.5))",
          }}
        />
      </svg>

      {/* Internal Centered Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-3xl font-black tracking-tight text-white font-sans drop-shadow-md">
          {centerText || `${Math.round(progress)}%`}
        </span>
        {subText && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 select-none">
            {subText}
          </span>
        )}
      </div>
    </div>
  );
}
