import { motion } from "motion/react";
import { item, stagger } from "../motion/tokens";

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
      viewport={{ once: true, amount: 0.3 }}
      className="mx-auto max-w-5xl px-6 py-24"
    >
      <motion.h2 variants={item} className="font-display text-4xl tracking-tight">
        Three steps.
      </motion.h2>
      <motion.p variants={item} className="mt-3 opacity-65">
        Paste, pick a format, download.
      </motion.p>
      <div className="mt-14 grid gap-10 md:grid-cols-3">
        {steps.map((step) => (
          <motion.article key={step.n} variants={item}>
            <p className="font-display text-sm tracking-[0.2em] text-primary">{step.n}</p>
            <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-65">{step.body}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
