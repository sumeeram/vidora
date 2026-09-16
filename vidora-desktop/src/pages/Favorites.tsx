import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { MediaCard } from "../components/MediaCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../lib/api";
import { useApp } from "../store/app";

export default function Favorites() {
  const favorites = useApp((s) => s.favorites);
  const setFavorites = useApp((s) => s.setFavorites);
  const navigate = useNavigate();

  return (
    <section className="max-w-6xl">
      <PageHeader
        title="Favorites"
        description="Star a video from Home or Library to keep the link handy."
      />
      {favorites.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Star}
          title="No favorites yet"
          body="Star a video from Home or Library to keep the link here."
          action={
            <Link to="/" className="btn btn-primary rounded-2xl">
              Go to Home
            </Link>
          }
        />
      ) : (
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
      )}
    </section>
  );
}
