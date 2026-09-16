import { FolderOpen, Play, Star } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { springs } from "../motion/tokens";
import { useApp } from "../store/app";
import { IconButton } from "./IconButton";

export function MediaCard({
  title,
  channel,
  thumbnail,
  meta,
  url,
  filepath,
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
  onUse?: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
}) {
  const pushToast = useApp((s) => s.pushToast);

  async function run(label: string, action: () => Promise<void>) {
    try {
      await action();
    } catch (err) {
      pushToast({ title: label, body: String(err) });
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
      className="overflow-hidden rounded-box"
    >
      <button type="button" className="block w-full text-left" onClick={onUse} disabled={!onUse}>
        <div className="aspect-video overflow-hidden bg-base-300">
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
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 pt-3">
        <div className="min-w-0">
          <h3 className="font-display text-sm leading-tight line-clamp-2">{title}</h3>
          <p className="text-caption truncate opacity-60">{channel || url}</p>
          {meta ? <p className="mt-1 text-[11px] opacity-45">{meta}</p> : null}
        </div>
        <div className="flex shrink-0">
          {onFavorite ? (
            <IconButton
              label={favorited ? "Remove favorite" : "Add favorite"}
              onClick={onFavorite}
            >
              <Star size={14} className={favorited ? "fill-primary text-primary" : ""} />
            </IconButton>
          ) : null}
          {filepath ? (
            <>
              <IconButton
                label="Open file"
                onClick={() => void run("Could not open file", () => api.openPath(filepath))}
              >
                <Play size={14} />
              </IconButton>
              <IconButton
                label="Reveal in Explorer"
                onClick={() => void run("Could not reveal in Explorer", () => api.revealPath(filepath))}
              >
                <FolderOpen size={14} />
              </IconButton>
            </>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
