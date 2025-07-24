import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface GrowthRateChartProps {
  initialValue: number;
  cagr: number; // as a percentage, e.g. 20 for 20%
  years: number;
  currency?: string;
}

export const GrowthRateChart: React.FC<GrowthRateChartProps> = ({
  initialValue,
  cagr,
  years,
  currency = "USD",
}) => {
  // Generate data for each year
  const data = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i <= years; i++) {
      const value = initialValue * Math.pow(1 + cagr / 100, i);
      arr.push({
        year: `Year ${i}`,
        value: Math.round(value),
      });
    }
    return arr;
  }, [initialValue, cagr, years]);

  return (
    <div className="w-full h-64 bg-white rounded-lg shadow p-4">
      <h4 className="font-semibold text-gray-800 mb-2">
        Growth Rate Prediction (CAGR {cagr}%)
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(v) =>
              `${currency === "USD" ? "$" : ""}${v.toLocaleString()}`
            }
          />
          <Tooltip
            formatter={(v: number) =>
              `${currency === "USD" ? "$" : ""}${v.toLocaleString()}`
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4, fill: "#2563eb" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
