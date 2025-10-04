import React, { useState, useMemo, useRef, useCallback } from 'react';

interface ChartDataPoint {
  day: number;
  totalValue: number;
  holdValue: number;
  earnedFees: number;
}

interface ChartProps {
  data: ChartDataPoint[];
}

const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: ChartDataPoint } | null>(null);

  const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };
  const WIDTH = 800;
  const HEIGHT = 400;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const yMin = Math.min(...data.map(d => d.totalValue), ...data.map(d => d.holdValue));
    const yMax = Math.max(...data.map(d => d.totalValue), ...data.map(d => d.holdValue));
    const xMax = data[data.length - 1].day;

    // Create nice looking scales
    const yRange = yMax - yMin;
    const yDomainMin = Math.floor(yMin / 1000) * 1000;
    const yDomainMax = Math.ceil(yMax / 1000) * 1000;

    const xScale = (day: number) => PADDING.left + (day / xMax) * (WIDTH - PADDING.left - PADDING.right);
    const yScale = (value: number) => HEIGHT - PADDING.bottom - ((value - yDomainMin) / (yDomainMax - yDomainMin)) * (HEIGHT - PADDING.top - PADDING.bottom);

    const yAxisLabels = [];
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
        const value = yDomainMin + (i / numTicks) * (yDomainMax - yDomainMin);
        yAxisLabels.push({ value, y: yScale(value) });
    }

    const xAxisLabels = [];
    const numXTicks = Math.min(xMax, 5);
     for (let i = 0; i <= numXTicks; i++) {
        const day = Math.round((i / numXTicks) * xMax);
        xAxisLabels.push({ day, x: xScale(day) });
    }

    const createPath = (key: 'totalValue' | 'holdValue') =>
        data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.day)} ${yScale(d[key])}`).join(' ');

    return {
        xScale, yScale, yAxisLabels, xAxisLabels,
        totalValuePath: createPath('totalValue'),
        holdValuePath: createPath('holdValue'),
    };
  }, [data]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || !svgRef.current || data.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const svgX = event.clientX - rect.left;

    const xMax = data[data.length - 1].day;
    const day = (svgX - PADDING.left) / (WIDTH - PADDING.left - PADDING.right) * xMax;

    const closestPoint = data.reduce((prev, curr) => 
        Math.abs(curr.day - day) < Math.abs(prev.day - day) ? curr : prev
    );

    setTooltip({
        x: chartData.xScale(closestPoint.day),
        y: chartData.yScale(closestPoint.totalValue),
        data: closestPoint,
    });
  }, [chartData, data]);

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  if (!chartData) {
    return (
        <div className="w-full h-full flex items-center justify-center text-slate-500">
            <p>Not enough data to display chart.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-full relative font-sans">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full"
      >
        <g className="grid-lines">
            {chartData.yAxisLabels.map(({ y }) => (
                <line key={y} x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="#334155" strokeWidth="1" />
            ))}
        </g>
        
        <g className="axes-labels">
            {chartData.yAxisLabels.map(({ value, y }) => (
                <text key={value} x={PADDING.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">{formatCurrency(value)}</text>
            ))}
            {chartData.xAxisLabels.map(({ day, x }) => (
                <text key={day} x={x} y={HEIGHT - PADDING.bottom + 16} textAnchor="middle" fill="#94a3b8" fontSize="12">{`Day ${day}`}</text>
            ))}
        </g>
        
        <path d={chartData.holdValuePath} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
        <path d={chartData.totalValuePath} fill="none" stroke="#22d3ee" strokeWidth="3" />
        
        {tooltip && (
            <g className="tooltip">
                <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={HEIGHT - PADDING.bottom} stroke="#64748b" strokeWidth="1" />
                <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />
                <circle cx={tooltip.x} cy={chartData.yScale(tooltip.data.holdValue)} r="5" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
            </g>
        )}
      </svg>
      {tooltip && (
        <div 
          className="absolute bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-sm text-slate-200 pointer-events-none transition-transform duration-100"
          style={{ 
            left: `${(tooltip.x / WIDTH) * 100}%`, 
            top: `${(tooltip.y / HEIGHT) * 100}%`,
            transform: `translate(-50%, -110%) ${tooltip.x > WIDTH / 2 ? 'translateX(-20px)' : 'translateX(20px)'}`
          }}
        >
          <div className="font-bold mb-2">Day {tooltip.data.day}</div>
          <div className="flex items-center justify-between space-x-4">
              <span className="text-slate-400">Total Value:</span> <span className="font-mono text-cyan-400">{tooltip.data.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
          <div className="flex items-center justify-between">
              <span className="text-slate-400">HODL Value:</span> <span className="font-mono">{tooltip.data.holdValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
          <div className="flex items-center justify-between">
              <span className="text-slate-400">Earned Fees:</span> <span className="font-mono text-green-400">{tooltip.data.earnedFees.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
          <div className="border-t border-slate-700 my-1.5"></div>
           <div className="flex items-center justify-between">
              <span className="text-slate-400">Net vs HODL:</span> 
              <span className={`font-mono ${tooltip.data.totalValue >= tooltip.data.holdValue ? 'text-green-400' : 'text-red-400'}`}>
                {(tooltip.data.totalValue - tooltip.data.holdValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
          </div>
        </div>
      )}
       <div className="absolute bottom-0 right-2 flex items-center space-x-4 text-xs text-slate-400 p-2">
            <div className="flex items-center">
                <div className="w-3 h-0.5 bg-cyan-400 mr-2"></div>
                <span>Total Value</span>
            </div>
            <div className="flex items-center">
                <svg width="12" height="4" className="mr-2"><line x1="0" y1="2" x2="12" y2="2" stroke="#64748b" strokeWidth="2" strokeDasharray="2 2"/></svg>
                <span>HODL Value</span>
            </div>
       </div>
    </div>
  );
};

export default Chart;