import { motion } from "motion/react";
import { Download } from "lucide-react";
import clsx from "clsx";
import { getDownloadUrl, hasInstaller } from "../lib/download";
import { springs } from "../motion/tokens";

export function DownloadCta({
  size = "lg",
  label,
  glow = false,
}: {
  size?: "sm" | "lg";
  label?: string;
  glow?: boolean;
}) {
  const ready = hasInstaller();
  const href = getDownloadUrl();
  const text = label ?? (ready ? "Download for Windows" : "Installer coming soon");
  const classes = clsx(
    size === "lg"
      ? "btn btn-primary btn-lg rounded-2xl px-8 gap-2 shadow-none"
      : "btn btn-primary btn-sm rounded-xl gap-2 shadow-none",
  );

  const control = ready ? (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      className={classes}
    >
      <Download size={size === "lg" ? 18 : 14} />
      {text}
    </motion.a>
  ) : (
    <button type="button" className={classes} disabled>
      <Download size={size === "lg" ? 18 : 14} />
      {text}
    </button>
  );

  if (!glow) return control;
  return <span className="cta-glow">{control}</span>;
}
