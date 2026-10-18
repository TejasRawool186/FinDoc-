"use client";

import React from "react";
import { DocumentItem } from "@/types/document";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComparisonSelectorProps {
  documents: DocumentItem[];
  docAId: string | null;
  docBId: string | null;
  onSelectDocA: (id: string) => void;
  onSelectDocB: (id: string) => void;
  onSwap: () => void;
  onCompare: () => void;
  isComparing: boolean;
}

export function ComparisonSelector({
  documents,
  docAId,
  docBId,
  onSelectDocA,
  onSelectDocB,
  onSwap,
  onCompare,
  isComparing,
}: ComparisonSelectorProps) {
  const formatLabel = (doc: DocumentItem) => {
    const name = doc.company_name || doc.filename;
    const period = doc.fiscal_period ? `${doc.fiscal_period} ` : "";
    const year = doc.fiscal_year ? `FY${doc.fiscal_year}` : "";
    return `${name} • ${period}${year}`.trim();
  };

  return (
    <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black dark:border-white pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-2">
            <span className="text-[#FF0000]">[ 01 / SELECTION ]</span> COMPARATIVE PAIR CONFIGURATION
          </h3>
          <p className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 uppercase mt-0.5">
            BENCHMARK BASELINE ENTITY AGAINST PEER OR HISTORICAL FILING
          </p>
        </div>
        <Button
          onClick={onCompare}
          disabled={!docAId || !docBId || docAId === docBId || isComparing}
          className="rounded-none border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF0000] hover:text-white dark:hover:bg-[#FF0000] dark:hover:text-white font-black uppercase tracking-wider text-xs px-5 py-2.5 shadow-[3px_3px_0px_#FF0000] cursor-pointer"
        >
          {isComparing ? "CALCULATING DELTAS..." : "EXECUTE VARIANCE ANALYSIS"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Document A (Baseline) */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] uppercase font-mono font-black tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <span className="h-2 w-2 bg-black dark:bg-white inline-block" />
            DOCUMENT A (BASELINE REFERENCE)
          </label>
          <div className="relative">
            <select
              value={docAId || ""}
              onChange={(e) => onSelectDocA(e.target.value)}
              className="w-full appearance-none rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-3.5 py-2.5 text-xs font-mono font-bold text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-white dark:bg-black text-black dark:text-white">
                SELECT BASELINE FILING...
              </option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-white dark:bg-black text-black dark:text-white font-mono">
                  {formatLabel(doc)} ({doc.filename})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-black dark:text-white" />
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center pt-5 md:pt-4">
          <button
            type="button"
            onClick={onSwap}
            title="Swap Baseline and Target"
            className="flex h-9 w-9 items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-white transition-colors shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        {/* Document B (Comparison) */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] uppercase font-mono font-black tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#FF0000] inline-block" />
            DOCUMENT B (TARGET / COMPARISON)
          </label>
          <div className="relative">
            <select
              value={docBId || ""}
              onChange={(e) => onSelectDocB(e.target.value)}
              className="w-full appearance-none rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-3.5 py-2.5 text-xs font-mono font-bold text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-white dark:bg-black text-black dark:text-white">
                SELECT TARGET FILING...
              </option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-white dark:bg-black text-black dark:text-white font-mono">
                  {formatLabel(doc)} ({doc.filename})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-black dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
