import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { FolderOpen, ListVideo, Pause, Play, RotateCcw, X } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { QueueRow } from "../components/QueueRow";
import { api } from "../lib/api";
import { useApp } from "../store/app";
import type { JobStatus } from "../types";

export default function Queue() {
  const queue = useApp((s) => s.queue);
  const settings = useApp((s) => s.settings);
  const pushToast = useApp((s) => s.pushToast);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const active = queue.filter((job) => job.status === "running").length;

  useEffect(() => {
    setSelected((ids) => ids.filter((id) => queue.some((job) => job.id === id)));
  }, [queue]);

  const selectedJobs = useMemo(
    () => queue.filter((job) => selected.includes(job.id)),
    [queue, selected],
  );
  const allSelected = queue.length > 0 && selected.length === queue.length;
  const canPause = selectedJobs.some((job) => job.status === "running");
  const canResume = selectedJobs.some((job) => job.status === "paused");
  const canCancel = selectedJobs.some((job) =>
    ["queued", "running", "paused"].includes(job.status),
  );
  const canRetry = selectedJobs.some((job) => job.status === "failed" || job.status === "cancelled");

  function toggle(id: string) {
    setSelected((curr) => (curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]));
  }

  async function runBulk(
    label: string,
    statuses: JobStatus[],
    action: (id: string) => Promise<void>,
  ) {
    const ids = selectedJobs.filter((job) => statuses.includes(job.status)).map((job) => job.id);
    if (!ids.length) return;
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => action(id)));
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) {
      pushToast({
        title: `${label} finished with errors`,
        body: `${failed.length} of ${ids.length} could not be updated.`,
      });
    } else {
      pushToast({ title: `${label} · ${ids.length}` });
    }
    setBusy(false);
  }

  async function openFolder() {
    try {
      await api.openDownloadFolder(settings.outputDir);
    } catch (err) {
      pushToast({ title: "Could not open folder", body: String(err) });
    }
  }

  return (
    <section className="max-w-4xl">
      <PageHeader title="Queue" description="Downloads run locally, in the order you set.">
        <button className="btn btn-ghost btn-sm gap-2" onClick={() => void openFolder()}>
          <FolderOpen size={14} />
          Open folder
        </button>
        <span className="badge badge-primary badge-outline">
          {active}/{settings.concurrency} running
        </span>
      </PageHeader>

      {queue.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <label className="label cursor-pointer justify-start gap-2 py-0">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={allSelected}
              onChange={(e) => setSelected(e.target.checked ? queue.map((job) => job.id) : [])}
            />
            <span className="text-sm opacity-70">
              {selected.length ? `${selected.length} selected` : "Select"}
            </span>
          </label>
          {selected.length > 0 ? (
            <>
              <button
                className="btn btn-ghost btn-sm gap-1"
                disabled={busy || !canPause}
                onClick={() => void runBulk("Paused", ["running"], (id) => api.pauseJob(id))}
              >
                <Pause size={14} />
                Pause
              </button>
              <button
                className="btn btn-ghost btn-sm gap-1"
                disabled={busy || !canResume}
                onClick={() => void runBulk("Resumed", ["paused"], (id) => api.resumeJob(id))}
              >
                <Play size={14} />
                Resume
              </button>
              <button
                className="btn btn-ghost btn-sm gap-1"
                disabled={busy || !canRetry}
                onClick={() =>
                  void runBulk("Retried", ["failed", "cancelled"], (id) => api.retryJob(id))
                }
              >
                <RotateCcw size={14} />
                Retry
              </button>
              <button
                className="btn btn-ghost btn-sm gap-1 text-error"
                disabled={busy || !canCancel}
                onClick={() =>
                  void runBulk("Cancelled", ["queued", "running", "paused"], (id) =>
                    api.cancelJob(id),
                  )
                }
              >
                <X size={14} />
                Cancel
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {queue.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon={ListVideo}
                title="Queue is empty"
                body="Preview a YouTube link on Home, pick a format, then add it here."
                action={
                  <Link to="/" className="btn btn-primary rounded-2xl">
                    Go to Home
                  </Link>
                }
              />
            </motion.div>
          ) : (
            queue.map((job, index) => (
              <QueueRow
                key={job.id}
                job={job}
                index={index}
                total={queue.length}
                selected={selected.includes(job.id)}
                onToggleSelect={toggle}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
