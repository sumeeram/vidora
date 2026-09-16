import { Clipboard, Clapperboard, FolderLock, ListVideo, MoonStar, Music } from "lucide-react";
import { motion } from "motion/react";
import { inView, item, springs, stagger, staggerFast } from "../motion/tokens";

const features = [
  {
    icon: Music,
    title: "Any format",
    body: "MP3, M4A, Opus, and MP4 from 360p to 4K — or pick a raw stream.",
  },
  {
    icon: ListVideo,
    title: "Queue that waits",
    body: "Batch playlists, pause, resume, and run a few downloads at once.",
  },
  {
    icon: Clipboard,
    title: "Clipboard detect",
    body: "Copy a YouTube link and Vidora offers it before you paste.",
  },
  {
    icon: Clapperboard,
    title: "Trim and extras",
    body: "Clip a range, embed chapters, thumbnails, and subtitles.",
  },
  {
    icon: MoonStar,
    title: "Light and dark",
    body: "A quiet teal glass UI that stays out of the way.",
  },
  {
    icon: FolderLock,
    title: "Stays on your PC",
    body: "No account. History and files live on your machine.",
  },
];

export function Features() {
  return (
    <motion.section
      id="features"
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={inView}
      className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28"
    >
      <motion.p
        variants={item}
        className="text-xs font-semibold uppercase tracking-[0.22em] text-primary"
      >
        Features
      </motion.p>
      <motion.h2
        variants={item}
        className="mt-3 max-w-3xl font-display text-3xl tracking-tight sm:text-4xl"
      >
        Built for the download, not the dashboard.
      </motion.h2>
      <motion.p
        variants={item}
        className="mt-3 max-w-xl text-base-content/70"
      >
        One place to fetch YouTube media, keep a queue, and find it later.
      </motion.p>
      <motion.div
        variants={staggerFast}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.article
            key={feature.title}
            variants={item}
            whileHover={{ y: -3 }}
            transition={springs.snappy}
            className="feature-card glass"
          >
            <div className="icon-well">
              <feature.icon size={18} strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 font-display text-lg tracking-tight">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-base-content/70">
              {feature.body}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}
