import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Download, Link2, Star } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { FormatPicker } from "../components/FormatPicker";
import { AdvancedOptions } from "../components/AdvancedOptions";
import { GlassPanel } from "../components/GlassPanel";
import { api, type EnqueueShape } from "../lib/api";
import { formatDuration } from "../lib/format";
import { useApp } from "../store/app";
import {
  FORMAT_PRESETS,
  emptyOptions,
  type FormatInfo,
  type FormatSpec,
  type MediaInfo,
} from "../types";
import { item, springs, stagger } from "../motion/tokens";

export default function Home() {
  const navigate = useNavigate();
  const settings = useApp((s) => s.settings);
  const sidecar = useApp((s) => s.sidecar);
  const pushToast = useApp((s) => s.pushToast);
  const pendingUrl = useApp((s) => s.pendingUrl);
  const setPendingUrl = useApp((s) => s.setPendingUrl);
  const [url, setUrl] = useState(pendingUrl);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<FormatSpec>(FORMAT_PRESETS[4]);
  const [options, setOptions] = useState(emptyOptions(settings));
  const [selected, setSelected] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [customId, setCustomId] = useState("");

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
    if (pendingUrl) {
      setUrl(pendingUrl);
      setPendingUrl("");
    }
  }, [pendingUrl, setPendingUrl]);

  useEffect(() => {
    const apply = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next) setUrl(next);
    };
    window.addEventListener("vidora:use-url", apply);
    return () => window.removeEventListener("vidora:use-url", apply);
  }, []);

  async function fetchInfo(event?: FormEvent) {
    event?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const next = await api.fetchInfo(url.trim());
      setInfo(next);
      setSelected(next.entries.map((e) => e.id));
      setFavorited(await api.isFavorite(next.url, next.id));
    } catch (err) {
      pushToast({ title: "Could not read link", body: String(err) });
    } finally {
      setLoading(false);
    }
  }

  const chosenFormat = useMemo(() => {
    if (!customId || !info) return format;
    const raw = info.formats.find((f) => f.id === customId);
    if (!raw) return format;
    return fromRawFormat(raw);
  }, [customId, format, info]);

  async function queueCurrent() {
    let media = info;
    if (!media) {
      if (!url.trim()) return;
      setLoading(true);
      try {
        media = await api.fetchInfo(url.trim());
        setInfo(media);
        setSelected(media.entries.map((e) => e.id));
        setFavorited(await api.isFavorite(media.url, media.id));
      } catch (err) {
        pushToast({ title: "Could not read link", body: String(err) });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    try {
      if (media.kind === "playlist") {
        const requests: EnqueueShape[] = media.entries
          .filter((entry) => selected.includes(entry.id) || selected.length === 0)
          .map((entry) => ({
            url: entry.url,
            title: entry.title,
            thumbnail: entry.thumbnail,
            channel: entry.channel ?? media.channel,
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
          url: media.url,
          title: media.title,
          thumbnail: media.thumbnail,
          channel: media.channel,
          videoId: media.id,
          format: chosenFormat,
          options,
        });
        pushToast({ title: "Added to queue", body: media.title });
      }
      navigate("/queue");
    } catch (err) {
      pushToast({ title: "Could not queue", body: String(err) });
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

  return (
    <motion.section variants={stagger} initial="initial" animate="animate" className="max-w-4xl">
      <motion.div variants={item} className="flex items-center gap-4">
        <BrandMark size={52} />
        <h1 className="font-display text-6xl md:text-7xl tracking-tight leading-none">Vidora</h1>
      </motion.div>
      <motion.p variants={item} className="mt-4 max-w-xl text-lg opacity-70">
        Save any YouTube video, any format.
      </motion.p>

      <motion.form variants={item} onSubmit={fetchInfo} className="mt-10 flex gap-3">
        <label className="input input-lg glass flex-1 items-center gap-3 rounded-2xl border-0">
          <Link2 size={18} className="opacity-50" />
          <input
            className="grow bg-transparent"
            placeholder="Paste a YouTube link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="btn btn-primary btn-lg rounded-2xl px-8"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner" /> : "Fetch"}
        </motion.button>
      </motion.form>

      {sidecar && !sidecar.ready ? (
        <motion.p variants={item} className="mt-4 text-sm text-warning">
          {sidecar.message}
        </motion.p>
      ) : null}

      <motion.div variants={item} className="mt-8">
        <FormatPicker value={format} onChange={(next) => { setFormat(next); setCustomId(""); }} />
      </motion.div>

      <motion.div variants={item} className="mt-6 flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary rounded-2xl gap-2"
          onClick={() => void queueCurrent()}
        >
          <Download size={16} />
          Add to queue
        </motion.button>
      </motion.div>

      {info ? (
        <GlassPanel className="mt-10 p-5">
          <div className="flex gap-5">
            {info.thumbnail ? (
              <img
                src={info.thumbnail}
                alt=""
                className="h-28 w-48 rounded-xl object-cover thumb-treatment"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
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
                <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void toggleFav()}>
                  <Star size={16} className={favorited ? "fill-primary text-primary" : ""} />
                </button>
              </div>
              {info.formats.length > 0 ? (
                <select
                  className="select select-sm mt-4 max-w-md bg-base-100/40"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
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
          </div>
          {info.kind === "playlist" ? (
            <div className="mt-5 max-h-64 overflow-y-auto space-y-2">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selected.length === info.entries.length}
                  onChange={(e) =>
                    setSelected(e.target.checked ? info.entries.map((entry) => entry.id) : [])
                  }
                />
                Select all
              </label>
              {info.entries.map((entry) => (
                <label key={entry.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selected.includes(entry.id)}
                    onChange={(e) =>
                      setSelected((curr) =>
                        e.target.checked ? [...curr, entry.id] : curr.filter((id) => id !== entry.id),
                      )
                    }
                  />
                  <span className="truncate">{entry.title}</span>
                </label>
              ))}
            </div>
          ) : null}
        </GlassPanel>
      ) : null}

      <motion.div variants={item} className="mt-6">
        <AdvancedOptions value={options} onChange={setOptions} />
      </motion.div>
    </motion.section>
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
