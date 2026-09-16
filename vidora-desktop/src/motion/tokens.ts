export const springs = {
  soft: { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.8 },
  snappy: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.7 },
};

export const fades = {
  exit: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
};

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: springs.soft },
  exit: { opacity: 0, y: -8, transition: fades.exit },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: springs.soft },
};
