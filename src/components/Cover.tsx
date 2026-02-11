"use client";

import { motion } from "framer-motion";

interface CoverProps {
  onOpen: () => void;
}

export default function Cover({ onOpen }: CoverProps) {
  const currentYear = new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[100dvh] p-4 sm:p-6"
    >
      <motion.button
        onClick={onOpen}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative cursor-pointer focus:outline-none"
        style={{ perspective: "1200px" }}
      >
        {/* Book */}
        <div
          className="relative w-[280px] h-[400px] sm:w-[340px] sm:h-[480px] md:w-[380px] md:h-[540px] rounded-r-xl rounded-l-[3px] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #2d3436 0%, #1a1a2e 50%, #16213e 100%)",
            boxShadow:
              "10px 10px 40px rgba(0,0,0,0.5), -2px 0 6px rgba(0,0,0,0.3), inset 0 0 80px rgba(0,0,0,0.2)",
          }}
        >
          {/* Subtle grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-4"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.03), rgba(0,0,0,0.15))" }}
          />

          {/* Top decorative line */}
          <div className="absolute top-12 sm:top-16 left-8 right-8 h-[0.5px] bg-gold/20" />
          <div className="absolute top-[52px] sm:top-[68px] left-8 right-8 h-[0.5px] bg-gold/10" />

          {/* Bottom decorative line */}
          <div className="absolute bottom-20 sm:bottom-24 left-8 right-8 h-[0.5px] bg-gold/20" />
          <div className="absolute bottom-[84px] sm:bottom-[100px] left-8 right-8 h-[0.5px] bg-gold/10" />

          {/* Corner ornaments */}
          <div className="absolute top-14 sm:top-[70px] left-8 w-4 h-4 border-t border-l border-gold/30" />
          <div className="absolute top-14 sm:top-[70px] right-8 w-4 h-4 border-t border-r border-gold/30" />
          <div className="absolute bottom-[86px] sm:bottom-[102px] left-8 w-4 h-4 border-b border-l border-gold/30" />
          <div className="absolute bottom-[86px] sm:bottom-[102px] right-8 w-4 h-4 border-b border-r border-gold/30" />

          {/* Central diamond ornament */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute top-[72px] sm:top-[88px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border border-gold/40"
          />

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-center z-10 px-6"
          >
            {/* Small top text */}
            <p className="text-gold/40 text-[8px] sm:text-[9px] tracking-[0.5em] uppercase font-sans font-medium mb-6 sm:mb-8">
              Personal Edition
            </p>

            {/* Year */}
            <h1 className="font-serif text-7xl sm:text-8xl md:text-9xl font-bold leading-[0.85] tracking-tight">
              <span className="gold-text">{currentYear}</span>
            </h1>

            {/* Divider */}
            <div className="flex items-center justify-center gap-3 my-4 sm:my-5">
              <div className="w-8 sm:w-12 h-[0.5px] bg-gold/30" />
              <div className="w-1.5 h-1.5 rotate-45 bg-gold/40" />
              <div className="w-8 sm:w-12 h-[0.5px] bg-gold/30" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-lg sm:text-xl md:text-2xl italic tracking-wide text-gold-light/80 font-normal">
              My Journal
            </h2>
            <p className="text-gold/30 text-[9px] sm:text-[10px] tracking-[0.4em] uppercase font-sans mt-2">
              thoughts & plans
            </p>
          </motion.div>

          {/* Bookmark ribbon */}
          <div
            className="absolute bottom-0 left-[42%] w-3 sm:w-3.5"
            style={{ transform: "translateY(28px)" }}
          >
            <div className="w-full h-20 bg-gradient-to-b from-amber-700/70 to-amber-800/50 rounded-b-sm"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)"
              }}
            />
          </div>

          {/* Open hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-7 sm:bottom-9 text-gold/25 text-[8px] sm:text-[9px] tracking-[0.3em] uppercase font-sans"
          >
            tap to open
          </motion.p>
        </div>
      </motion.button>
    </motion.div>
  );
}
