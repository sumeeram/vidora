import clsx from "clsx";
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
import { useApp } from "../store/app";
import { IconButton } from "./IconButton";
import { StatusBadge } from "./StatusBadge";

export function QueueRow({
  job,
  index,
  total,
  selected,
  onToggleSelect,
}: {
  job: Job;
  index: number;
  total: number;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const pushToast = useApp((s) => s.pushToast);
  const showProgress =
    job.status === "running" ||
    job.status === "paused" ||
    job.status === "completed" ||
    job.status === "failed";
  const progressTone =
    job.status === "failed"
      ? "bg-error"
      : job.status === "paused"
        ? "bg-warning"
        : job.status === "completed"
          ? "bg-success"
          : "bg-primary";

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={springs.soft}
      className={clsx(
        "glass rounded-box grid grid-cols-[auto_72px_1fr_auto] items-center gap-3 p-2.5",
        selected && "ring-1 ring-primary/40",
      )}
    >
      <label className="flex cursor-pointer items-center pl-1">
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
          checked={selected}
          onChange={() => onToggleSelect(job.id)}
          aria-label={`Select ${job.title}`}
        />
      </label>
      <div className="h-14 w-[72px] overflow-hidden rounded-xl bg-base-300">
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
          <h3 className="font-display truncate text-sm">{job.title}</h3>
          <span className="badge badge-ghost badge-sm shrink-0">{job.format.label}</span>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-caption truncate opacity-60">{job.channel || job.url}</p>
        {showProgress ? (
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-300">
            <motion.div
              className={clsx("progress-fill h-full rounded-full", progressTone)}
              animate={{ scaleX: Math.max(job.progress, 1) / 100 }}
              transition={springs.soft}
              style={{ scaleX: 0 }}
            />
          </div>
        ) : null}
        <p className="mt-1 truncate text-[11px] uppercase tracking-wider opacity-50">
          {job.status === "running" || job.status === "paused" ? `${Math.round(job.progress)}%` : ""}
          {job.speed ? ` · ${job.speed}` : ""}
          {job.eta ? ` · ETA ${job.eta}` : ""}
          {job.error ? ` · ${job.error}` : ""}
        </p>
      </div>
      <div className="flex items-center">
        {job.status === "queued" ? (
          <>
            <IconButton
              label="Move up"
              disabled={index === 0}
              onClick={() => void run("Could not reorder", () => api.reorderQueue(index, Math.max(0, index - 1)))}
            >
              <ChevronUp size={16} />
            </IconButton>
            <IconButton
              label="Move down"
              disabled={index >= total - 1}
              onClick={() =>
                void run("Could not reorder", () =>
                  api.reorderQueue(index, Math.min(total - 1, index + 1)),
                )
              }
            >
              <ChevronDown size={16} />
            </IconButton>
          </>
        ) : null}
        {job.status === "running" ? (
          <IconButton label="Pause" onClick={() => void run("Could not pause", () => api.pauseJob(job.id))}>
            <Pause size={16} />
          </IconButton>
        ) : null}
        {job.status === "paused" ? (
          <IconButton label="Resume" onClick={() => void run("Could not resume", () => api.resumeJob(job.id))}>
            <Play size={16} />
          </IconButton>
        ) : null}
        {job.status === "failed" || job.status === "cancelled" ? (
          <IconButton label="Retry" onClick={() => void run("Could not retry", () => api.retryJob(job.id))}>
            <RotateCcw size={16} />
          </IconButton>
        ) : null}
        {job.status === "completed" && job.outputPath ? (
          <>
            <IconButton
              label="Open file"
              onClick={() => void run("Could not open file", () => api.openPath(job.outputPath!))}
            >
              <Play size={16} />
            </IconButton>
            <IconButton
              label="Reveal in Explorer"
              onClick={() => void run("Could not reveal in Explorer", () => api.revealPath(job.outputPath!))}
            >
              <FolderOpen size={16} />
            </IconButton>
          </>
        ) : null}
        {job.status === "queued" || job.status === "running" || job.status === "paused" ? (
          <IconButton label="Cancel" onClick={() => void run("Could not cancel", () => api.cancelJob(job.id))}>
            <X size={16} />
          </IconButton>
        ) : null}
      </div>
    </motion.article>
  );
}
