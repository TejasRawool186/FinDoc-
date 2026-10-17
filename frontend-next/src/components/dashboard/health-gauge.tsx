"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  score: number; // 0–100
  label?: string;
  size?: number;
  isLoading?: boolean;
}

function getScoreColor(score: number): { stroke: string; text: string; label: string } {
  if (score >= 85) return { stroke: "#000000", text: "text-black", label: "PRIME / OPTIMAL" };
  if (score >= 70) return { stroke: "#000000", text: "text-black", label: "STABLE" };
  if (score >= 45) return { stroke: "#FF0000", text: "text-[#FF0000]", label: "MODERATE RISK" };
  return { stroke: "#FF0000", text: "text-[#FF0000]", label: "CRITICAL DISTRESS" };
}

export function HealthGauge({
  score,
  label = "Financial Health Score",
  size = 200,
  isLoading = false,
}: HealthGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const { stroke, text, label: statusLabel } = getScoreColor(clampedScore);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.065;

  // Arc from -210° to +30° (240° sweep) — bottom-open gauge
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle; // 240 degrees
  const filledArc = (clampedScore / 100) * totalArc;

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(startDeg: number, endDeg: number, r: number) {
    const start = polarToXY(startDeg, r);
    const end = polarToXY(endDeg, r);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];
  const tickRadius = radius + strokeWidth * 0.85;
  const tickLength = strokeWidth * 0.55;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size * 0.78 }}>
        <svg
          width={size}
          height={size * 0.78}
          viewBox={`0 0 ${size} ${size * 0.78}`}
          className="overflow-visible"
        >
          {/* Glow filter */}
          <defs>
            <filter id="gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={describeArc(startAngle, endAngle, radius)}
            fill="none"
            stroke="currentColor"
            className="text-neutral-200 dark:text-neutral-800"
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />

          {/* Colored fill arc */}
          {!isLoading && clampedScore > 0 && (
            <path
              d={describeArc(startAngle, startAngle + filledArc, radius)}
              fill="none"
              stroke={clampedScore < 70 ? "#FF0000" : "currentColor"}
              className={clampedScore >= 70 ? "text-black dark:text-white" : ""}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
              style={{ transition: "all 0.8s ease-out" }}
            />
          )}

          {/* Tick marks */}
          {ticks.map((tick) => {
            const tickAngle = startAngle + (tick / 100) * totalArc;
            const inner = polarToXY(tickAngle, radius - strokeWidth / 2 - tickLength);
            const outer = polarToXY(tickAngle, tickRadius);
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="currentColor"
                className="text-black dark:text-white"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Needle dot */}
          {!isLoading && (
            <>
              {(() => {
                const needleAngle = startAngle + filledArc;
                const np = polarToXY(needleAngle, radius);
                return (
                  <circle
                    cx={np.x}
                    cy={np.y}
                    r={strokeWidth * 0.45}
                    fill={clampedScore < 70 ? "#FF0000" : "#FFFFFF"}
                    stroke="#000000"
                    strokeWidth={1}
                    filter="url(#gauge-glow)"
                    style={{ transition: "all 0.8s ease-out" }}
                  />
                );
              })()}
            </>
          )}

          {/* Score text */}
          <text
            x={cx}
            y={cy + size * 0.06}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn("font-black fill-current", clampedScore < 70 ? "text-[#FF0000]" : "text-black dark:text-white")}
            style={{
              fontSize: size * 0.2,
              fontWeight: 900,
            }}
          >
            {isLoading ? "—" : Math.round(clampedScore)}
          </text>
          <text
            x={cx}
            y={cy + size * 0.22}
            textAnchor="middle"
            className="fill-current text-neutral-500 dark:text-neutral-400 font-mono"
            style={{
              fontSize: size * 0.072,
              fontWeight: 600,
            }}
          >
            / 100
          </text>

          {/* Status label */}
          {!isLoading && (
            <text
              x={cx}
              y={cy + size * 0.345}
              textAnchor="middle"
              className={cn("font-mono font-bold uppercase fill-current", clampedScore < 70 ? "text-[#FF0000]" : "text-black dark:text-white")}
              style={{
                fontSize: size * 0.067,
                letterSpacing: "0.05em",
              }}
            >
              {statusLabel}
            </text>
          )}
        </svg>
      </div>

      <p className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase">{label}</p>
    </div>
  );
}
