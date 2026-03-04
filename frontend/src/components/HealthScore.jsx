import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

const HealthScore = ({ device }) => {
  // Calculate health score based on uptime and latency
  const calculateHealthScore = () => {
    let score = 0;
    
    // Uptime component (70% weight)
    score += (device.uptime_percent / 100) * 70;
    
    // Latency component (30% weight)
    if (device.latest_latency_ms) {
      if (device.latest_latency_ms < 20) score += 30;
      else if (device.latest_latency_ms < 50) score += 25;
      else if (device.latest_latency_ms < 100) score += 15;
      else score += 5;
    }
    
    return Math.round(score);
  };

  const score = calculateHealthScore();
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        <svg className="transform -rotate-90 w-12 h-12">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - score / 100)}`}
            className={getScoreColor(score)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <div className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'}
        </div>
        <div className="text-xs text-gray-400">Health Score</div>
      </div>
    </div>
  );
};

export default HealthScore;