import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const MiniResponseChart = ({ data, isDown }) => {
  const strokeColor = isDown ? '#ef4444' : '#4CAF50';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="text-white text-sm">
          {`${payload[0].value.toFixed(0)} ms`}
        </div>
      );
    }
    return null;
  };

  const getLatestResponseTime = () => {
    if (!data?.length) return null;
    const latest = data[data.length - 1].response_time;
    return `${latest.toFixed(0)} ms`;
  };

  return (
    <div className="relative h-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey="response_time"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
          />
          <YAxis
            hide
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            wrapperStyle={{ outline: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute top-0 right-0 text-xs text-gray-400">
        {getLatestResponseTime()}
      </div>
    </div>
  );
};

export default MiniResponseChart;