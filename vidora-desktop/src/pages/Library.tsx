import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Library as LibraryIcon, Search, Trash2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { MediaRow } from "../components/MediaRow";
import { PageHeader } from "../components/PageHeader";
import { api } from "../lib/api";
import { matchesDateFilter, type DateFilter } from "../lib/format";
import { useApp } from "../store/app";

export default function Library() {
  const history = useApp((s) => s.history);
  const favorites = useApp((s) => s.favorites);
  const settings = useApp((s) => s.settings);
  const setHistory = useApp((s) => s.setHistory);
  const pushToast = useApp((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("all");
  const [channel, setChannel] = useState("all");
  const [date, setDate] = useState<DateFilter>("all");

  const formats = useMemo(() => {
    const values = new Set(
      history.map((item) => item.formatLabel?.trim()).filter((value): value is string => Boolean(value)),
    );
    return Array.from(values).sort();
  }, [history]);

  const channels = useMemo(() => {
    const values = new Set(
      history.map((item) => item.channel?.trim()).filter((value): value is string => Boolean(value)),
    );
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [history]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((item) => {
      const haystack = `${item.title} ${item.channel ?? ""} ${item.url}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (format !== "all" && (item.formatLabel ?? "") !== format) return false;
      if (channel !== "all" && (item.channel ?? "") !== channel) return false;
      if (!matchesDateFilter(item.createdAt, date)) return false;
      return true;
    });
  }, [history, query, format, channel, date]);

  const filtersActive = query.trim() !== "" || format !== "all" || channel !== "all" || date !== "all";

  async function clearAll() {
    await api.clearHistory();
    setHistory([]);
    pushToast({ title: "History cleared" });
  }

  async function openFolder() {
    try {
      await api.openDownloadFolder(settings.outputDir);
    } catch (err) {
      pushToast({ title: "Could not open folder", body: String(err) });
    }
  }

  function resetFilters() {
    setQuery("");
    setFormat("all");
    setChannel("all");
    setDate("all");
  }

  return (
    <section className="max-w-4xl">
      <PageHeader title="Library" description="Everything already saved on this machine.">
        <button className="btn btn-ghost btn-sm gap-2" onClick={() => void openFolder()}>
          <FolderOpen size={14} />
          Open folder
        </button>
        <button
          className="btn btn-ghost btn-sm gap-2"
          disabled={history.length === 0}
          onClick={() => void clearAll()}
        >
          <Trash2 size={14} />
          Clear
        </button>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3">
        <label className="input glass w-full items-center gap-2 border-0">
          <Search size={16} className="opacity-50" />
          <input
            placeholder="Search titles, channels, or URLs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search library"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            className="select select-sm bg-base-100/40"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            aria-label="Filter by format"
          >
            <option value="all">All formats</option>
            {formats.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="select select-sm bg-base-100/40 max-w-[180px]"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            aria-label="Filter by channel"
          >
            <option value="all">All channels</option>
            {channels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="select select-sm bg-base-100/40"
            value={date}
            onChange={(e) => setDate(e.target.value as DateFilter)}
            aria-label="Filter by date"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {history.length === 0 ? (
          <EmptyState
            icon={LibraryIcon}
            title="No downloads yet"
            body="Finished jobs show up here. Preview a link on Home to get started."
            action={
              <Link to="/" className="btn btn-primary rounded-2xl">
                Go to Home
              </Link>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching downloads"
            body="Try a different search or clear the filters."
            action={
              <button className="btn btn-ghost rounded-2xl" onClick={resetFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          rows.map((item) => (
            <MediaRow
              key={item.id}
              title={item.title}
              channel={item.channel}
              thumbnail={item.thumbnail}
              meta={item.formatLabel}
              url={item.url}
              filepath={item.filepath}
              createdAt={item.createdAt}
              favorited={favorites.some((fav) => fav.url === item.url || fav.videoId === item.videoId)}
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
          ))
        )}
      </div>
      {history.length > 0 && rows.length > 0 ? (
        <p className="mt-4 text-caption opacity-45">
          {rows.length} {rows.length === 1 ? "item" : "items"}
          {filtersActive ? " matching filters" : ""}
        </p>
      ) : null}
    </section>
  );
}
