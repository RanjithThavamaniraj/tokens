"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";

type HeroSectionProps = {
  backgroundImage?: string;
};

type Coin = {
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  label: string;
  alwaysVisible: boolean;
};

const COINS: Coin[] = [
  { left: "5%", size: 32, duration: 14, delay: 0, opacity: 0.14, label: "GPT", alwaysVisible: true },
  { left: "18%", size: 28, duration: 9, delay: 1.2, opacity: 0.1, label: "C", alwaysVisible: false },
  { left: "31%", size: 40, duration: 15, delay: 2.4, opacity: 0.16, label: "G", alwaysVisible: true },
  { left: "44%", size: 30, duration: 8, delay: 3.6, opacity: 0.09, label: "GPT", alwaysVisible: false },
  { left: "57%", size: 44, duration: 11, delay: 0.8, opacity: 0.18, label: "C", alwaysVisible: false },
  { left: "68%", size: 34, duration: 16, delay: 4.5, opacity: 0.12, label: "G", alwaysVisible: true },
  { left: "80%", size: 28, duration: 10, delay: 5.6, opacity: 0.08, label: "GPT", alwaysVisible: false },
  { left: "92%", size: 36, duration: 13, delay: 6.8, opacity: 0.15, label: "C", alwaysVisible: false },
];

export default function HeroSection({
  backgroundImage = "/hero-bg.png",
}: HeroSectionProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-20">
        <Navbar />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={backgroundImage}
        alt=""
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.0) 70%)",
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {COINS.map((coin, i) => (
          <motion.div
            key={i}
            className={
              coin.alwaysVisible ? "absolute flex" : "absolute hidden md:flex"
            }
            style={{
              left: coin.left,
              top: -60,
              width: coin.size,
              height: coin.size,
              borderRadius: "50%",
              border: "1px solid rgba(245,166,35,0.8)",
              color: "#f5a623",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              opacity: coin.opacity,
            }}
            animate={{ y: ["0vh", "115vh"] }}
            transition={{
              duration: coin.duration,
              repeat: Infinity,
              ease: "linear",
              delay: coin.delay,
            }}
          >
            {coin.label}
          </motion.div>
        ))}
      </div>

      <div
        className="absolute z-10 flex flex-col items-center text-center w-full bottom-[calc(14%-50px)] md:bottom-[calc(18%-50px)]"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: 680,
          padding: "0 24px",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.6 }}
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "#f5a623",
            opacity: 0.75,
            marginBottom: 14,
          }}
        >
          for developers who can&apos;t stop prompting
        </motion.p>

        <motion.h1
          className="text-[36px] md:text-[56px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "white",
            textShadow: "0 2px 40px rgba(0,0,0,0.6)",
            marginBottom: 32,
          }}
        >
          One token can&apos;t hurt.
        </motion.h1>

        <motion.button
          type="button"
          className="w-full md:w-auto p-[14px] md:px-[28px] md:py-[12px]"
          onClick={() =>
            document
              .getElementById("providers")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          whileHover={{
            scale: 1.03,
            backgroundColor: "#ffb84d",
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: "#f5a623",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 100,
            letterSpacing: "0.02em",
            border: "none",
            cursor: "pointer",
          }}
        >
          Start Monitoring
        </motion.button>
      </div>

      <motion.div
        className="absolute -translate-x-1/2"
        style={{
          bottom: 24,
          left: "50%",
          opacity: 0.25,
        }}
        animate={{ y: [0, 6] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </section>
  );
}
