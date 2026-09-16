import { AnimatePresence, motion } from "motion/react";
import { QueueRow } from "../components/QueueRow";
import { useApp } from "../store/app";
import { pageTransition } from "../motion/tokens";

export default function Queue() {
  const queue = useApp((s) => s.queue);
  const settings = useApp((s) => s.settings);
  const active = queue.filter((j) => j.status === "running").length;

  return (
    <motion.section {...pageTransition} className="max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Queue</h1>
          <p className="mt-2 opacity-60">Downloads run locally, in the order you set.</p>
        </div>
        <span className="badge badge-primary badge-outline">
          {active}/{settings.concurrency} running
        </span>
      </div>
      <div className="mt-8 space-y-3">
        <AnimatePresence initial={false}>
          {queue.length === 0 ? (
            <p className="opacity-50">Nothing in the queue yet.</p>
          ) : (
            queue.map((job, index) => (
              <QueueRow key={job.id} job={job} index={index} total={queue.length} />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
