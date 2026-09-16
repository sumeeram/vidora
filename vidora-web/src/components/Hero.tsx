import { motion } from "motion/react";
import { DownloadCta } from "./DownloadCta";
import { item, springs, stagger } from "../motion/tokens";
import { hasInstaller } from "../lib/download";

function HeroPreview() {
  return (
    <motion.div
      variants={item}
      className="glass relative overflow-hidden rounded-[1.6rem] p-4 sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-base-content/20" />
          <span className="size-2.5 rounded-full bg-base-content/20" />
          <span className="size-2.5 rounded-full bg-base-content/20" />
        </div>
        <p className="font-display text-xs tracking-wide text-base-content/55">
          Vidora
        </p>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/90">
        Paste a YouTube link
      </p>
      <div className="mt-3 rounded-2xl border border-base-content/8 bg-base-100/40 px-3.5 py-3 text-sm text-base-content/55">
        youtube.com/watch?v=…
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="preview-chip" data-active="true">
          MP3
        </span>
        <span className="preview-chip">M4A</span>
        <span className="preview-chip">1080p</span>
        <span className="preview-chip">4K</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-caption text-base-content/50">Queue ready</span>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content">
          Download
        </span>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <motion.section
      id="top"
      variants={stagger}
      initial="initial"
      animate="animate"
      className="mx-auto grid min-h-[auto] max-w-6xl items-center gap-10 px-5 pb-16 pt-8 sm:px-6 lg:min-h-[calc(100svh-5.75rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:gap-16 lg:pb-20 lg:pt-4"
    >
      <div>
        <motion.p
          variants={item}
          className="text-xs font-semibold uppercase tracking-[0.22em] text-primary"
        >
          Windows · free · local-first
        </motion.p>
        <motion.h1
          variants={item}
          className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Vidora
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-5 max-w-xl text-lg leading-snug text-base-content/75 sm:text-2xl"
        >
          Save any YouTube video, any format.
        </motion.p>
        <motion.div
          variants={item}
          className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <DownloadCta glow />
          <motion.a
            href="#features"
            whileTap={{ scale: 0.97 }}
            transition={springs.snappy}
            className="btn btn-ghost btn-lg rounded-2xl"
          >
            See features
          </motion.a>
        </motion.div>
        <motion.p
          variants={item}
          className="mt-5 max-w-md text-caption leading-relaxed text-base-content/50"
        >
          {hasInstaller()
            ? "Windows may warn about unsigned apps the first time. Choose More info, then Run anyway."
            : "The installer link appears here after the first GitHub Release is published."}
        </motion.p>
      </div>
      <div className="lg:pt-6">
        <HeroPreview />
      </div>
    </motion.section>
  );
}
