import type { ReactNode } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { item } from "../motion/tokens";

export function GlassPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={item} className={clsx("glass rounded-box", className)}>
      {children}
    </motion.div>
  );
}
