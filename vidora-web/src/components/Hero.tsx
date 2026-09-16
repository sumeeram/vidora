import { motion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { DownloadCta } from "./DownloadCta";
import { item, springs, stagger } from "../motion/tokens";
import { hasInstaller } from "../lib/download";

export function Hero() {
  return (
    <motion.section
      id="top"
      variants={stagger}
      initial="initial"
      animate="animate"
      className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-4xl flex-col justify-center px-6 pb-20 pt-8"
    >
      <motion.div variants={item} className="flex items-center gap-4">
        <BrandMark size={56} />
        <h1 className="font-display text-6xl leading-none tracking-tight md:text-8xl">Vidora</h1>
      </motion.div>
      <motion.p variants={item} className="mt-6 max-w-xl text-xl opacity-75 md:text-2xl">
        Save any YouTube video, any format.
      </motion.p>
      <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-3">
        <DownloadCta />
        <motion.a
          href="#features"
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="btn btn-ghost btn-lg rounded-2xl"
        >
          See features
        </motion.a>
      </motion.div>
      <motion.p variants={item} className="mt-5 text-sm opacity-55">
        Windows · free · local-first
      </motion.p>
      <motion.p variants={item} className="mt-2 max-w-md text-caption opacity-45">
        {hasInstaller()
          ? "Windows may warn about unsigned apps the first time. Choose More info, then Run anyway."
          : "The installer link appears here after the first GitHub Release is published."}
      </motion.p>
    </motion.section>
  );
}
