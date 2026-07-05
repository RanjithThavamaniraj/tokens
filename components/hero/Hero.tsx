"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRightCircle } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <div
      className="relative mx-auto mt-auto w-full max-w-[1280px] px-5 sm:px-8"
      style={{ paddingBottom: "clamp(40px, 8vw, 72px)" }}
    >
      <div
        className="mx-auto flex flex-col items-center text-center"
        style={{ maxWidth: 560 }}
      >
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 16,
          }}
        >
          The AI Command Center
        </motion.p>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.65rem, 5vw, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "var(--color-text)",
            marginBottom: 24,
          }}
        >
          One token can&apos;t hurt.
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            lineHeight: 1.65,
            color: "var(--color-muted)",
            maxWidth: 560,
            marginBottom: 32,
          }}
        >
          ...said every AI developer ever.
        </motion.p>

        <motion.button
          type="button"
          onClick={() =>
            document
              .getElementById("providers")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -2, filter: "brightness(1.08)" }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center justify-between font-semibold"
          style={{
            background: "#EE7B30",
            color: "#06070B",
            borderRadius: 50,
            padding: "17px 24px",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            boxShadow: "0 4px 24px rgba(238,123,48,0.28)",
            minWidth: 210,
            gap: 32,
          }}
        >
          Connect Provider
          <ArrowRightCircle size={20} />
        </motion.button>
      </div>
    </div>
  );
}
