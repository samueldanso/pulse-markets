"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SparklineChartProps {
  data: Array<{ time: number; value: number }>;
  isPositive: boolean;
  variant?: "card" | "detail";
  height?: number;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { time: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs shadow-xl">
      <p className="font-mono font-bold text-white">
        {point.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="text-white/50">{formatTime(point.payload.time)}</p>
    </div>
  );
}

export function SparklineChart({
  data,
  isPositive,
  variant = "card",
  height,
}: SparklineChartProps) {
  const id = useId();
  const gradientId = `gradient-${id.replace(/:/g, "")}`;
  const strokeColor = isPositive ? "var(--pulse-up)" : "var(--pulse-down)";

  if (variant === "card") {
    return (
      <ResponsiveContainer width="100%" height={height ?? 120}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height ?? 350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--pulse-gray)"
          strokeOpacity={0.15}
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tickFormatter={formatTime}
          stroke="var(--pulse-gray)"
          strokeOpacity={0.3}
          tick={{ fill: "var(--pulse-gray)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={60}
        />
        <YAxis
          stroke="var(--pulse-gray)"
          strokeOpacity={0.3}
          tick={{ fill: "var(--pulse-gray)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(v: number) => v.toLocaleString()}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
