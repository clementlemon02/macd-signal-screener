import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';

import { MacdData } from '@/lib/types';
import React from 'react';

interface MacdMiniChartProps {
  data: MacdData[];
  width?: number;
  height?: number;
}

const MacdMiniChart: React.FC<MacdMiniChartProps> = ({ 
  data,
  width = 160, // Increased from 120
  height = 60
}) => {
  const chartData = [...data].slice(-7); // Get last 7 days of data
  
  // Find min and max values for proper chart scaling
  const allValues = chartData.flatMap(d => [d.macdLine, d.signalLine, d.histogram]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const domain: [number, number] = [
    Math.min(minValue, 0) * 1.1, // Make sure 0 is included and add 10% padding
    Math.max(maxValue, 0) * 1.1
  ];

  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          
          {/* Histogram as bars */}
          <Bar 
            dataKey="histogram" 
            isAnimationActive={false}
            barSize={width / (data.length * 2)} // Adjust bar size based on number of data points
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.histogram >= 0 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(248, 113, 113, 0.8)'}
              />
            ))}
          </Bar>
          
          {/* Zero line */}
          <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
          
          {/* MACD Line */}
          <Line
            type="monotone"
            dataKey="macdLine"
            stroke="#3B82F6"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          
          {/* Signal Line */}
          <Line
            type="monotone"
            dataKey="signalLine"
            stroke="#EC4899"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacdMiniChart;
