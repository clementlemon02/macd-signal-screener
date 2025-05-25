import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';

import { PriceData } from '@/lib/types';
import React from 'react';

interface MiniPriceChartProps {
  data: PriceData[];
  width?: number;
  height?: number;
  days?: number;
}

const MiniPriceChart: React.FC<MiniPriceChartProps> = ({
  data,
  width = 160,
  height = 60,
  days = 30
}) => {
  const chartData = [...data].slice(-days);

  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            fill="url(#colorPrice)"
            strokeWidth={1}
            isAnimationActive={false}
          />
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniPriceChart; 