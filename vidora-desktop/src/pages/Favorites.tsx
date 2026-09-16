import { motion } from "motion/react";
import { MediaCard } from "../components/MediaCard";
import { api } from "../lib/api";
import { useApp } from "../store/app";
import { pageTransition } from "../motion/tokens";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const favorites = useApp((s) => s.favorites);
  const setFavorites = useApp((s) => s.setFavorites);
  const navigate = useNavigate();

  return (
    <motion.section {...pageTransition} className="max-w-6xl">
      <h1 className="font-display text-4xl">Favorites</h1>
      <p className="mt-2 opacity-60">Keep the videos you want to return to.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {favorites.map((item) => (
          <MediaCard
            key={item.id}
            title={item.title}
            channel={item.channel}
            thumbnail={item.thumbnail}
            url={item.url}
            favorited
            onUse={() => {
              useApp.getState().setPendingUrl(item.url);
              navigate("/");
            }}
            onFavorite={async () => {
              await api.toggleFavorite({
                url: item.url,
                title: item.title,
                thumbnail: item.thumbnail,
                channel: item.channel,
                videoId: item.videoId,
              });
              setFavorites(await api.getFavorites());
            }}
          />
        ))}
      </div>
      {favorites.length === 0 ? <p className="mt-10 opacity-50">Star a video from Home to keep it here.</p> : null}
    </motion.section>
  );
}
