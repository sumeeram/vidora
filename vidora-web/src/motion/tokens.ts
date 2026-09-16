export const springs = {
  soft: { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.8 },
  snappy: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.7 },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: springs.soft },
};
