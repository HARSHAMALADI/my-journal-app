"use client";

import { motion } from "framer-motion";
import { signInWithGoogle } from "@/lib/firebase";
import { useState } from "react";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center min-h-[100dvh] p-4"
    >
      <div className="flex flex-col items-center gap-8 sm:gap-10">
        {/* Mini book decoration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative w-[200px] h-[280px] sm:w-[240px] sm:h-[340px] rounded-r-xl rounded-l-[3px] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #2d3436 0%, #1a1a2e 50%, #16213e 100%)",
            boxShadow: "8px 8px 30px rgba(0,0,0,0.5), -2px 0 6px rgba(0,0,0,0.3), inset 0 0 60px rgba(0,0,0,0.2)",
          }}
        >
          {/* Spine */}
          <div
            className="absolute left-0 top-0 bottom-0 w-3"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.03), rgba(0,0,0,0.15))" }}
          />

          {/* Top line */}
          <div className="absolute top-10 left-6 right-6 h-[0.5px] bg-gold/20" />

          {/* Bottom line */}
          <div className="absolute bottom-14 left-6 right-6 h-[0.5px] bg-gold/20" />

          {/* Content */}
          <div className="text-center z-10 px-4">
            <p className="text-gold/40 text-[7px] sm:text-[8px] tracking-[0.5em] uppercase font-sans font-medium mb-4">
              Personal Edition
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-[0.85] tracking-tight">
              <span className="gold-text">{currentYear}</span>
            </h1>
            <div className="flex items-center justify-center gap-2 my-3">
              <div className="w-6 sm:w-8 h-[0.5px] bg-gold/30" />
              <div className="w-1 h-1 rotate-45 bg-gold/40" />
              <div className="w-6 sm:w-8 h-[0.5px] bg-gold/30" />
            </div>
            <h2 className="font-serif text-base sm:text-lg italic tracking-wide text-gold-light/80 font-normal">
              My Journal
            </h2>
            <p className="text-gold/30 text-[7px] sm:text-[8px] tracking-[0.4em] uppercase font-sans mt-1.5">
              thoughts & plans
            </p>
          </div>

          {/* Bookmark */}
          <div className="absolute bottom-0 left-[42%] w-2.5" style={{ transform: "translateY(20px)" }}>
            <div
              className="w-full h-14 bg-gradient-to-b from-amber-700/70 to-amber-800/50 rounded-b-sm"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)" }}
            />
          </div>
        </motion.div>

        {/* Login section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-gold/50 text-xs sm:text-sm tracking-widest uppercase font-sans">
            Sign in to your journal
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-3.5 rounded-lg
              bg-white/[0.07] hover:bg-white/[0.12] border border-gold/20 hover:border-gold/40
              transition-all duration-300 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gold-light/80 text-sm sm:text-base font-sans font-medium group-hover:text-gold-light transition-colors">
              {loading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <p className="text-gold/25 text-[10px] sm:text-xs font-sans mt-1">
            Your data is securely saved to your account
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
