import { motion } from "motion/react";
import { springs } from "../motion/tokens";

export function BrandMark({
  size = 36,
  animate = true,
}: {
  size?: number;
  animate?: boolean;
}) {
  const inner = (
    <>
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="18"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M26 20.5L44 32L26 43.5V20.5Z"
        fill="currentColor"
        className="text-primary-content"
      />
    </>
  );

  if (!animate) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        {inner}
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      initial={{ rotate: -8, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={springs.soft}
      aria-hidden
    >
      {inner}
    </motion.svg>
  );
}
