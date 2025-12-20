import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const ConfidenceChart = ({ slips, height = 400 }) => {
  const theme = useTheme();
  
  // Process slips data for the chart
  const chartData = slips
    .map(slip => ({
      name: slip.slip_id,
      confidence: slip.confidence_score,
      odds: slip.total_odds,
      return: slip.possible_return,
      risk: slip.risk_level
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15); // Show top 15 for readability

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low Risk': return theme.palette.success.main;
      case 'Medium Risk': return theme.palette.warning.main;
      case 'High Risk': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
          <Typography variant="subtitle2" color="primary">
            {data.name}
          </Typography>
          <Typography variant="body2">
            Confidence: <strong>{data.confidence.toFixed(1)}%</strong>
          </Typography>
          <Typography variant="body2">
            Total Odds: <strong>{data.odds.toFixed(2)}</strong>
          </Typography>
          <Typography variant="body2">
            Potential Return: <strong>${data.return.toFixed(2)}</strong>
          </Typography>
          <Typography variant="body2">
            Risk: <strong>{data.risk}</strong>
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <Typography variant="h6" gutterBottom align="center">
        Slip Confidence Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: 'Confidence Score (%)', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="confidence" 
            name="Confidence Score"
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
            ))}
            <LabelList 
              dataKey="confidence" 
              position="top"
              formatter={(value) => `${value.toFixed(1)}%`}
              style={{ fontSize: 11, fill: theme.palette.text.primary }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ConfidenceChart;