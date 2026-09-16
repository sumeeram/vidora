import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { DownloadCta } from "./DownloadCta";
import { springs } from "../motion/tokens";

type ThemeName = "vidora-dark" | "vidora-light";

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("vidora-web-theme", theme);
}

export function Navbar() {
  const [theme, setTheme] = useState<ThemeName>("vidora-dark");

  useEffect(() => {
    const stored = localStorage.getItem("vidora-web-theme") as ThemeName | null;
    const next = stored ?? "vidora-dark";
    applyTheme(next);
    setTheme(next);
  }, []);

  function toggle() {
    const next = theme === "vidora-dark" ? "vidora-light" : "vidora-dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <header className="sticky top-0 z-40 px-5 py-4">
      <nav className="glass mx-auto flex max-w-5xl items-center justify-between rounded-2xl px-4 py-2.5">
        <a href="#top" className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <span className="font-display text-base tracking-tight">Vidora</span>
        </a>
        <div className="hidden items-center gap-6 text-sm md:flex">
          <a href="#features" className="opacity-70 hover:opacity-100">
            Features
          </a>
          <a href="#how" className="opacity-70 hover:opacity-100">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            className="btn btn-ghost btn-sm btn-circle"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "vidora-dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
          <DownloadCta size="sm" label="Download" />
        </div>
      </nav>
    </header>
  );
}
