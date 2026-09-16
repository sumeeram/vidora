import { motion } from "motion/react";
import { inView, item, springs, stagger } from "../motion/tokens";

const steps = [
  { n: "01", title: "Paste", body: "Drop in a video, playlist, or channel link." },
  { n: "02", title: "Pick format", body: "Audio or a quality. Advanced options stay tucked away." },
  { n: "03", title: "Download", body: "Watch the queue, then open the file on disk." },
];

export function HowItWorks() {
  return (
    <motion.section
      id="how"
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={inView}
      className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28"
    >
      <motion.p
        variants={item}
        className="text-xs font-semibold uppercase tracking-[0.22em] text-primary"
      >
        How it works
      </motion.p>
      <motion.h2
        variants={item}
        className="mt-3 font-display text-3xl tracking-tight sm:text-4xl"
      >
        Three steps.
      </motion.h2>
      <motion.p variants={item} className="mt-3 text-base-content/70">
        Paste, pick a format, download.
      </motion.p>
      <div className="relative mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-[14%] left-[14%] hidden h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent md:block"
        />
        <motion.div
          variants={item}
          className="grid gap-4 md:grid-cols-3 md:gap-5"
        >
          {steps.map((step) => (
            <motion.article
              key={step.n}
              whileHover={{ y: -3 }}
              transition={springs.snappy}
              className="step-card glass relative"
            >
              <p className="font-display text-sm tracking-[0.2em] text-primary">
                {step.n}
              </p>
              <h3 className="mt-4 font-display text-2xl tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                {step.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
