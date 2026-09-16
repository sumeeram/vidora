import { motion } from "motion/react";
import clsx from "clsx";
import { FORMAT_PRESETS, type FormatSpec } from "../types";
import { springs } from "../motion/tokens";

export function FormatPicker({
  value,
  onChange,
}: {
  value: FormatSpec;
  onChange: (format: FormatSpec) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Format presets">
      {FORMAT_PRESETS.map((preset) => {
        const active = value.id === preset.id;
        return (
          <motion.button
            key={preset.id}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            onClick={() => onChange(preset)}
            className={clsx(
              "btn btn-sm rounded-xl border-0 font-display tracking-wide",
              active ? "btn-primary" : "btn-ghost bg-base-100/40",
            )}
          >
            {preset.label}
            <span className="opacity-60 font-sans font-medium text-[11px] uppercase">
              {preset.kind === "audio" ? "audio" : "mp4"}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
