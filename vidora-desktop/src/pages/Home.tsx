import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, Download, Link2, Search, Star } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { EmptyState } from "../components/EmptyState";
import { FormatPicker } from "../components/FormatPicker";
import { AdvancedOptions } from "../components/AdvancedOptions";
import { GlassPanel } from "../components/GlassPanel";
import { api, type EnqueueShape } from "../lib/api";
import { extractYoutubeUrlFromDrop, formatDuration } from "../lib/format";
import { useApp } from "../store/app";
import {
  FORMAT_PRESETS,
  emptyOptions,
  type FormatInfo,
  type FormatSpec,
  type MediaInfo,
} from "../types";
import { item, springs, stagger } from "../motion/tokens";
import clsx from "clsx";

export default function Home() {
  const navigate = useNavigate();
  const settings = useApp((s) => s.settings);
  const sidecar = useApp((s) => s.sidecar);
  const pushToast = useApp((s) => s.pushToast);
  const pendingUrl = useApp((s) => s.pendingUrl);
  const setPendingUrl = useApp((s) => s.setPendingUrl);
  const [url, setUrl] = useState(pendingUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<FormatSpec>(FORMAT_PRESETS[4]);
  const [options, setOptions] = useState(emptyOptions(settings));
  const [selected, setSelected] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [customId, setCustomId] = useState("");
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const engineBlocked = sidecar !== null && !sidecar.ready;

  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      outputDir: settings.outputDir || prev.outputDir,
      filenameTemplate: settings.filenameTemplate || prev.filenameTemplate,
      rateLimit: settings.rateLimit,
      subtitles: settings.writeSubs,
      autoSubs: settings.writeAutoSubs,
      embedChapters: settings.embedChapters,
      embedThumbnail: settings.embedThumbnail,
    }));
  }, [settings]);

  useEffect(() => {
    if (!pendingUrl) return;
    const next = pendingUrl;
    setPendingUrl("");
    void previewUrl(next);
  }, [pendingUrl, setPendingUrl]);

  const visibleEntries = useMemo(() => {
    if (!info || info.kind !== "playlist") return [];
    const q = playlistQuery.trim().toLowerCase();
    if (!q) return info.entries;
    return info.entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        (entry.channel ?? "").toLowerCase().includes(q),
    );
  }, [info, playlistQuery]);

  const allVisibleSelected =
    visibleEntries.length > 0 && visibleEntries.every((entry) => selected.includes(entry.id));
  const someVisibleSelected = visibleEntries.some((entry) => selected.includes(entry.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  async function previewUrl(target = url) {
    const trimmed = target.trim();
    if (!trimmed) return;
    setUrl(trimmed);
    setError(null);
    setLoading(true);
    try {
      const next = await api.fetchInfo(trimmed);
      setInfo(next);
      setSelected(next.entries.map((entry) => entry.id));
      setFavorited(await api.isFavorite(next.url, next.id));
      setCustomId("");
      setPlaylistQuery("");
    } catch (err) {
      setInfo(null);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function fetchInfo(event?: FormEvent) {
    event?.preventDefault();
    void previewUrl(url);
  }

  function resetPreview() {
    setInfo(null);
    setError(null);
    setFavorited(false);
    setSelected([]);
    setCustomId("");
    setPlaylistQuery("");
  }

  const chosenFormat = useMemo(() => {
    if (!customId || !info) return format;
    const raw = info.formats.find((item) => item.id === customId);
    if (!raw) return format;
    return fromRawFormat(raw);
  }, [customId, format, info]);

  async function queueCurrent() {
    if (!info) return;
    setQueuing(true);
    try {
      if (info.kind === "playlist") {
        const requests: EnqueueShape[] = info.entries
          .filter((entry) => selected.includes(entry.id))
          .map((entry) => ({
            url: entry.url,
            title: entry.title,
            thumbnail: entry.thumbnail,
            channel: entry.channel ?? info.channel,
            videoId: entry.id,
            format: chosenFormat,
            options,
          }));
        if (!requests.length) {
          pushToast({ title: "Select at least one video" });
          return;
        }
        await api.enqueueBatch(requests);
        pushToast({ title: `${requests.length} videos queued` });
      } else {
        await api.enqueue({
          url: info.url,
          title: info.title,
          thumbnail: info.thumbnail,
          channel: info.channel,
          videoId: info.id,
          format: chosenFormat,
          options,
        });
        pushToast({ title: "Added to queue", body: info.title });
      }
      navigate("/queue");
    } catch (err) {
      pushToast({ title: "Could not queue", body: String(err) });
    } finally {
      setQueuing(false);
    }
  }

  async function toggleFav() {
    if (!info) return;
    const next = await api.toggleFavorite({
      url: info.url,
      title: info.title,
      thumbnail: info.thumbnail,
      channel: info.channel,
      videoId: info.id,
    });
    setFavorited(next);
    useApp.getState().setFavorites(await api.getFavorites());
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const next = extractYoutubeUrlFromDrop(event.dataTransfer);
    if (!next) {
      pushToast({ title: "Drop a YouTube link", body: "Only YouTube URLs can be previewed." });
      return;
    }
    void previewUrl(next);
  }

  const selectedCount = info?.kind === "playlist" ? selected.length : 1;
  const queueLabel =
    info?.kind === "playlist"
      ? `Add ${selectedCount} to queue`
      : "Add to queue";

  return (
    <motion.section
      variants={stagger}
      initial="initial"
      animate="animate"
      className="relative max-w-4xl"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragging ? (
        <div className="drop-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-box">
          <p className="font-display text-xl">Drop YouTube link to preview</p>
        </div>
      ) : null}

      <motion.div variants={item} className="flex items-center gap-4">
        <BrandMark size={52} />
        <h1 className="font-display text-6xl md:text-7xl tracking-tight leading-none">Vidora</h1>
      </motion.div>
      <motion.p variants={item} className="mt-4 max-w-xl text-lg opacity-70">
        Paste a YouTube link, preview it, then queue the format you want.
      </motion.p>

      <motion.form variants={item} onSubmit={fetchInfo} className="mt-10 flex gap-3">
        <label className="input input-lg glass flex-1 items-center gap-3 rounded-2xl border-0">
          <Link2 size={18} className="opacity-50" />
          <input
            className="grow bg-transparent"
            placeholder="Paste a YouTube link"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (info || error) resetPreview();
            }}
            aria-label="YouTube URL"
          />
        </label>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className={clsx(
            "btn btn-lg rounded-2xl px-8",
            info ? "btn-ghost" : "btn-primary",
          )}
          disabled={loading || !url.trim() || engineBlocked}
        >
          {loading ? <span className="loading loading-spinner" /> : "Preview"}
        </motion.button>
      </motion.form>

      {engineBlocked ? (
        <motion.p variants={item} className="mt-4 text-sm text-warning">
          {sidecar?.message}
        </motion.p>
      ) : null}

      {loading ? <PreviewSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
          className="mt-8"
          tone="error"
          icon={AlertCircle}
          title="Could not read that link"
          body={error}
          action={
            <button className="btn btn-primary rounded-2xl" onClick={() => void previewUrl(url)}>
              Try again
            </button>
          }
        />
      ) : null}

      {!loading && !error && !info ? (
        <EmptyState
          className="mt-8"
          icon={Link2}
          title="Nothing to preview yet"
          body="Paste a video or playlist URL, or drag a YouTube link onto this page. Download only media you have the right to save."
        />
      ) : null}

      {info && !loading ? (
        <GlassPanel className="mt-8 p-5">
          <div className="flex gap-5">
            {info.thumbnail ? (
              <img
                src={info.thumbnail}
                alt=""
                className="h-28 w-48 shrink-0 rounded-xl object-cover thumb-treatment"
              />
            ) : (
              <div className="h-28 w-48 shrink-0 rounded-xl ambient-root" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption uppercase tracking-[0.2em] opacity-50">
                    {info.kind === "playlist" ? "Playlist" : "Ready"}
                  </p>
                  <h2 className="font-display text-2xl leading-tight">{info.title}</h2>
                  <p className="mt-1 opacity-60">
                    {info.channel}
                    {info.duration ? ` · ${formatDuration(info.duration)}` : ""}
                    {info.kind === "playlist" ? ` · ${info.entries.length} videos` : ""}
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-circle shrink-0"
                  onClick={() => void toggleFav()}
                  aria-label={favorited ? "Remove favorite" : "Add favorite"}
                >
                  <Star size={16} className={favorited ? "fill-primary text-primary" : ""} />
                </button>
              </div>
            </div>
          </div>

          {info.kind === "playlist" ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="label cursor-pointer justify-start gap-2 py-0">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      const ids = visibleEntries.map((entry) => entry.id);
                      setSelected((curr) =>
                        e.target.checked
                          ? Array.from(new Set([...curr, ...ids]))
                          : curr.filter((id) => !ids.includes(id)),
                      );
                    }}
                  />
                  <span className="text-sm">
                    {selected.length} of {info.entries.length} selected
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelected(info.entries.map((entry) => entry.id))}
                >
                  All
                </button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSelected([])}>
                  None
                </button>
                {info.entries.length > 8 ? (
                  <label className="input input-sm glass ml-auto max-w-xs items-center gap-2 border-0">
                    <Search size={14} className="opacity-50" />
                    <input
                      placeholder="Filter playlist"
                      value={playlistQuery}
                      onChange={(e) => setPlaylistQuery(e.target.value)}
                    />
                  </label>
                ) : null}
              </div>
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
                {visibleEntries.length === 0 ? (
                  <p className="px-2 py-4 text-sm opacity-50">No videos match that filter.</p>
                ) : (
                  visibleEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-base-100/40"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selected.includes(entry.id)}
                        onChange={(e) =>
                          setSelected((curr) =>
                            e.target.checked
                              ? [...curr, entry.id]
                              : curr.filter((id) => id !== entry.id),
                          )
                        }
                      />
                      {entry.thumbnail ? (
                        <img
                          src={entry.thumbnail}
                          alt=""
                          className="h-9 w-14 rounded-md object-cover thumb-treatment"
                        />
                      ) : (
                        <div className="h-9 w-14 rounded-md bg-base-300" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                      {entry.duration ? (
                        <span className="shrink-0 text-caption opacity-50">
                          {formatDuration(entry.duration)}
                        </span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2 text-caption uppercase tracking-[0.16em] opacity-50">Format</p>
            <FormatPicker
              value={format}
              onChange={(next) => {
                setFormat(next);
                setCustomId("");
              }}
            />
            {info.formats.length > 0 ? (
              <select
                className="select select-sm mt-3 max-w-md bg-base-100/40"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                aria-label="Exact format"
              >
                <option value="">Preset format</option>
                {info.formats.slice(0, 40).map((itemFmt) => (
                  <option key={itemFmt.id} value={itemFmt.id}>
                    {itemFmt.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="mt-5">
            <AdvancedOptions value={options} onChange={setOptions} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg rounded-2xl gap-2 px-8"
              disabled={queuing || engineBlocked || (info.kind === "playlist" && selected.length === 0)}
              onClick={() => void queueCurrent()}
            >
              {queuing ? <span className="loading loading-spinner loading-sm" /> : <Download size={18} />}
              {queueLabel}
            </motion.button>
            <p className="text-sm opacity-50">{chosenFormat.label}</p>
          </div>
        </GlassPanel>
      ) : null}
    </motion.section>
  );
}

function PreviewSkeleton() {
  return (
    <div className="glass mt-8 animate-pulse rounded-box p-5">
      <div className="flex gap-5">
        <div className="h-28 w-48 rounded-xl bg-base-300" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-20 rounded bg-base-300" />
          <div className="h-6 w-3/4 rounded bg-base-300" />
          <div className="h-4 w-1/2 rounded bg-base-300" />
        </div>
      </div>
    </div>
  );
}

function fromRawFormat(raw: FormatInfo): FormatSpec {
  const selector = raw.hasVideo && !raw.hasAudio ? `${raw.id}+bestaudio` : raw.id;
  return {
    id: raw.id,
    label: raw.label,
    kind: "custom",
    selector,
  };
}
