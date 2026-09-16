import { FolderOpen, Play, Star } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { springs } from "../motion/tokens";

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
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
      className="overflow-hidden rounded-box"
    >
      <button type="button" className="block w-full text-left" onClick={onUse}>
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
      <div className="pt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm leading-tight line-clamp-2">{title}</h3>
          <p className="text-caption opacity-60 truncate">{channel || url}</p>
          {meta ? <p className="text-[11px] opacity-45 mt-1">{meta}</p> : null}
        </div>
        <div className="flex shrink-0">
          {onFavorite ? (
            <button className="btn btn-ghost btn-xs btn-circle" onClick={onFavorite}>
              <Star size={14} className={favorited ? "fill-primary text-primary" : ""} />
            </button>
          ) : null}
          {filepath ? (
            <>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => void api.openPath(filepath)}>
                <Play size={14} />
              </button>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => void api.revealPath(filepath)}>
                <FolderOpen size={14} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
