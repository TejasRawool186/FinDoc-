"use client";

import React from "react";
import { TrendingUp, AlertTriangle, ShieldCheck, PieChart, FileText } from "lucide-react";

interface SuggestedInquiriesProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

const INQUIRIES = [
  {
    text: "What was the total revenue?",
    icon: TrendingUp,
    badge: "01 / REVENUE",
  },
  {
    text: "What is the operating margin?",
    icon: PieChart,
    badge: "02 / MARGIN",
  },
  {
    text: "What were the major risks reported?",
    icon: AlertTriangle,
    badge: "03 / RISK",
  },
  {
    text: "How much total debt does the company have?",
    icon: ShieldCheck,
    badge: "04 / LEVERAGE",
  },
  {
    text: "How did net revenue change year-over-year?",
    icon: TrendingUp,
    badge: "05 / GROWTH",
  },
  {
    text: "Summarize the key executive highlights.",
    icon: FileText,
    badge: "06 / SUMMARY",
  },
];

export function SuggestedInquiries({
  onSelect,
  disabled = false,
}: SuggestedInquiriesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
        <h4 className="text-xs font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-2">
          <span className="text-[#FF0000]">[ SUGGESTED ]</span> RAPID RAG QUERIES
        </h4>
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">CLICK TO EXECUTE</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {INQUIRIES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.text)}
              className="flex items-center gap-3 p-3 text-left border-2 border-black dark:border-white bg-white dark:bg-black hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#FFFFFF] text-xs text-black dark:text-white transition-all disabled:opacity-50 disabled:pointer-events-none group cursor-pointer"
            >
              <div className="h-8 w-8 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 group-hover:bg-[#FF0000] dark:group-hover:bg-[#FF0000] dark:group-hover:text-white transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-400 block tracking-wider">
                  {item.badge}
                </span>
                <p className="truncate font-bold text-black dark:text-white uppercase text-[11px]">
                  {item.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
