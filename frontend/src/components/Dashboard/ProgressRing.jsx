import React, { useEffect, useRef, useState } from "react";

const ProgressRing = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = "currentColor",
  showPercentage = true,
  className = "",
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const ringRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateProgress();
        }
      },
      { threshold: 0.1 }
    );

    if (ringRef.current) {
      observer.observe(ringRef.current);
    }

    return () => observer.disconnect();
  }, [progress]);

  const animateProgress = () => {
    const duration = 1200;
    const startTime = Date.now();
    const targetProgress = Math.min(Math.max(progress, 0), 100);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progressValue = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progressValue, 3);

      setAnimatedProgress(targetProgress * easeOutCubic);

      if (progressValue < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div ref={ringRef} className={`relative inline-block ${className}`}>
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

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Center percentage */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground tabular-nums">
            {Math.round(animatedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
