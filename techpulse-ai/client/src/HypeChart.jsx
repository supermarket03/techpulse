import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Q1 2024', buzz: 80, revenue: 50 },
  { name: 'Q2 2024', buzz: 120, revenue: 55 },
  { name: 'Q3 2024', buzz: 200, revenue: 60 },
  { name: 'Q4 2024', buzz: 180, revenue: 65 },
];

function HypeChart() {
  return (
    <div>
      <h2>📉 Hype vs Fundamentals</h2>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="buzz" stroke="#8884d8" />
        <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
}

export default HypeChart;