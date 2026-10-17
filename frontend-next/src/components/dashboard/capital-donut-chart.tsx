"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FinancialMetricItem } from "@/types/financial";

interface CapitalDonutChartProps {
  metrics: FinancialMetricItem[];
  currencySymbol: string;
  unit: string;
  isLoading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3 text-xs font-mono shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] rounded-none min-w-[150px]">
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-1 mb-1.5">
          <span className="font-black uppercase tracking-wider text-xs" style={{ color: entry.payload.color }}>
            [ {entry.name} ]
          </span>
          <span className="inline-block h-2 w-2 border border-black dark:border-white" style={{ background: entry.payload.color }} />
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold uppercase">VALUE:</span>
          <span className="text-black dark:text-white font-black text-sm">
            {entry.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function CapitalDonutChart({
  metrics,
  currencySymbol: _currencySymbol,
  unit: _unit,
  isLoading = false,
}: CapitalDonutChartProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const colors = {
    equity: isDark ? "#FFFFFF" : "#000000",
    debt: "#FF0000",
    cash: "#71717A",
    other: "#A1A1AA",
  };

  // Extract capital structure metrics
  let equity: number | null = null;
  let debt: number | null = null;
  let cash: number | null = null;

  for (const m of metrics) {
    const name = m.metric_name.toLowerCase();
    if (name.includes("equity") || name.includes("shareholders")) {
      equity = m.value ?? null;
    } else if (
      name.includes("total debt") ||
      name.includes("borrowings") ||
      name.includes("long term debt")
    ) {
      debt = m.value ?? null;
    } else if (name.includes("cash") || name.includes("cash equivalent")) {
      cash = m.value ?? null;
    }
  }

  const segments: { name: string; value: number; color: string }[] = [];
  if (equity !== null && equity > 0)
    segments.push({ name: "Equity", value: equity, color: colors.equity });
  if (debt !== null && debt > 0)
    segments.push({ name: "Debt", value: debt, color: colors.debt });
  if (cash !== null && cash > 0)
    segments.push({ name: "Cash", value: cash, color: colors.cash });

  // If no data, show placeholder
  const displayData =
    segments.length > 0
      ? segments
      : [
          { name: "Equity", value: 60, color: colors.equity },
          { name: "Debt", value: 30, color: colors.debt },
          { name: "Cash", value: 10, color: colors.cash },
        ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-44 w-44 rounded-none border-[12px] border-black dark:border-white animate-pulse" />
      </div>
    );
  }

  const strokeColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
