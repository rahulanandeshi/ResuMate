"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { AnalyzeResponse } from "@/types/resume";
import CircularProgress from "@/components/CircularProgress";

/**
 * ResultsPage - Displays AI resume analysis results
 *
 * Features:
 * - Animated circular progress for resume score
 * - Dynamic background color based on score
 * - Confetti animation for high scores
 * - Warning pulse for low scores
 * - Strengths and weaknesses cards with hover animations
 * - Match percentage display (if job description was provided)
 */
export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Get window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load results from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);

        // Trigger confetti for high scores
        if (parsed.resumeScore >= 85) {
          setTimeout(() => setShowConfetti(true), 1500);
          // Stop confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 6500);
        }
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
    setIsLoading(false);
  }, [router]);

  // Determine score category and colors
  const scoreCategory = useMemo(() => {
    if (!result) return null;
    const score = result.resumeScore;

    if (score < 60) {
      return {
        level: "low",
        label: "Needs Improvement",
        bgGradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)",
        accentColor: "#ef4444",
        cardBg: "rgba(254, 226, 226, 0.5)",
      };
    }
    if (score < 85) {
      return {
        level: "medium",
        label: "Good Progress",
        bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
        accentColor: "#f97316",
        cardBg: "rgba(254, 243, 199, 0.5)",
      };
    }
    return {
      level: "high",
      label: "Excellent!",
      bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
      accentColor: "#22c55e",
      cardBg: "rgba(220, 252, 231, 0.5)",
    };
  }, [result]);

  const handleAnalyzeAnother = () => {
    sessionStorage.removeItem("analysisResult");
    router.push("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="loader-container">
          <div className="loader-orb" />
          <p className="loader-text">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result || !scoreCategory) {
    return null;
  }

  return (
    <>
      {/* Confetti for high scores */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
          colors={["#f9a8d4", "#c4b5fd", "#8b5cf6", "#22c55e", "#fbbf24"]}
        />
      )}

      {/* Warning pulse animation for low scores */}
      <AnimatePresence>
        {scoreCategory.level === "low" && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: 3,
              ease: "easeInOut",
            }}
            style={{
              background: "radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Glow animation for high scores */}
      <AnimatePresence>
        {scoreCategory.level === "high" && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              ease: "easeOut",
            }}
            style={{
              background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        className="min-h-screen p-6 md:p-12 transition-all duration-1000 relative z-10"
        style={{ background: scoreCategory.bgGradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <main className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.header
            className="text-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1
              className="text-4xl md:text-5xl font-bold gradient-text mb-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push("/")}
            >
              ResuMate
            </h1>
            <p className="text-lg text-gray-600">Analysis Results</p>
          </motion.header>

          {/* Disclaimer */}
          <motion.div
            className="glass-card p-4 mb-8 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Disclaimer:</strong> AI analysis might not be fully accurate. Always rely on human judgment for final decisions.
              </span>
            </p>
          </motion.div>

          {/* Score Section */}
          <motion.div
            className="glass-card p-8 md:p-10 mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              {/* Resume Score */}
              <div className="flex flex-col items-center">
                <CircularProgress score={result.resumeScore} label="Resume Score" />
                <motion.span
                  className="mt-4 px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: scoreCategory.accentColor }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2, type: "spring" }}
                >
                  {scoreCategory.label}
                </motion.span>
              </div>

              {/* Match Percentage (if available) */}
              {result.matchPercentage !== null && (
                <div className="flex flex-col items-center">
                  <CircularProgress
                    score={result.matchPercentage}
                    size={180}
                    label="Job Match"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <motion.div
              className="glass-card p-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Strengths</h2>
              </div>
              <ul className="space-y-3">
                {result.strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    className="strength-card"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Weaknesses */}
            <motion.div
              className="glass-card p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Areas to Improve</h2>
              </div>
              <ul className="space-y-3">
                {result.weaknesses.map((weakness, index) => (
                  <motion.li
                    key={index}
                    className="weakness-card"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: -5 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{weakness}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Action Button */}
          <motion.div
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <button
              className="glass-button text-lg px-8"
              onClick={handleAnalyzeAnother}
            >
              Analyze Another Resume
            </button>
          </motion.div>

          {/* Footer */}
          <motion.footer
            className="text-center mt-12 pt-8 border-t border-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <p className="text-sm text-gray-500">
              Powered by AI • Built by <span className="font-semibold gradient-text">Rahul Anandeshi</span>
            </p>
          </motion.footer>
        </main>
      </motion.div>
    </>
  );
}
