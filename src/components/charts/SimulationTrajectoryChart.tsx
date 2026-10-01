import React, { useState } from 'react';

interface SimulationTrajectoryChartProps {
  upliftPct?: number;
  stockoutDay?: number;
}

export const SimulationTrajectoryChart: React.FC<SimulationTrajectoryChartProps> = ({
  upliftPct = 45,
  stockoutDay = 9,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // SVG dimensions
  // Width: 760, Height: 360
  // Left margin 65, Right margin 60, Top 45, Bottom 45
  // Plot area: X in [65, 700], Y in [45, 315]

  const milestones = [
    { label: 'Day 1', date: 'Oct 01', stock: 300, demand: 60, baseline: 75 },
    { label: 'Day 3', date: 'Oct 03', stock: 230, demand: 85, baseline: 85 },
    { label: 'Day 5', date: 'Oct 05', stock: 180, demand: 110, baseline: 95 },
    { label: 'Day 9', date: 'Oct 09', stock: 130, demand: 230, baseline: 115 },
    { label: 'Oct 11', date: 'Oct 11', stock: 75, demand: 450, baseline: 120 },
    { label: 'Oct 14', date: 'Oct 14', stock: 20, demand: 290, baseline: 95 },
    { label: 'Oct 20', date: 'Oct 20', stock: 0, demand: 320, baseline: 80 },
    { label: 'Oct 25', date: 'Oct 25', stock: 0, demand: 245, baseline: 75 },
    { label: 'Oct 28', date: 'Oct 28', stock: 0, demand: 260, baseline: 70 },
  ];

  // Adjust stockout based on uplift parameter
  const dynamicStockoutDay = stockoutDay || Math.max(5, Math.round(14 - (upliftPct / 100) * 11));

  const getX = (index: number) => 68 + index * (630 / (milestones.length - 1));
  const getYLeft = (stockVal: number) => 315 - (stockVal / 300) * 270;
  const getYDemand = (demandVal: number) => 315 - (demandVal / 500) * 270;

  // Stock Burn-down Path
  // Starts at Day 1 (300) and burns down to 0
  const stockPoints = milestones.map((m, i) => {
    // Dynamic curve adjustment
    let currentStock = m.stock;
    if (upliftPct !== 45) {
      const burnFactor = upliftPct / 45;
      if (i > 0) {
        currentStock = Math.max(0, Math.round(300 - (300 - m.stock) * burnFactor));
      }
    }
    return {
      ...m,
      stock: currentStock,
      x: getX(i),
      y: getYLeft(currentStock),
    };
  });

  const stockPathD = `
    M ${stockPoints[0].x} ${stockPoints[0].y}
    C ${stockPoints[0].x + 35} ${stockPoints[0].y + 20}, ${stockPoints[1].x - 30} ${stockPoints[1].y - 15}, ${stockPoints[1].x} ${stockPoints[1].y}
    C ${stockPoints[1].x + 35} ${stockPoints[1].y + 15}, ${stockPoints[2].x - 30} ${stockPoints[2].y - 15}, ${stockPoints[2].x} ${stockPoints[2].y}
    C ${stockPoints[2].x + 35} ${stockPoints[2].y + 15}, ${stockPoints[3].x - 30} ${stockPoints[3].y - 10}, ${stockPoints[3].x} ${stockPoints[3].y}
    C ${stockPoints[3].x + 35} ${stockPoints[3].y + 15}, ${stockPoints[4].x - 30} ${stockPoints[4].y - 15}, ${stockPoints[4].x} ${stockPoints[4].y}
    C ${stockPoints[4].x + 30} ${stockPoints[4].y + 25}, ${stockPoints[5].x - 30} ${stockPoints[5].y - 10}, ${stockPoints[5].x} ${stockPoints[5].y}
    C ${stockPoints[5].x + 35} ${stockPoints[5].y + 10}, ${stockPoints[6].x - 30} 315, ${stockPoints[6].x} 315
    L ${stockPoints[7].x} 315
    L ${stockPoints[8].x} 315
  `;

  // Fiery Orange Surge Demand Area Path
  const demandMultiplier = upliftPct / 45;
  const pDemand = milestones.map((m, i) => {
    let d = m.demand;
    if (i >= 2) {
      d = Math.min(490, Math.round(m.demand * demandMultiplier));
    }
    return { x: getX(i), y: getYDemand(d) };
  });

  const orangeSurgePathD = `
    M ${pDemand[0].x} 315
    L ${pDemand[0].x} ${pDemand[0].y}
    C ${pDemand[0].x + 30} ${pDemand[0].y}, ${pDemand[1].x - 30} ${pDemand[1].y}, ${pDemand[1].x} ${pDemand[1].y}
    C ${pDemand[1].x + 30} ${pDemand[1].y}, ${pDemand[2].x - 30} ${pDemand[2].y}, ${pDemand[2].x} ${pDemand[2].y}
    C ${pDemand[2].x + 35} ${pDemand[2].y - 20}, ${pDemand[3].x - 35} ${pDemand[3].y + 15}, ${pDemand[3].x} ${pDemand[3].y}
    C ${pDemand[3].x + 35} ${pDemand[3].y - 70}, ${pDemand[4].x - 35} ${pDemand[4].y - 5}, ${pDemand[4].x} ${pDemand[4].y}
    C ${pDemand[4].x + 35} ${pDemand[4].y + 20}, ${pDemand[5].x - 35} ${pDemand[5].y - 25}, ${pDemand[5].x} ${pDemand[5].y}
    C ${pDemand[5].x + 35} ${pDemand[5].y + 20}, ${pDemand[6].x - 35} ${pDemand[6].y - 15}, ${pDemand[6].x} ${pDemand[6].y}
    C ${pDemand[6].x + 35} ${pDemand[6].y + 15}, ${pDemand[7].x - 30} ${pDemand[7].y - 10}, ${pDemand[7].x} ${pDemand[7].y}
    C ${pDemand[7].x + 30} ${pDemand[7].y + 10}, ${pDemand[8].x - 30} ${pDemand[8].y - 10}, ${pDemand[8].x} ${pDemand[8].y}
    L ${pDemand[8].x} 315
    Z
  `;

  // Baseline Gray Area Path
  const pBase = milestones.map((m, i) => ({
    x: getX(i),
    y: getYLeft(m.baseline),
  }));

  const grayBaselinePathD = `
    M ${pBase[0].x} 315
    L ${pBase[0].x} ${pBase[0].y}
    C ${pBase[0].x + 35} ${pBase[0].y - 5}, ${pBase[1].x - 35} ${pBase[1].y + 5}, ${pBase[1].x} ${pBase[1].y}
    C ${pBase[1].x + 35} ${pBase[1].y - 5}, ${pBase[2].x - 35} ${pBase[2].y + 5}, ${pBase[2].x} ${pBase[2].y}
    C ${pBase[2].x + 35} ${pBase[2].y - 10}, ${pBase[3].x - 35} ${pBase[3].y + 5}, ${pBase[3].x} ${pBase[3].y}
    C ${pBase[3].x + 35} ${pBase[3].y - 5}, ${pBase[4].x - 35} ${pBase[4].y + 5}, ${pBase[4].x} ${pBase[4].y}
    C ${pBase[4].x + 35} ${pBase[4].y + 5}, ${pBase[5].x - 35} ${pBase[5].y - 5}, ${pBase[5].x} ${pBase[5].y}
    C ${pBase[5].x + 35} ${pBase[5].y + 10}, ${pBase[6].x - 35} ${pBase[6].y - 5}, ${pBase[6].x} ${pBase[6].y}
    C ${pBase[6].x + 35} ${pBase[6].y + 5}, ${pBase[7].x - 35} ${pBase[7].y - 5}, ${pBase[7].x} ${pBase[7].y}
    C ${pBase[7].x + 35} ${pBase[7].y + 5}, ${pBase[8].x - 35} ${pBase[8].y - 5}, ${pBase[8].x} ${pBase[8].y}
    L ${pBase[8].x} 315
    Z
  `;

  // Milestone points
  const shipment1X = getX(1.7); // between Day 3 and Day 5 (~Day 3.7)
  const stockoutX = getX(3); // Day 9
  const stockoutY = stockPoints[3].y; // intersection point (~193)

  return (
    <div className="w-full font-sans select-none overflow-x-auto relative">
      <div className="min-w-[680px]">
        <svg viewBox="0 0 760 360" className="w-full h-auto overflow-visible">
          <defs>
            {/* Fiery Surge Gradient */}
            <linearGradient id="surgeOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.88" />
              <stop offset="45%" stopColor="#ea580c" stopOpacity="0.65" />
              <stop offset="85%" stopColor="#c2410c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.05" />
            </linearGradient>

            {/* Baseline Gray Gradient */}
            <linearGradient id="baselineGrayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#475569" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
            </linearGradient>

            {/* Red Beacon Glow */}
            <filter id="stockoutGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.9" />
            </filter>

            {/* Callout Box Glow */}
            <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* =========================================================================
              1. HORIZONTAL GRIDLINES & Y-AXIS TICKS
              ========================================================================= */}
          {[
            { left: 300, right: 500, val: 300 },
            { left: 250, right: 350, val: 250 },
            { left: 200, right: 400, val: 200 },
            { left: 150, right: 250, val: 150 },
            { left: 100, right: 200, val: 100 },
            { left: 50, right: 50, val: 50 },
            { left: 0, right: 0, val: 0 },
          ].map((grid, idx) => {
            const y = getYLeft(grid.val);
            return (
              <g key={idx}>
                {/* Horizontal Gridline */}
                <line
                  x1="65"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Left Y-Axis Label (Stock Level) */}
                <text
                  x="58"
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {grid.left}
                </text>

                {/* Right Y-Axis Label (Daily Demand) */}
                <text
                  x="708"
                  y={y + 3.5}
                  textAnchor="start"
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {grid.right}
                </text>
              </g>
            );
          })}

          {/* Left Y-Axis Label: Stock Level (Rotated) */}
          <text
            x="-180"
            y="24"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Stock Level
          </text>

          {/* Right Y-Axis Label: Daily Demand (Rotated) */}
          <text
            x="180"
            y="-742"
            transform="rotate(90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Daily Demand
          </text>

          {/* =========================================================================
              2. SHADED REGIONS: Baseline Gray & Fiery Orange Surge Demand
              ========================================================================= */}
          {/* Layer 1: Gray Baseline Stock Area */}
          <path d={grayBaselinePathD} fill="url(#baselineGrayGrad)" />

          {/* Layer 2: Fiery Orange Surge Demand Mountain */}
          <path d={orangeSurgePathD} fill="url(#surgeOrangeGrad)" />

          {/* =========================================================================
              3. SHIPMENT 1 ANNOTATION (Day 3.7)
              ========================================================================= */}
          <line
            x1={shipment1X}
            y1="45"
            x2={shipment1X}
            y2="315"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
          />
          <text
            x={shipment1X + 4}
            y="56"
            fill="#cbd5e1"
            fontSize="9"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Delivery
          </text>
          <text
            x={shipment1X + 4}
            y="67"
            fill="#cbd5e1"
            fontSize="9"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Arrives
          </text>

          {/* =========================================================================
              4. SHIPMENT 2 & STOCKOUT POINT ANNOTATIONS (Day 9)
              ========================================================================= */}
          {/* Shipment 2 Vertical Line */}
          <line
            x1={stockoutX}
            y1="45"
            x2={stockoutX}
            y2="315"
            stroke="#f8fafc"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />
          <text
            x={stockoutX + 5}
            y="54"
            fill="#f8fafc"
            fontSize="9.5"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Delivery Arrives (Day 5)
          </text>

          {/* Red vertical drop line from Stockout Point down to X-axis */}
          <line
            x1={stockoutX}
            y1={stockoutY}
            x2={stockoutX}
            y2="315"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeOpacity="0.9"
          />

          {/* Stockout Point Beacon Dot */}
          <circle cx={stockoutX} cy={stockoutY} r="10" fill="#ef4444" fillOpacity="0.35" />
          <circle
            cx={stockoutX}
            cy={stockoutY}
            r="6"
            fill="#ef4444"
            filter="url(#stockoutGlow)"
          />
          <circle cx={stockoutX} cy={stockoutY} r="3" fill="#ffffff" />

          {/* Stockout Point Callout Badge */}
          <g filter="url(#badgeShadow)">
            <rect
              x={stockoutX - 52}
              y={stockoutY - 50}
              width="104"
              height="36"
              rx="6"
              fill="#381017"
              stroke="#ef4444"
              strokeWidth="1.2"
            />
            <text
              x={stockoutX}
              y={stockoutY - 37}
              textAnchor="middle"
              fill="#fca5a5"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
              letterSpacing="0.08em"
            >
              OUT OF STOCK
            </text>
            <text
              x={stockoutX}
              y={stockoutY - 22}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              Day {dynamicStockoutDay}
            </text>
          </g>

          {/* =========================================================================
              5. STOCK BURN-DOWN CURVE (Coral Red Line)
              ========================================================================= */}
          <path
            d={stockPathD}
            fill="none"
            stroke="#f87171"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* =========================================================================
              6. X-AXIS TICKS & LABELS
              ========================================================================= */}
          {milestones.map((m, i) => {
            const x = getX(i);
            const isHovered = hoveredPoint === i;
            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Tick mark */}
                <line x1={x} y1="315" x2={x} y2="320" stroke="#475569" strokeWidth="1" />

                {/* Day / Date label */}
                <text
                  x={x}
                  y="332"
                  textAnchor="middle"
                  fill={isHovered ? '#38bdf8' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {m.label}
                </text>

                {/* Invisible hover trigger line */}
                <rect x={x - 18} y="45" width="36" height="270" fill="transparent" />
              </g>
            );
          })}

          {/* Centered X-Axis Title: Time */}
          <text
            x="382"
            y="350"
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Time
          </text>
        </svg>
      </div>
    </div>
  );
};
