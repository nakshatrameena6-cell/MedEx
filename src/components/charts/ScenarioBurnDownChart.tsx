import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ScenarioBurnDownPoint {
  date: string;
  baseline_stock: number;
  scenario_stock: number;
}

interface ScenarioBurnDownChartProps {
  data: ScenarioBurnDownPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload as ScenarioBurnDownPoint;
  if (!item) return null;

  return (
    <div className="bg-theme-surface border border-theme-border rounded-lg p-3 shadow-xl font-sans text-xs space-y-1.5">
      <div className="font-mono text-xs font-bold text-theme-text border-b border-theme-border pb-1">
        Date: {label}
      </div>
      <div className="flex items-center justify-between gap-4 font-mono">
        <span className="text-teal-400 font-semibold">Baseline Stock:</span>
        <span className="font-bold text-theme-text">{item.baseline_stock} units</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono">
        <span className="text-theme-critical font-semibold">Surge Scenario Stock:</span>
        <span className="font-bold text-theme-critical">{item.scenario_stock} units</span>
      </div>
    </div>
  );
};

export const ScenarioBurnDownChart: React.FC<ScenarioBurnDownChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[320px] font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />

          <XAxis
            dataKey="date"
            stroke="var(--color-muted)"
            fontSize={11}
            fontFamily="monospace"
          />

          <YAxis
            stroke="var(--color-muted)"
            fontSize={11}
            fontFamily="monospace"
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-border-control)', strokeDasharray: '4 4' }}
            content={<CustomTooltip />}
          />

          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

          <Line
            type="monotone"
            dataKey="baseline_stock"
            name="Baseline Stock"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="scenario_stock"
            name="Surge Scenario Stock"
            stroke="var(--color-critical)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 4, fill: 'var(--color-critical)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScenarioBurnDownChart;
