"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/**
 * CircularProgress - Animated circular progress ring
 *
 * Features:
 * - Smooth animation from 0 to target score
 * - Color changes based on score thresholds
 * - Glowing effect that matches the score color
 */
export default function CircularProgress({
  score,
  size = 220,
  strokeWidth = 12,
  label = "Resume Score",
}: CircularProgressProps) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client before animating
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Spring animation for smooth score transition
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: 2000,
  });

  // Animate to score when component mounts
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        springValue.set(score);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isClient, score, springValue]);

  // Transform spring value to stroke offset
  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );

  // Animated display value
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  // Determine color based on score
  const getScoreColor = (value: number) => {
    if (value < 60) return { main: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
    if (value < 85) return { main: "#f97316", glow: "rgba(249, 115, 22, 0.4)" };
    return { main: "#22c55e", glow: "rgba(34, 197, 94, 0.4)" };
  };

  const colors = getScoreColor(score);

  // Track animated value for color transitions
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => {
      setAnimatedValue(v);
    });
    return () => unsubscribe();
  }, [springValue]);

  const animatedColors = getScoreColor(animatedValue);

  if (!isClient) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center"
      >
        <div className="loader-orb" style={{ width: 60, height: 60 }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Glow effect behind the ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${animatedColors.glow} 0%, transparent 70%)`,
          }}
        />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 10px ${animatedColors.glow})` }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth}
            className="transition-all duration-300"
          />

          {/* Animated progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={animatedColors.main}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            className="transition-colors duration-500"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold transition-colors duration-500"
            style={{ color: animatedColors.main }}
          >
            {displayValue}
          </motion.span>
          <span className="text-gray-500 text-sm mt-1">out of 100</span>
        </div>
      </div>

      {/* Label */}
      <span className="text-lg font-semibold text-gray-700">{label}</span>
    </div>
  );
}
