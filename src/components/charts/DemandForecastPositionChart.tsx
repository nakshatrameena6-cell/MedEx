import React from 'react';

export const DemandForecastPositionChart: React.FC = () => {
  // Chart geometry: viewBox 0 0 1000 370
  // Left margin 65, Right 40, Top 30, Bottom 55
  // Plot Width = 895, Plot Height = 285

  // 17 Historical points + 13 Forecast points = 30 points
  const historicalDates = [
    '09/02', '09/04', '09/06', '09/08', '09/10', '09/11', '09/13', '09/15',
    '09/16', '09/17', '09/19', '09/20', '09/21', '09/23', '09/25', '09/27', '09/30',
  ];

  const forecastDates = [
    '10/01', '10/02', '10/03', '10/04', '10/05', '10/06', '10/07', '10/08',
    '10/09', '10/10', '10/11', '10/13', '10/15',
  ];

  const allDates = [...historicalDates, ...forecastDates];

  // Value to Y calculation (0 = 315, 15 = 247.5, 30 = 180, 45 = 112.5, 60 = 45)
  const getY = (val: number) => 315 - (val / 60) * 270;
  const getX = (index: number) => 68 + index * (892 / (allDates.length - 1));

  // Historical actual values matching the image curve:
  const actualValues = [
    18, 22, 19, 21, 23, 20, 24, 21, 22, 25, 23, 27, 24, 28, 26, 21, 24,
  ];

  const historyPoints = actualValues.map((v, i) => ({
    x: getX(i),
    y: getY(v),
    val: v,
  }));

  const historyPathD = historyPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  // Forecast P50 curve rising steadily:
  const forecastP50Values = [
    24, 25, 26, 27, 29, 31, 33, 34, 36, 38, 40, 42, 43,
  ];

  const p10Values = [23, 23, 24, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
  const p90Values = [25, 28, 30, 33, 37, 41, 45, 48, 51, 53, 56, 58, 60];

  const forecastStartIndex = historicalDates.length - 1; // 16

  const forecastPoints = forecastP50Values.map((v, i) => ({
    x: getX(forecastStartIndex + i),
    y: getY(v),
    val: v,
  }));

  const forecastPathD = forecastPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  // Uncertainty Band Polygon path
  const p90Points = p90Values.map((v, i) => ({
    x: getX(forecastStartIndex + i),
    y: getY(v),
  }));

  const p10Points = p10Values.map((v, i) => ({
    x: getX(forecastStartIndex + i),
    y: getY(v),
  }));

  let bandPathD = `M ${p90Points[0].x} ${p90Points[0].y}`;
  p90Points.forEach((p) => {
    bandPathD += ` L ${p.x} ${p.y}`;
  });
  for (let i = p10Points.length - 1; i >= 0; i--) {
    bandPathD += ` L ${p10Points[i].x} ${p10Points[i].y}`;
  }
  bandPathD += ' Z';

  const todayX = getX(forecastStartIndex); // index 16 = 09/30

  return (
    <div className="rounded-2xl bg-[#080e1c] border border-slate-800/90 p-5 sm:p-6 shadow-2xl space-y-3 font-sans select-none relative overflow-hidden">
      {/* Chart Header & Top Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Medicine Usage & Projected Demand
        </h2>

        {/* Top Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-4 h-[2px] bg-red-400 border-b border-dashed border-red-400" />
            <span className="text-[11px]">Safety Stock Level</span>
          </div>

          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
            <span className="text-[11px]">Past Daily Use</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
            <span className="text-[11px]">Expected Usage</span>
          </div>
        </div>
      </div>

      {/* Main SVG Chart Canvas */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[840px]">
          <svg viewBox="0 0 1000 370" className="w-full h-auto overflow-visible">
            <defs>
              {/* Uncertainty Band Gradient */}
              <linearGradient id="uncertaintyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.30" />
              </linearGradient>

              {/* Callout Shadow */}
              <filter id="boxGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[
              { val: 60, label: '60\nsachets' },
              { val: 45, label: '45\nsachets' },
              { val: 30, label: '30\nsachets' },
              { val: 15, label: '15\nsachets' },
              { val: 0, label: '0\nsachets' },
            ].map((grid, idx) => {
              const y = getY(grid.val);
              return (
                <g key={idx}>
                  <line
                    x1="65"
                    y1={y}
                    x2="965"
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x="58"
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {grid.val}
                  </text>
                  <text
                    x="58"
                    y={y + 13}
                    textAnchor="end"
                    fill="#475569"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    sachets
                  </text>
                </g>
              );
            })}

            {/* Red Minimum Buffer Threshold Line (at 15 sachets) */}
            <line
              x1="68"
              y1={getY(15)}
              x2="965"
              y2={getY(15)}
              stroke="#ef4444"
              strokeWidth="1.6"
              strokeDasharray="4 4"
            />

            {/* P10–P90 Uncertainty Band (Future Ribbon) */}
            <path d={bandPathD} fill="url(#uncertaintyGrad)" />

            {/* Historical Actuals Line */}
            <path
              d={historyPathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Historical Data Dots */}
            {historyPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3.2"
                fill="#3b82f6"
                stroke="#080e1c"
                strokeWidth="1.5"
                className="transition-transform hover:scale-150"
              />
            ))}

            {/* Forecast P50 Median Line */}
            <path
              d={forecastPathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeDasharray="4 4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Forecast Dots */}
            {forecastPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="2.8"
                fill="#38bdf8"
                stroke="#080e1c"
                strokeWidth="1.5"
              />
            ))}

            {/* Vertical TODAY Line & Marker */}
            <line
              x1={todayX}
              y1="30"
              x2={todayX}
              y2="315"
              stroke="#f8fafc"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* TODAY Badge at top of line */}
            <rect
              x={todayX - 19}
              y="11"
              width="38"
              height="16"
              rx="4"
              fill="#0b1324"
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x={todayX}
              y="22"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              TODAY
            </text>

            {/* Glowing Dot on Today Line */}
            <circle cx={todayX} cy={getY(24)} r="5" fill="#38bdf8" />
            <circle cx={todayX} cy={getY(24)} r="2.5" fill="#ffffff" />            {/* Callout 1 (Top right of Today) */}
            <g filter="url(#boxGlow)">
              <rect
                x={todayX + 16}
                y="52"
                width="165"
                height="70"
                rx="8"
                fill="#0b1324"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <text x={todayX + 26} y="68" fill="#e2e8f0" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                Date Sep 30
              </text>
              <text x={todayX + 26} y="82" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                Actual Use: 42 sachets
              </text>
              <text x={todayX + 26} y="95" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                Expected Range: 35–48
              </text>
              <text x={todayX + 26} y="107" fill="#34d399" fontSize="8.5" fontFamily="monospace">
                - Rain Impact: +38%
              </text>
              <text x={todayX + 26} y="118" fill="#34d399" fontSize="8.5" fontFamily="monospace">
                - Seasonal Spike: +35%
              </text>
            </g>

            {/* Callout 2 (Bottom right of Today) */}
            <g filter="url(#boxGlow)">
              <rect
                x={todayX + 56}
                y="148"
                width="165"
                height="70"
                rx="8"
                fill="#0b1324"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <text x={todayX + 66} y="164" fill="#e2e8f0" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                Forecast Oct 10
              </text>
              <text x={todayX + 66} y="178" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                Projected Peak: 45 sachets
              </text>
              <text x={todayX + 66} y="191" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                Expected Range: 37–53
              </text>
              <text x={todayX + 66} y="203" fill="#34d399" fontSize="8.5" fontFamily="monospace">
                - Regional Illness: +24%
              </text>
              <text x={todayX + 66} y="214" fill="#34d399" fontSize="8.5" fontFamily="monospace">
                - Yearly Trend: +18%
              </text>
            </g>

            {/* X-Axis Ticks & Labels */}
            {allDates.map((d, i) => {
              const x = getX(i);
              return (
                <text
                  key={i}
                  x={x}
                  y="332"
                  textAnchor="middle"
                  fill={i >= forecastStartIndex ? '#94a3b8' : '#64748b'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {d}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-7 pt-2 text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="shrink-0">
            <line x1="0" y1="6" x2="24" y2="6" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="12" cy="6" r="3" fill="#3b82f6" />
          </svg>
          <span>Past Daily Use</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-4 h-2.5 rounded-[2px] bg-[#1e3a8a]/70 border border-sky-400/50 shadow-xs" />
          <span>Likely Range (Low to High)</span>
        </div>

        <div className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="shrink-0">
            <line x1="0" y1="6" x2="24" y2="6" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
            <polygon points="12,2 15,6 12,10 9,6" fill="#38bdf8" />
          </svg>
          <span>Expected Usage (Average)</span>
        </div>
      </div>
    </div>
  );
};
