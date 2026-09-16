import type { JobOptions } from "../types";

export function AdvancedOptions({
  value,
  onChange,
}: {
  value: JobOptions;
  onChange: (next: JobOptions) => void;
}) {
  const set = (patch: Partial<JobOptions>) => onChange({ ...value, ...patch });

  return (
    <div className="collapse collapse-arrow bg-base-100/30 rounded-box border border-base-content/8">
      <input type="checkbox" />
      <div className="collapse-title font-display text-sm tracking-wide">Advanced options</div>
      <div className="collapse-content grid gap-4 md:grid-cols-2">
        <label className="form-control">
          <span className="label-text text-caption opacity-70">Trim start</span>
          <input
            className="input input-bordered input-sm"
            placeholder="00:00:15"
            value={value.trimStart}
            onChange={(e) => set({ trimStart: e.target.value })}
          />
        </label>
        <label className="form-control">
          <span className="label-text text-caption opacity-70">Trim end</span>
          <input
            className="input input-bordered input-sm"
            placeholder="00:01:30"
            value={value.trimEnd}
            onChange={(e) => set({ trimEnd: e.target.value })}
          />
        </label>
        <label className="form-control">
          <span className="label-text text-caption opacity-70">Speed limit</span>
          <input
            className="input input-bordered input-sm"
            placeholder="2M"
            value={value.rateLimit}
            onChange={(e) => set({ rateLimit: e.target.value })}
          />
        </label>
        <label className="form-control md:col-span-2">
          <span className="label-text text-caption opacity-70">Filename template</span>
          <input
            className="input input-bordered input-sm font-mono text-xs"
            value={value.filenameTemplate}
            onChange={(e) => set({ filenameTemplate: e.target.value })}
          />
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={value.subtitles}
            onChange={(e) => set({ subtitles: e.target.checked })}
          />
          <span className="label-text">Subtitles</span>
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={value.autoSubs}
            onChange={(e) => set({ autoSubs: e.target.checked })}
          />
          <span className="label-text">Auto captions</span>
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={value.embedChapters}
            onChange={(e) => set({ embedChapters: e.target.checked })}
          />
          <span className="label-text">Chapters</span>
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={value.embedThumbnail}
            onChange={(e) => set({ embedThumbnail: e.target.checked })}
          />
          <span className="label-text">Embed thumbnail</span>
        </label>
      </div>
    </div>
  );
}
