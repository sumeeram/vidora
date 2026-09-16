import clsx from "clsx";
import type { JobStatus } from "../types";

const LABELS: Record<JobStatus, string> = {
  queued: "Queued",
  running: "Downloading",
  paused: "Paused",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STYLES: Record<JobStatus, string> = {
  queued: "badge-ghost",
  running: "badge-primary",
  paused: "badge-warning",
  completed: "badge-success",
  failed: "badge-error",
  cancelled: "badge-neutral",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={clsx("badge badge-sm font-medium capitalize", STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
