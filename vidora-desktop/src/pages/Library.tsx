import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Trash2 } from "lucide-react";
import { MediaCard } from "../components/MediaCard";
import { api } from "../lib/api";
import { useApp } from "../store/app";
import { pageTransition } from "../motion/tokens";

export default function Library() {
  const history = useApp((s) => s.history);
  const favorites = useApp((s) => s.favorites);
  const setHistory = useApp((s) => s.setHistory);
  const pushToast = useApp((s) => s.pushToast);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.channel ?? "").toLowerCase().includes(q),
    );
  }, [history, query]);

  async function clearAll() {
    await api.clearHistory();
    setHistory([]);
    pushToast({ title: "History cleared" });
  }

  return (
    <motion.section {...pageTransition} className="max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Library</h1>
          <p className="mt-2 opacity-60">Everything already saved on this machine.</p>
        </div>
        <button className="btn btn-ghost btn-sm gap-2" onClick={() => void clearAll()}>
          <Trash2 size={14} />
          Clear
        </button>
      </div>
      <label className="input glass mt-6 max-w-md items-center gap-2 border-0">
        <Search size={16} className="opacity-50" />
        <input
          placeholder="Search titles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) => (
          <MediaCard
            key={item.id}
            title={item.title}
            channel={item.channel}
            thumbnail={item.thumbnail}
            meta={item.formatLabel}
            url={item.url}
            filepath={item.filepath}
            favorited={favorites.some((f) => f.url === item.url || f.videoId === item.videoId)}
            onFavorite={async () => {
              await api.toggleFavorite({
                url: item.url,
                title: item.title,
                thumbnail: item.thumbnail,
                channel: item.channel,
                videoId: item.videoId,
              });
              useApp.getState().setFavorites(await api.getFavorites());
            }}
          />
        ))}
      </div>
      {rows.length === 0 ? <p className="mt-10 opacity-50">No downloads yet.</p> : null}
    </motion.section>
  );
}
