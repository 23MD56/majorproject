import React from "react";
import { motion } from "framer-motion";
import { MarketPulse } from "../components/home/MarketPulse";
import { RegimeRadar } from "../components/home/RegimeRadar";
import { AdaptiveHomeCard } from "../components/home/AdaptiveHomeCard";
import { TopRecommendations } from "../components/home/TopRecommendations";
import { LearningHub } from "../components/home/LearningHub";
import { CompoundingVisualizer } from "../components/home/CompoundingVisualizer";
import { VideoFacades } from "../components/home/VideoFacades";

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

export const HomePage: React.FC = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-5 p-4"
    >
      <h1 className="sr-only">Home Page</h1>

      {/* 1. Live Market Pulse */}
      <motion.div variants={itemVariants}>
        <MarketPulse />
      </motion.div>

      {/* 2. Market Regime Radar */}
      <motion.div variants={itemVariants}>
        <RegimeRadar />
      </motion.div>

      {/* 3. Adaptive Card (Onboarding CTA vs Portfolio Snapshot) */}
      <motion.div variants={itemVariants}>
        <AdaptiveHomeCard />
      </motion.div>

      {/* 4. Top Curated Recommendations */}
      <motion.div variants={itemVariants}>
        <TopRecommendations />
      </motion.div>

      {/* 5. Concept Mastery Learning Hub */}
      <motion.div variants={itemVariants}>
        <LearningHub />
      </motion.div>

      {/* 6. Systematic Compounding Visualizer */}
      <motion.div variants={itemVariants}>
        <CompoundingVisualizer />
      </motion.div>

      {/* 7. Video Explainer Facades */}
      <motion.div variants={itemVariants}>
        <VideoFacades />
      </motion.div>
    </motion.div>
  );
};
