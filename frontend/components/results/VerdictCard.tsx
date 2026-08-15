"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useReducedMotion, animate, useMotionValue, useTransform } from "framer-motion";
import { LanguageVerdict, FactCheckResult, SourceCredibility, isVerdictOk, isSignalError, isFactCheckOk, isCredibilityOk } from "@/lib/types";

interface VerdictCardProps {
  verdict:      LanguageVerdict;
  factCheck?:   FactCheckResult;
  credibility?: SourceCredibility;
}

/** Counts a motion value from 0 to target and rounds it for display. */
function AnimatedNumber({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const rounded   = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    rounded.on("change", (v) => setDisplay(v));
    const controls = animate(motionVal, target, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [target, motionVal, rounded]);

  return <>{display}</>;
}

/** One bullet in the "Why we say this" section. */
function ReasonBullet({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  return (
    <motion.li
      className="flex items-start gap-2 text-xs text-muted leading-relaxed"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </motion.li>
  );
}

export default function VerdictCard({ verdict, factCheck, credibility }: VerdictCardProps) {
  const shouldReduce = useReducedMotion();
  const barControls  = useAnimation();
  const barStarted   = useRef(false);

  const isOk    = isVerdictOk(verdict);
  const isError = isSignalError(verdict);

  const label      = isOk ? verdict.label : null;
  const confidence = isOk ? verdict.confidence : null;
  const isFake     = label === "Fake";
  const accent     = isFake ? "#A13D3D" : "#2F6B4F";

  useEffect(() => {
    if (confidence !== null && !barStarted.current) {
      barStarted.current = true;
      barControls.start({
        width: `${confidence}%`,
        transition: { duration: 0.9, ease: "easeOut" },
      });
    }
  }, [confidence, barControls]);

  const stampVariants = shouldReduce
    ? {
        hidden:  { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden:  { opacity: 0, scale: 0.6, rotate: -8, y: 10 },
        visible: {
          opacity: 1, scale: 1, rotate: 0, y: 0,
          transition: { type: "spring" as const, stiffness: 300, damping: 18, delay: 0.1 },
        },
      };

  // ── Build plain-language "Why we say this" bullets ─────────────────────────
  const reasons: { icon: string; text: string }[] = [];

  if (isOk && confidence !== null) {
    const conf = confidence;
    if (conf >= 85) {
      reasons.push({
        icon: "🧠",
        text: `Our language model is ${conf}% confident this text ${
          isFake
            ? "uses patterns common in fake or misleading content — sensational phrasing, unverified claims, or emotional manipulation."
            : "reads like genuine, factual reporting — measured tone, specific details, and no sensational language."
        }`,
      });
    } else {
      reasons.push({
        icon: "🧠",
        text: `Our language model gives a ${conf}% ${isFake ? "fake" : "real"} signal — the writing style ${
          isFake ? "raises some flags" : "looks mostly consistent with factual reporting"
        }, though confidence is moderate. Treat with caution.`,
      });
    }
  }

  if (factCheck && isFactCheckOk(factCheck)) {
    if (factCheck.found) {
      reasons.push({
        icon: "🔍",
        text: `A professional fact-checker (${factCheck.publisher}) reviewed a matching claim and rated it "${factCheck.rating}".`,
      });
    } else {
      reasons.push({
        icon: "🔍",
        text: "No professional fact-check was found for this content — it hasn't been formally debunked or confirmed by a fact-checking organisation.",
      });
    }
  }

  if (credibility && isCredibilityOk(credibility)) {
    const tier = credibility.tier;
    const src  = (credibility as any).channel || credibility.domain || "the source";
    if (tier === "high") {
      reasons.push({ icon: "🏛️", text: `${src} is a recognised high-credibility outlet with strong editorial and fact-checking standards.` });
    } else if (tier === "medium") {
      reasons.push({ icon: "🏛️", text: `${src} is a known publication with moderate credibility — apply normal critical reading as with any media outlet.` });
    } else if (tier === "low") {
      reasons.push({ icon: "⚠️", text: `${src} has a documented history of publishing inaccurate or misleading content — verify this claim through other sources.` });
    } else if (tier === "youtube_unverified") {
      reasons.push({ icon: "📺", text: "This is from an unverified YouTube channel — we couldn't confirm its editorial standards. Check the channel's background before sharing." });
    }
  }

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5 overflow-hidden">
      {/* Subtle color wash behind the card */}
      {isOk && (
        <div
          className="absolute inset-0 opacity-[0.03] rounded-2xl pointer-events-none"
          style={{ background: isFake ? "#A13D3D" : "#2F6B4F" }}
        />
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Language verdict
      </p>

      {isError ? (
        <p className="text-muted text-sm">Language analysis unavailable right now.</p>
      ) : isOk ? (
        <div className="flex flex-col gap-5">
          {/* Verdict stamp */}
          <motion.div variants={stampVariants} initial="hidden" animate="visible" className="self-start">
            <div
              className="relative inline-block px-6 py-3 rounded-xl border-2 font-fraunces font-semibold uppercase text-2xl tracking-widest select-none"
              style={{ borderColor: accent, color: accent }}
              aria-label={`Verdict: ${label}`}
            >
              {/* Inner glow pulse */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: accent }}
                animate={{ opacity: [0.06, 0.12, 0.06] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10">{label}</span>
            </div>
          </motion.div>

          {/* Confidence with animated counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Confidence</span>
              <span className="font-mono text-sm font-medium" style={{ color: accent }}>
                <AnimatedNumber target={confidence!} />%
              </span>
            </div>
            {/* Track */}
            <div className="h-1.5 w-full rounded-full bg-hairline overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={barControls}
                className="h-full rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>
          </div>

          {/* Why we say this */}
          {reasons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="border-t border-hairline pt-4"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-3">
                Why we say this
              </p>
              <ul className="flex flex-col gap-2.5">
                {reasons.map((r, i) => (
                  <ReasonBullet key={i} icon={r.icon} text={r.text} delay={0.5 + i * 0.08} />
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  );
}
