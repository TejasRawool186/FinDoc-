"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DimensionScores {
  growth_score?: number | null;
  profitability_score?: number | null;
  liquidity_score?: number | null;
  leverage_score?: number | null;
  cash_flow_score?: number | null;
}

interface FinancialRadarProps {
  scores: DimensionScores;
  isLoading?: boolean;
}

// Custom Tooltip
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { subject: string; value: number } }[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3 text-xs font-mono shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] rounded-none min-w-[160px]">
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-1 mb-1.5">
          <span className="font-black text-black dark:text-white uppercase tracking-wider text-xs">
            [ {d.subject} ]
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase">
            DIMENSION
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold uppercase">SCORE:</span>
          <span className="font-black text-black dark:text-white text-sm">
            {d.value.toFixed(1)} <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">/ 100</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function FinancialRadarChart({
  scores,
  isLoading = false,
}: FinancialRadarProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const data = [
    {
      subject: "Growth",
      value: scores.growth_score ?? 0,
      fullMark: 100,
    },
    {
      subject: "Profitability",
      value: scores.profitability_score ?? 0,
      fullMark: 100,
    },
    {
      subject: "Liquidity",
      value: scores.liquidity_score ?? 0,
      fullMark: 100,
    },
    {
      subject: "Leverage",
      value: scores.leverage_score ?? 0,
      fullMark: 100,
    },
    {
      subject: "Cash Flow",
      value: scores.cash_flow_score ?? 0,
      fullMark: 100,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-48 w-48 rounded-none border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
      </div>
    );
  }

  const gridStroke = isDark ? "#FFFFFF" : "#000000";
  const axisColor = isDark ? "#FFFFFF" : "#000000";
  const radarStroke = isDark ? "#FFFFFF" : "#000000";
  const radarFillColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={radarFillColor} stopOpacity={isDark ? 0.3 : 0.2} />
            <stop offset="100%" stopColor={radarFillColor} stopOpacity={0.05} />
          </radialGradient>
        </defs>
        <PolarGrid stroke={gridStroke} strokeOpacity={isDark ? 0.35 : 0.2} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: axisColor, fontSize: 11, fontWeight: 900 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Score"
          dataKey="value"
          stroke={radarStroke}
          strokeWidth={2}
          fill="url(#radarFill)"
          dot={{ r: 4, fill: "#FF0000", strokeWidth: 1.5, stroke: radarStroke }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
