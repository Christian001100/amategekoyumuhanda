"use client";

import React from "react";
import { ArrowRight, AlertTriangle, HelpCircle } from "lucide-react";

import questions from "../data/questions.json";

interface SignRendererProps {
  questionText: string;
  originalNum: number;
}

export default function SignRenderer({ questionText, originalNum }: SignRendererProps) {
  const text = questionText.toLowerCase();

  // Find if there is a mapped image in our parsed JSON
  const q = questions.find((item) => item.originalNum === originalNum);
  if (q && q.hasImage && q.imagePath) {
    return (
      <div className="flex flex-col items-center justify-center p-2.5 bg-slate-900/35 rounded-2xl border border-slate-800/60 mb-2 w-full max-w-[240px] mx-auto select-none">
        <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-white p-1.5 shadow-md shadow-black/20 transition-transform duration-300 hover:scale-[1.03] flex items-center justify-center">
          <img
            src={q.imagePath}
            alt={`Icyapa cya kibazo ${originalNum}`}
            className="max-h-24 md:max-h-28 object-contain"
          />
        </div>
        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-1.5">
          Icyapa Cyabugenewe (Official Sign)
        </span>
      </div>
    );
  }

  // 1. Hexagonal STOP Sign
  if (text.includes("hagarara") || text.includes("stop")) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4">
        <svg width="100" height="100" viewBox="0 0 100 100" className="animate-pulse">
          {/* Outer glow */}
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Octagon shape */}
          <polygon
            points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="3"
            filter="url(#glow-red)"
          />
          <polygon
            points="32,8 68,8 92,32 92,68 68,92 32,92 8,68 8,32"
            fill="transparent"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="50"
            y="58"
            fill="#ffffff"
            fontSize="20"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing="1"
          >
            STOP
          </text>
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Icyapa Gihagarara (Stop Sign)</span>
      </div>
    );
  }

  // 2. Yield Sign (Tanga Inzira)
  if (text.includes("tanga inzira") || text.includes("kugabanya umuvuduko mu isangano")) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Inverted Triangle */}
          <polygon
            points="5,15 95,15 50,92"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="8"
            strokeLinejoin="round"
            filter="url(#glow-red)"
          />
          <polygon
            points="14,20 86,20 50,80"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Tanga Inzira (Yield)</span>
      </div>
    );
  }

  // 3. Speed Limit Signs (Speed numbers detected in Kinyarwanda text)
  let speedLimit = "";
  if (text.includes("30km/h") || text.includes("30 km/h") || text.includes("toni 3") || text.includes("30")) {
    speedLimit = "30";
  } else if (text.includes("50km/h") || text.includes("50 km/h") || text.includes("50")) {
    speedLimit = "50";
  } else if (text.includes("80km/h") || text.includes("80 km/h") || text.includes("80")) {
    speedLimit = "80";
  } else if (text.includes("90km/h") || text.includes("90 km/h") || text.includes("90")) {
    speedLimit = "90";
  } else if (text.includes("120km/h") || text.includes("120 km/h") || text.includes("120")) {
    speedLimit = "120";
  }

  if (speedLimit && (text.includes("umuvuduko") || text.includes("icyapa") || text.includes("kimenyetso"))) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#ef4444" strokeWidth="8" />
          <circle cx="50" cy="50" r="41" fill="transparent" stroke="#000000" strokeWidth="1" />
          <text
            x="50"
            y="58"
            fill="#000000"
            fontSize="28"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {speedLimit}
          </text>
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Umuvuduko ntarengwa: {speedLimit}km/h</span>
      </div>
    );
  }

  // 4. Direction / Mandatory Signs (Blue circles with arrows)
  if (text.includes("iburyo") || text.includes("ibumoso") || text.includes("gukata") || text.includes("cyerekezo")) {
    const rotate = text.includes("ibumoso") ? 180 : text.includes("imbere") ? -90 : 0;
    const desc = text.includes("ibumoso") ? "Gukata Ibumoso (Turn Left)" : "Gukata Iburyo (Turn Right)";
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
          <g transform={`rotate(${rotate} 50 50)`}>
            <line x1="20" y1="50" x2="80" y2="50" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
            <polygon points="65,30 90,50 65,70" fill="#ffffff" />
          </g>
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">{desc}</span>
      </div>
    );
  }

  // 5. Situational Intersection Diagram (For advanced questions involving vehicles A and B)
  if (text.includes("ikinyabiziga a") || text.includes("ikinyabiziga b") || text.includes("muri a") || text.includes("muri b") || text.includes("kuri a") || text.includes("kuri b")) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-2xl border border-slate-800 mb-4 w-full">
        <svg width="220" height="140" viewBox="0 0 220 140" className="bg-slate-950 rounded-xl border border-slate-800">
          {/* Intersection Roads */}
          <rect x="0" y="45" width="220" height="50" fill="#1e293b" />
          <rect x="85" y="0" width="50" height="140" fill="#1e293b" />
          
          {/* Lane Divider Lines */}
          <line x1="0" y1="70" x2="220" y2="70" stroke="#ffffff" strokeWidth="2" strokeDasharray="6,6" />
          <line x1="110" y1="0" x2="110" y2="140" stroke="#ffffff" strokeWidth="2" strokeDasharray="6,6" />
          
          {/* Car A (Green Box) */}
          <g transform="translate(40, 75)">
            <rect width="32" height="18" rx="3" fill="#10b981" />
            <text x="16" y="13" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">A</text>
            <polygon points="32,4 37,9 32,14" fill="#f59e0b" /> {/* Direction Arrow */}
          </g>
          
          {/* Car B (Blue Box) */}
          <g transform="translate(115, 10)">
            <rect width="18" height="32" rx="3" fill="#0ea5e9" />
            <text x="9" y="20" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">B</text>
            <polygon points="4,32 9,37 14,32" fill="#f59e0b" /> {/* Direction Arrow */}
          </g>
          
          {/* Stop / Yield Line Indicator */}
          <line x1="85" y1="45" x2="85" y2="70" stroke="#ef4444" strokeWidth="3" />
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Isangano: Ikinyabiziga A na B (Intersection Diagram)</span>
      </div>
    );
  }

  // 6. Double Lines / No Passing Zones
  if (text.includes("unyuranaho") || text.includes("umurongo") || text.includes("gusatira")) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4 w-full">
        <svg width="200" height="60" viewBox="0 0 200 60" className="bg-slate-950 rounded-xl border border-slate-800">
          <rect x="0" y="0" width="200" height="60" fill="#1e293b" />
          {/* Two parallel solid white lines */}
          <line x1="0" y1="26" x2="200" y2="26" stroke="#ffffff" strokeWidth="2.5" />
          <line x1="0" y1="34" x2="200" y2="34" stroke="#ffffff" strokeWidth="2.5" />
          {/* Small Car graphics depicting lane division */}
          <circle cx="50" cy="15" r="5" fill="#ef4444" />
          <circle cx="150" cy="45" r="5" fill="#10b981" />
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Imirongo ibiri y’umweru yikurikiranya (Double Solid Lines)</span>
      </div>
    );
  }

  // 7. General Warning Signs (Triangular signs with dynamic icons)
  if (text.includes("kimenyetso") || text.includes("icyapa") || text.includes("imbere")) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 mb-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Warning Triangle */}
          <polygon points="50,10 95,85 5,85" fill="#fef08a" stroke="#ef4444" strokeWidth="6" strokeLinejoin="round" />
          {/* Exclamation point */}
          <circle cx="50" cy="74" r="4.5" fill="#000000" />
          <path d="M50,38 L50,62" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
        </svg>
        <span className="text-[11px] text-slate-400 font-medium mt-2 select-none">Icyapa Kiburira (Warning Triangle)</span>
      </div>
    );
  }

  // 8. General Icon fallback for standard text questions
  return null;
}
