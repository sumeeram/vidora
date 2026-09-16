import { NavLink, Outlet } from "react-router-dom";
import { motion } from "motion/react";
import {
  House,
  Library,
  ListVideo,
  Moon,
  Settings,
  Star,
  Sun,
} from "lucide-react";
import { BrandMark } from "./BrandMark";
import { ToastHost } from "./ToastHost";
import { useTheme } from "../store/theme";
import { useApp } from "../store/app";
import { useAppBootstrap } from "../hooks/useAppBootstrap";
import { useClipboardWatch } from "../hooks/useClipboardWatch";
import { springs } from "../motion/tokens";
import { api } from "../lib/api";

const links = [
  { to: "/", label: "Home", icon: House },
  { to: "/queue", label: "Queue", icon: ListVideo },
  { to: "/library", label: "Library", icon: Library },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Shell() {
  useAppBootstrap();
  useClipboardWatch();
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const queue = useApp((s) => s.queue);
  const activeCount = queue.filter((j) => j.status === "queued" || j.status === "running").length;

  return (
    <div className="ambient-root h-full">
      <div className="flex h-full">
        <aside className="w-[220px] shrink-0 p-4 flex flex-col">
          <div className="flex items-center gap-3 px-2 py-3">
            <BrandMark size={32} />
            <span className="font-display text-lg tracking-tight">Vidora</span>
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive ? "bg-primary/15 text-primary" : "hover:bg-base-100/40"
                  }`
                }
              >
                <link.icon size={18} />
                <span>{link.label}</span>
                {link.to === "/queue" && activeCount > 0 ? (
                  <span className="badge badge-primary badge-sm ml-auto">{activeCount}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto px-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              className="btn btn-ghost w-full justify-start gap-3 rounded-xl"
              onClick={() => {
                toggle();
                const next = useTheme.getState().theme;
                void api.saveSettings({ ...useApp.getState().settings, theme: next }).then((saved) => {
                  useApp.getState().setSettings(saved);
                });
              }}
            >
              {theme === "vidora-dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "vidora-dark" ? "Light" : "Dark"}
            </motion.button>
          </div>
        </aside>
        <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-7">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
