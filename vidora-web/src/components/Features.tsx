import { Clipboard, Clapperboard, FolderLock, ListVideo, MoonStar, Music } from "lucide-react";
import { motion } from "motion/react";
import { item, stagger } from "../motion/tokens";

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
      viewport={{ once: true, amount: 0.25 }}
      className="mx-auto max-w-5xl px-6 py-24"
    >
      <motion.h2 variants={item} className="font-display text-4xl tracking-tight">
        Built for the download, not the dashboard.
      </motion.h2>
      <motion.p variants={item} className="mt-3 max-w-xl opacity-65">
        One place to fetch YouTube media, keep a queue, and find it later.
      </motion.p>
      <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <motion.article key={feature.title} variants={item}>
            <feature.icon size={20} className="text-primary" />
            <h3 className="mt-4 font-display text-lg">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-65">{feature.body}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
