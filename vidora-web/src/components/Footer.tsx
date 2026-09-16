import { motion } from "motion/react";
import { DownloadCta } from "./DownloadCta";
import { item, stagger } from "../motion/tokens";
import { hasInstaller } from "../lib/download";

function BottomCta() {
  return (
    <motion.section
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.4 }}
      className="mx-auto max-w-3xl px-6 py-24 text-center"
    >
      <motion.h2
        variants={item}
        className="font-display text-4xl tracking-tight"
      >
        Get Vidora
      </motion.h2>
      <motion.p variants={item} className="mx-auto mt-3 max-w-md opacity-65">
        Free for Windows. Files stay on your computer.
      </motion.p>
      <motion.div variants={item} className="mt-8 flex justify-center">
        <DownloadCta />
      </motion.div>
      <motion.p variants={item} className="mt-4 text-caption opacity-45">
        {hasInstaller()
          ? "Windows SmartScreen may appear until the app is signed."
          : "Set VITE_DOWNLOAD_URL to your GitHub Release installer after you publish."}
      </motion.p>
    </motion.section>
  );
}

export function Footer() {
  return (
    <>
      <BottomCta />
      <footer className="border-t border-base-content/8 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm opacity-50 md:flex-row md:items-center md:justify-between">
          <span className="font-display tracking-tight">Vidora</span>
          <p className="max-w-xl text-caption leading-relaxed">
            Use Vidora only for media you have the right to download. You are
            responsible for following YouTube’s terms and copyright law.
          </p>
        </div>
      </footer>
    </>
  );
}
