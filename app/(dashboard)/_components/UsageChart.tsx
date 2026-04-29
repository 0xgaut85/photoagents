"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UsagePoint } from "../_lib/mock";

export default function UsageChart({
  data,
  compact = false,
}: {
  data: UsagePoint[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "h-44" : "h-[360px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="usageInk" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0e1210" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0e1210" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e6e4dd" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#77756d", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            interval={compact ? 6 : 3}
          />
          <YAxis
            tick={{ fill: "#77756d", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "18px",
              borderColor: "#e6e4dd",
              boxShadow: "0 16px 40px rgba(14,18,16,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#0e1210"
            strokeWidth={2}
            fill="url(#usageInk)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
