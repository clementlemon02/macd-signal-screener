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
import { MacdData, TimeFrame } from '@/lib/types';

import React from 'react';

interface MacdMiniChartProps {
  data: MacdData[];
  selectedTimeFrame: TimeFrame;
  width?: number;
  height?: number;
  days?: number;
}

const MacdMiniChart: React.FC<MacdMiniChartProps> = ({ 
  data,
  selectedTimeFrame,
  width = 160,
  height = 60,
  days = 7
}) => {
  const chartData = [...data].slice(-days); // Get last N days of data based on the days prop
  
  const allValues = chartData.flatMap(d => [d.macdLine, d.signalLine, d.histogram]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const domain: [number, number] = [
    Math.min(minValue, 0) * 1.1,
    Math.max(maxValue, 0) * 1.1
  ];

  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <XAxis dataKey="date" hide />
          <YAxis hide domain={domain} />
          
          <Bar 
            dataKey="histogram" 
            isAnimationActive={false}
            barSize={width / (chartData.length * 2)}
          >
            {chartData.map((entry, index) => {
              const prev = chartData[index - 1]?.histogram ?? entry.histogram;
              const isIncreasing = entry.histogram >= prev;
              const color =
                entry.histogram >= 0
                  ? isIncreasing ? '#34D399' : '#BBF7D0'  // green vs light green
                  : isIncreasing ? '#FECACA' : '#F87171'; // light red vs red

              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>

          
          <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
          
          <Line
            type="monotone"
            dataKey="macdLine"
            stroke="#3B82F6"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          
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
