import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

export interface ForecastChartPoint {
  date: string;
  type?: string;
  actual?: number;
  p10?: number;
  p50?: number;
  p90?: number;
  band?: number[];
}

interface ForecastChartProps {
  data: ForecastChartPoint[];
  unit?: string;
}

// Custom Tooltip component displaying Date, Actual, P10, P50, P90
const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Find individual values from payload
  const pointData = payload[0]?.payload as ForecastChartPoint;
  if (!pointData) return null;

  return (
    <div className="bg-theme-surface border border-theme-border rounded-lg p-3 shadow-xl font-sans text-xs space-y-1.5 min-w-[180px]">
      <div className="font-mono text-2xs text-theme-muted font-bold border-b border-theme-border pb-1">
        Date: <span className="text-theme-text">{label}</span>
      </div>

      {pointData.actual !== undefined && (
        <div className="flex items-center justify-between gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5 text-blue-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Historical Actual:
          </span>
          <span className="font-bold text-theme-text">
            {pointData.actual} {unit}
          </span>
        </div>
      )}

      {pointData.p50 !== undefined && (
        <div className="flex items-center justify-between gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5 text-theme-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-theme-primary inline-block" />
            P50 Forecast:
          </span>
          <span className="font-bold text-theme-primary">
            {pointData.p50} {unit}
          </span>
        </div>
      )}

      {pointData.p10 !== undefined && (
        <div className="flex items-center justify-between gap-4 font-mono text-2xs text-theme-muted">
          <span>P10 Lower Bound:</span>
          <span className="font-semibold text-theme-text">
            {pointData.p10} {unit}
          </span>
        </div>
      )}

      {pointData.p90 !== undefined && (
        <div className="flex items-center justify-between gap-4 font-mono text-2xs text-theme-muted">
          <span>P90 Upper Bound:</span>
          <span className="font-semibold text-theme-text">
            {pointData.p90} {unit}
          </span>
        </div>
      )}
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({ data, unit = 'units' }) => {
  // Toggle legend series state
  const [showActual, setShowActual] = useState(true);
  const [showP50, setShowP50] = useState(true);
  const [showBand, setShowBand] = useState(true);

  // Identify first forecast point to place "Forecast →" divider & shading
  const firstForecastIndex = data.findIndex((d) => d.p50 !== undefined && d.actual === undefined);
  const firstForecastDate = firstForecastIndex >= 0 ? data[firstForecastIndex]?.date : null;
  const lastDate = data.length > 0 ? data[data.length - 1]?.date : null;

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    if (dataKey === 'actual') setShowActual(!showActual);
    if (dataKey === 'p50') setShowP50(!showP50);
    if (dataKey === 'band') setShowBand(!showBand);
  };

  return (
    <div className="w-full h-[340px] font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 25, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />

          <XAxis
            dataKey="date"
            stroke="var(--color-muted)"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis
            stroke="var(--color-muted)"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            unit={` ${unit}`}
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-border-control)', strokeDasharray: '4 4' }}
            content={<CustomTooltip unit={unit} />}
          />

          <Legend
            onClick={handleLegendClick}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px', cursor: 'pointer' }}
            formatter={(value, entry) => {
              const key = entry.dataKey;
              let isHidden = false;
              if (key === 'actual') isHidden = !showActual;
              if (key === 'p50') isHidden = !showP50;
              if (key === 'band') isHidden = !showBand;
              return (
                <span
                  style={{
                    color: isHidden ? 'var(--color-muted)' : 'var(--color-text)',
                    textDecoration: isHidden ? 'line-through' : 'none',
                    opacity: isHidden ? 0.5 : 1,
                  }}
                  className="font-medium"
                >
                  {value}
                </span>
              );
            }}
          />

          {/* Shaded Forecast Region */}
          {firstForecastDate && lastDate && (
            <ReferenceArea
              x1={firstForecastDate}
              x2={lastDate}
              fill="var(--color-primary-tint)"
              fillOpacity={0.15}
            />
          )}

          {/* Subtle Forecast Divider Line */}
          {firstForecastDate && (
            <ReferenceLine
              x={firstForecastDate}
              stroke="var(--color-primary)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Forecast →',
                position: 'top',
                fill: 'var(--color-primary)',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Uncertainty Band Area */}
          {showBand && (
            <Area
              type="monotone"
              dataKey="band"
              name="P10-P90 Uncertainty Band"
              stroke="none"
              fill="var(--color-primary-tint)"
              fillOpacity={0.4}
              isAnimationActive={false}
            />
          )}

          {/* Historical Line */}
          {showActual && (
            <Line
              type="monotone"
              dataKey="actual"
              name="Historical Actuals"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#3B82F6' }}
              connectNulls
            />
          )}

          {/* P50 Median Line */}
          {showP50 && (
            <Line
              type="monotone"
              dataKey="p50"
              name="P50 Median Forecast"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: 'var(--color-primary)' }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
