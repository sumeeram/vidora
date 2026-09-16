import { FolderOpen, Play, Star } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { springs } from "../motion/tokens";
import { useApp } from "../store/app";
import { IconButton } from "./IconButton";

export function MediaRow({
  title,
  channel,
  thumbnail,
  meta,
  url,
  filepath,
  createdAt,
  onUse,
  onFavorite,
  favorited,
}: {
  title: string;
  channel?: string | null;
  thumbnail?: string | null;
  meta?: string | null;
  url: string;
  filepath?: string | null;
  createdAt?: string | null;
  onUse?: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
}) {
  const pushToast = useApp((s) => s.pushToast);

  async function openFile() {
    if (!filepath) return;
    try {
      await api.openPath(filepath);
    } catch (err) {
      pushToast({ title: "Could not open file", body: String(err) });
    }
  }

  async function revealFile() {
    if (!filepath) return;
    try {
      await api.revealPath(filepath);
    } catch (err) {
      pushToast({ title: "Could not reveal in Explorer", body: String(err) });
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
      className="glass rounded-box grid grid-cols-[72px_1fr_auto] items-center gap-3 p-2.5"
    >
      <button
        type="button"
        className="h-14 w-[72px] overflow-hidden rounded-xl bg-base-300"
        onClick={onUse ?? (filepath ? () => void openFile() : undefined)}
        disabled={!onUse && !filepath}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover thumb-treatment"
          />
        ) : (
          <div className="h-full w-full ambient-root" />
        )}
      </button>
      <div className="min-w-0">
        <h3 className="font-display text-sm leading-tight truncate">{title}</h3>
        <p className="text-caption truncate opacity-60">{channel || url}</p>
        <p className="mt-0.5 text-[11px] opacity-45">
          {[meta, createdAt ? formatDate(createdAt) : null].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {onFavorite ? (
          <IconButton label={favorited ? "Remove favorite" : "Add favorite"} onClick={onFavorite}>
            <Star size={14} className={favorited ? "fill-primary text-primary" : ""} />
          </IconButton>
        ) : null}
        {filepath ? (
          <>
            <IconButton label="Open file" onClick={() => void openFile()}>
              <Play size={14} />
            </IconButton>
            <IconButton label="Reveal in Explorer" onClick={() => void revealFile()}>
              <FolderOpen size={14} />
            </IconButton>
          </>
        ) : null}
      </div>
    </motion.article>
  );
}
