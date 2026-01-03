import React, { useEffect, useRef, useState } from "react";

const DonutChart = ({ data, size = 120, strokeWidth = 12, className = "" }) => {
  const [animatedData, setAnimatedData] = useState(
    data.map((d) => ({ ...d, value: 0 }))
  );
  const chartRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateChart();
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, [data]);

  const animateChart = () => {
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setAnimatedData(
        data.map((item) => ({
          ...item,
          value: item.value * easeOutCubic,
        }))
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start from top

  return (
    <div ref={chartRef} className={`relative inline-block ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />

        {/* Data segments */}
        {animatedData.map((item, index) => {
          const percentage = total > 0 ? item.value / total : 0;
          const segmentLength = circumference * percentage;
          const offset = circumference - segmentLength;
          const rotation = currentAngle;

          currentAngle += percentage * 360;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transformOrigin: "center",
                transform: `rotate(${rotation}deg)`,
                transition: "stroke-dasharray 0.3s ease",
              }}
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-foreground">
          {Math.round(animatedData.reduce((sum, item) => sum + item.value, 0))}
        </p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
    </div>
  );
};

export default DonutChart;
