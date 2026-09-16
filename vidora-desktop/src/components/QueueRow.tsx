import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import type { Job } from "../types";
import { springs } from "../motion/tokens";
import { api } from "../lib/api";

export function QueueRow({
  job,
  index,
  total,
}: {
  job: Job;
  index: number;
  total: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={springs.soft}
      className="glass rounded-box p-3 grid grid-cols-[88px_1fr_auto] gap-4 items-center"
    >
      <div className="h-16 w-[88px] overflow-hidden rounded-xl bg-base-300">
        {job.thumbnail ? (
          <img
            src={job.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover thumb-treatment"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm truncate">{job.title}</h3>
          <span className="badge badge-ghost badge-sm">{job.format.label}</span>
        </div>
        <p className="text-caption opacity-60 truncate">
          {job.channel || job.url}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-300">
          <motion.div
            className="progress-fill h-full rounded-full bg-primary"
            animate={{ scaleX: Math.max(job.progress, 1) / 100 }}
            transition={springs.soft}
            style={{ scaleX: 0 }}
          />
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-wider opacity-50">
          {job.status}
          {job.speed ? ` · ${job.speed}` : ""}
          {job.eta ? ` · ETA ${job.eta}` : ""}
          {job.status === "running" || job.status === "paused"
            ? ` · ${Math.round(job.progress)}%`
            : ""}
          {job.error ? ` · ${job.error}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {job.status === "queued" ? (
          <>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              disabled={index === 0}
              onClick={() => void api.reorderQueue(index, Math.max(0, index - 1))}
            >
              <ChevronUp size={16} />
            </button>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              disabled={index >= total - 1}
              onClick={() => void api.reorderQueue(index, Math.min(total - 1, index + 1))}
            >
              <ChevronDown size={16} />
            </button>
          </>
        ) : null}
        {job.status === "running" ? (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void api.pauseJob(job.id)}>
            <Pause size={16} />
          </button>
        ) : null}
        {job.status === "paused" || job.status === "failed" ? (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void api.resumeJob(job.id)}>
            <Play size={16} />
          </button>
        ) : null}
        {job.status === "failed" || job.status === "cancelled" ? (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void api.retryJob(job.id)}>
            <RotateCcw size={16} />
          </button>
        ) : null}
        {job.outputPath ? (
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => void api.revealPath(job.outputPath!)}
          >
            <FolderOpen size={16} />
          </button>
        ) : null}
        {job.status === "queued" || job.status === "running" || job.status === "paused" ? (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void api.cancelJob(job.id)}>
            <X size={16} />
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
