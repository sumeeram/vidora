import { motion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { DownloadCta } from "./DownloadCta";
import { inView, item, stagger } from "../motion/tokens";
import { hasInstaller } from "../lib/download";

function BottomCta() {
  return (
    <motion.section
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={inView}
      className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-24"
    >
      <motion.div
        variants={item}
        className="glass relative overflow-hidden rounded-[1.75rem] px-6 py-12 text-center sm:px-10 sm:py-14"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/12 to-transparent"
        />
        <h2 className="relative font-display text-3xl tracking-tight sm:text-4xl">
          Get Vidora
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-base-content/70">
          Free for Windows. Files stay on your computer.
        </p>
        <div className="relative mt-8 flex justify-center">
          <DownloadCta glow />
        </div>
        <p className="relative mt-4 text-caption text-base-content/50">
          {hasInstaller()
            ? "Windows SmartScreen may appear until the app is signed."
            : "Set VITE_DOWNLOAD_URL to your GitHub Release installer after you publish."}
        </p>
      </motion.div>
    </motion.section>
  );
}

export function Footer() {
  return (
    <>
      <BottomCta />
      <footer className="border-t border-base-content/8 px-5 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark size={22} animate={false} />
            <span className="font-display tracking-tight">Vidora</span>
          </a>
          <p className="max-w-xl text-caption leading-relaxed text-base-content/55">
            Use Vidora only for media you have the right to download. You are
            responsible for following YouTube’s terms and copyright law.
          </p>
        </div>
      </footer>
    </>
  );
}
