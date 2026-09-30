import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
  ReferenceLine,
} from 'recharts';

export interface FederationChartItem {
  state: string;
  state_code: string;
  local_only_mape: number;
  federated_mape: number;
  n_samples: number;
  is_data_sparse?: boolean;
}

interface FederationMapeChartProps {
  data: FederationChartItem[];
}

// Custom Tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload as FederationChartItem;
  if (!item) return null;

  const localMape = item.local_only_mape;
  const fedMape = item.federated_mape;
  const gain = (localMape - fedMape).toFixed(1);

  return (
    <div className="bg-theme-surface border border-theme-border rounded-lg p-3 shadow-xl font-sans text-xs space-y-1.5 min-w-[200px]">
      <div className="font-mono text-xs font-bold text-theme-text border-b border-theme-border pb-1 flex items-center justify-between">
        <span>State: {item.state_code}</span>
        {item.is_data_sparse && (
          <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono">
            Sparse Data
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 font-mono">
        <span className="text-amber-500 font-semibold">Local-Only MAPE:</span>
        <span className="font-bold text-theme-text">{localMape}%</span>
      </div>

      <div className="flex items-center justify-between gap-4 font-mono">
        <span className="text-emerald-500 font-semibold">Federated MAPE:</span>
        <span className="font-bold text-emerald-500">{fedMape}%</span>
      </div>

      <div className="pt-1 border-t border-theme-border flex items-center justify-between font-mono text-2xs">
        <span className="text-theme-muted font-sans">Error Reduction:</span>
        <span className="font-bold text-theme-healthy-text font-mono">-{gain}% boost</span>
      </div>
    </div>
  );
};

export const FederationMapeChart: React.FC<FederationMapeChartProps> = ({ data }) => {
  // Find sparse data state item (e.g. BR)
  const sparseItem = data.find((d) => d.is_data_sparse || d.state_code === 'BR');

  return (
    <div className="w-full h-[320px] font-sans relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />

          <XAxis
            dataKey="state"
            stroke="var(--color-muted)"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
          />

          <YAxis
            stroke="var(--color-muted)"
            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            unit="%"
            label={{
              value: 'Error Rate (MAPE %)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--color-muted)', fontSize: 10 },
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

          {/* Reference callout line for Sparse Data State (BR) */}
          {sparseItem && (
            <ReferenceLine
              x={sparseItem.state}
              stroke="var(--color-primary)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Callout ${sparseItem.state_code}: ${sparseItem.local_only_mape}% → ${sparseItem.federated_mape}%`,
                position: 'top',
                fill: 'var(--color-primary)',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Local Only Bar */}
          <Bar
            dataKey="local_only_mape"
            name="Local-Only Error (%)"
            fill="#F59E0B"
            radius={[4, 4, 0, 0]}
          >
            <LabelList
              dataKey="local_only_mape"
              position="top"
              formatter={(val: any) => `${val}%`}
              style={{ fill: 'var(--color-muted)', fontSize: 10, fontWeight: 600 }}
            />
          </Bar>

          {/* Federated Global Bar */}
          <Bar
            dataKey="federated_mape"
            name="Federated Global Error (%)"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          >
            <LabelList
              dataKey="federated_mape"
              position="top"
              formatter={(val: any) => `${val}%`}
              style={{ fill: '#10B981', fontSize: 10, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FederationMapeChart;
