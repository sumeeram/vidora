import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import { BrandMark } from "./BrandMark";
import { DownloadCta } from "./DownloadCta";
import { springs } from "../motion/tokens";

type ThemeName = "vidora-dark" | "vidora-light";

const THEME_COLOR: Record<ThemeName, string> = {
  "vidora-dark": "#0e2024",
  "vidora-light": "#e7f4f1",
};

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("vidora-web-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem("vidora-web-theme");
    if (stored === "vidora-light" || stored === "vidora-dark") return stored;
  } catch {
    /* ignore */
  }
  return "vidora-dark";
}

export function Navbar() {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggle() {
    setTheme((current) =>
      current === "vidora-dark" ? "vidora-light" : "vidora-dark",
    );
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className={clsx(
        "site-header sticky top-0 z-40 px-3 py-3 sm:px-5 sm:py-4",
        scrolled && "is-scrolled",
      )}
    >
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5">
        <a href="#top" className="flex items-center gap-2.5" onClick={closeMenu}>
          <BrandMark size={28} animate={false} />
          <span className="font-display text-base tracking-tight">Vidora</span>
        </a>
        <div className="hidden items-center gap-7 text-sm md:flex">
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#how" className="nav-link">
            How it works
          </a>
        </div>
        <div className="relative flex items-center gap-1.5 sm:gap-2" ref={menuRef}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            className="btn btn-ghost btn-sm btn-circle md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={16} />
          </motion.button>
          {menuOpen ? (
            <ul className="glass absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl p-2 text-sm shadow-lg md:hidden">
              <li>
                <a
                  href="#features"
                  className="nav-link block rounded-xl px-3 py-2"
                  onClick={closeMenu}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how"
                  className="nav-link block rounded-xl px-3 py-2"
                  onClick={closeMenu}
                >
                  How it works
                </a>
              </li>
            </ul>
          ) : null}
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            className="btn btn-ghost btn-sm btn-circle"
            onClick={toggle}
            aria-label={
              theme === "vidora-dark" ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {theme === "vidora-dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
          <DownloadCta size="sm" label="Download" />
        </div>
      </nav>
    </header>
  );
}
