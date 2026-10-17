"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FinancialMetricItem } from "@/types/financial";

interface RevenueTrendChartProps {
  metrics: FinancialMetricItem[];
  currencySymbol: string;
  unit: string;
  isLoading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currencySymbol,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currencySymbol?: string;
  unit?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3 text-xs font-mono shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] rounded-none min-w-[200px]">
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-1 mb-2">
          <span className="font-black text-black dark:text-white uppercase tracking-wider text-xs">
            [ {label} ]
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase">
            AUDITED
          </span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-bold uppercase text-[11px]">
                <span
                  className="inline-block h-2 w-2 border border-black dark:border-white shrink-0"
                  style={{ background: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-black text-black dark:text-white text-xs">
                {currencySymbol}
                {entry.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({
  metrics,
  currencySymbol,
  unit,
  isLoading = false,
}: RevenueTrendChartProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // Build chart data from metrics grouped by fiscal year
  const byYear: Record<
    string,
    { year: string; revenue?: number; netIncome?: number; ebitda?: number }
  > = {};

  for (const m of metrics) {
    const yr = m.fiscal_year ? `FY${m.fiscal_year}` : "Current";
    if (!byYear[yr]) byYear[yr] = { year: yr };

    const name = m.metric_name.toLowerCase();
    if (name.includes("revenue") || name.includes("sales")) {
      byYear[yr].revenue = m.value ?? undefined;
    } else if (name.includes("net income") || name.includes("net profit") || name.includes("pat")) {
      byYear[yr].netIncome = m.value ?? undefined;
    } else if (name.includes("ebitda") || name.includes("operating income")) {
      byYear[yr].ebitda = m.value ?? undefined;
    }
  }

  const chartData = Object.values(byYear).sort((a, b) =>
    a.year.localeCompare(b.year)
  );

  if (isLoading) {
    return (
      <div className="h-72 flex items-end gap-3 px-4 pb-4">
        {[0.6, 0.8, 0.7, 1, 0.9].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-none border border-black dark:border-white bg-neutral-200 dark:bg-neutral-800 animate-pulse"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
    );
  }

  // If no multi-year data, show a single bar for current values
  const displayData =
    chartData.length === 0
      ? [{ year: "Current" }]
      : chartData;

  const revStop1 = isDark ? "#FFFFFF" : "#000000";
  const revStop2 = isDark ? "#D4D4D8" : "#27272A";
  const ebitdaStop1 = isDark ? "#A1A1AA" : "#52525B";
  const ebitdaStop2 = isDark ? "#71717A" : "#71717A";

  const axisStroke = isDark ? "#FFFFFF" : "#000000";
  const gridStroke = isDark ? "#FFFFFF" : "#000000";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart
        data={displayData}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={revStop1} stopOpacity={1.0} />
            <stop offset="100%" stopColor={revStop2} stopOpacity={0.85} />
          </linearGradient>
          <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ebitdaStop1} stopOpacity={1.0} />
            <stop offset="100%" stopColor={ebitdaStop2} stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="2 2"
          stroke={gridStroke}
          strokeOpacity={isDark ? 0.2 : 0.15}
          vertical={false}
        />
        <XAxis
          dataKey="year"
          tick={{ fill: axisStroke, fontSize: 11, fontWeight: 700 }}
          axisLine={{ stroke: axisStroke }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: axisStroke, fontSize: 10, fontWeight: 700 }}
          axisLine={{ stroke: axisStroke }}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
          }
          width={42}
        />
        <Tooltip
          content={
            <CustomTooltip
              currencySymbol={currencySymbol}
              unit={unit}
            />
          }
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs font-mono font-bold text-black dark:text-white uppercase">{value}</span>
          )}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="url(#revenueGrad)"
          radius={[0, 0, 0, 0]}
          maxBarSize={52}
        />
        <Bar
          dataKey="ebitda"
          name="EBITDA"
          fill="url(#ebitdaGrad)"
          radius={[0, 0, 0, 0]}
          maxBarSize={52}
        />
        <Line
          dataKey="netIncome"
          name="Net Income"
          type="monotone"
          stroke="#FF0000"
          strokeWidth={2}
          dot={{ fill: "#FF0000", r: 3.5, strokeWidth: 1.5, stroke: axisStroke }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
