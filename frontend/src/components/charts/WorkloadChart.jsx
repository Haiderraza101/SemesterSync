import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartMetrics, ChartTabs } from "./ChartCard.jsx";
import ChartTooltip from "./ChartTooltip.jsx";

const SERIES_COLOR = "#2f5f98";
const GRID_COLOR = "#e2e8f0";
const AXIS_TICK = { fontSize: 11, fill: "#6b7280", fontWeight: 500 };

const GRANULARITY = [
  { value: "week", label: "Semester" },
  { value: "day", label: "Two weeks" },
];

const METRIC_LABELS = {
  hours: { unit: "Class hours", format: (value) => `${value} h` },
  due: { unit: "Exams & deadlines", format: (value) => `${value} due` },
};

function tooltipFor(metric) {
  return (props) => (
    <ChartTooltip
      {...props}
      title={(point) => point.tooltip}
      rows={(point) => [
        { label: METRIC_LABELS[metric].unit, value: METRIC_LABELS[metric].format(point[metric]), color: SERIES_COLOR },
      ]}
    />
  );
}

function axes() {
  return [
    <CartesianGrid key="grid" vertical={false} strokeDasharray="6 4" stroke={GRID_COLOR} />,
    <XAxis
      key="x"
      dataKey="label"
      tickLine={false}
      axisLine={{ stroke: "#e5e7eb" }}
      tickMargin={12}
      minTickGap={16}
      tick={AXIS_TICK}
    />,
    <YAxis key="y" tickLine={false} axisLine={false} tickMargin={8} width={36} allowDecimals={false} tick={AXIS_TICK} />,
  ];
}

export default function WorkloadChart({ weekly, daily, metrics }) {
  const [metric, setMetric] = useState("due");
  const [granularity, setGranularity] = useState("week");
  const data = granularity === "week" ? weekly : daily;
  const current = data.find((point) => point.current);
  const currentIndex = data.indexOf(current);

  return (
    <ChartCard title="Workload" link={{ to: "/app/calendar", label: "Open calendar" }} className="workload-chart">
      <div className="chart-card__controls">
        <ChartMetrics metrics={metrics} value={metric} onChange={setMetric} />
        <div className="chart-card__spacer" />
        <div className="chart-card__tabs">
          <ChartTabs options={GRANULARITY} value={granularity} onChange={setGranularity} label="Range" />
        </div>
      </div>
      <div className="chart-card__plot">
        <ResponsiveContainer width="100%" height="100%">
          {granularity === "week" ? (
            <AreaChart data={data} margin={{ top: 28, right: 24, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="workload-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              {axes()}
              {current && (
                <ReferenceLine
                  x={current.label}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: "This week", position: "top", fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
                />
              )}
              <Tooltip cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "4 4" }} content={tooltipFor(metric)} />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={SERIES_COLOR}
                strokeWidth={2}
                fill="url(#workload-fill)"
                fillOpacity={1}
                animationDuration={800}
                activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              {axes()}
              <Tooltip cursor={{ fill: "#f1f5f9", opacity: 0.6 }} content={tooltipFor(metric)} />
              <Bar dataKey={metric} radius={[6, 6, 0, 0]} maxBarSize={32} animationDuration={800}>
                {data.map((point, index) => (
                  <Cell key={point.key} fill={SERIES_COLOR} fillOpacity={currentIndex >= 0 && index < currentIndex ? 0.4 : 1} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
