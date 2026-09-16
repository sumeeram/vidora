import { useEffect, useState } from "react";
import { FolderOpen, TriangleAlert } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { api } from "../lib/api";
import {
  checkForAppUpdate,
  getAppVersion,
  installAppUpdate,
  type Update,
} from "../lib/updater";
import { useApp } from "../store/app";
import { useTheme } from "../store/theme";
import type { Settings } from "../types";

export default function SettingsPage() {
  const settings = useApp((s) => s.settings);
  const setSettings = useApp((s) => s.setSettings);
  const sidecar = useApp((s) => s.sidecar);
  const pushToast = useApp((s) => s.pushToast);
  const setTheme = useTheme((s) => s.setTheme);
  const [busy, setBusy] = useState(false);
  const [updateLog, setUpdateLog] = useState("");
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [appUpdate, setAppUpdate] = useState<Update | null>(null);
  const [appUpdateBusy, setAppUpdateBusy] = useState(false);
  const [appUpdateMessage, setAppUpdateMessage] = useState(
    "Vidora can install newer GitHub Releases automatically.",
  );
  const [appUpdateProgress, setAppUpdateProgress] = useState<number | null>(
    null,
  );

  useEffect(() => {
    void getAppVersion().then((version) => {
      if (version) setAppVersion(version);
    });
  }, []);

  async function patch(next: Partial<Settings>) {
    const saved = await api.saveSettings({ ...settings, ...next });
    setSettings(saved);
    if (next.theme === "vidora-dark" || next.theme === "vidora-light") {
      setTheme(next.theme);
    }
  }

  async function pickFolder() {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") {
      await patch({ outputDir: dir });
    }
  }

  async function openFolder() {
    try {
      await api.openDownloadFolder(settings.outputDir);
    } catch (err) {
      pushToast({ title: "Could not open folder", body: String(err) });
    }
  }

  async function updateEngine() {
    setBusy(true);
    try {
      const log = await api.updateYtdlp();
      setUpdateLog(log);
      pushToast({ title: "yt-dlp updated" });
      useApp.getState().setSidecar(await api.sidecarStatus());
    } catch (err) {
      setUpdateLog(String(err));
      pushToast({ title: "Update failed", body: String(err) });
    } finally {
      setBusy(false);
    }
  }

  async function checkAppUpdate() {
    setAppUpdateBusy(true);
    setAppUpdate(null);
    setAppUpdateProgress(null);
    setAppUpdateMessage("Checking GitHub Releases…");
    try {
      const update = await checkForAppUpdate();
      setAppUpdate(update);
      if (update) {
        setAppUpdateMessage(`Version ${update.version} is ready to install.`);
        pushToast({ title: `Vidora ${update.version} is available` });
      } else {
        setAppUpdateMessage("You are on the latest version.");
        pushToast({ title: "Vidora is up to date" });
      }
    } catch (err) {
      setAppUpdate(null);
      setAppUpdateMessage(String(err));
      pushToast({ title: "Update check failed", body: String(err) });
    } finally {
      setAppUpdateBusy(false);
    }
  }

  async function installApp() {
    if (!appUpdate) return;
    setAppUpdateBusy(true);
    setAppUpdateMessage(
      "Downloading update… Vidora will restart when it is ready.",
    );
    try {
      await installAppUpdate(appUpdate, (progress) => {
        setAppUpdateProgress(progress.percent);
      });
    } catch (err) {
      setAppUpdateMessage(String(err));
      pushToast({ title: "Update failed", body: String(err) });
      setAppUpdateBusy(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Keep Vidora quiet, fast, and in the right folder."
      />

      {sidecar && !sidecar.ready ? (
        <EmptyState
          tone="warning"
          icon={TriangleAlert}
          title="Engine not ready"
          body={sidecar.message}
        />
      ) : null}

      <div className="glass rounded-box flex flex-col gap-5 p-5">
        <p className="font-display">Downloads</p>
        <div className="flex w-full flex-col gap-2">
          <span className="text-sm">Output folder</span>
          <div className="flex w-full flex-wrap gap-2">
            <input
              className="input input-bordered min-w-0 flex-1"
              value={settings.outputDir}
              readOnly
            />
            <button className="btn" onClick={() => void pickFolder()}>
              Browse
            </button>
            <button
              className="btn btn-ghost gap-2"
              onClick={() => void openFolder()}
            >
              <FolderOpen size={16} />
              Open
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="text-sm">
            Concurrent downloads ({settings.concurrency})
          </span>
          <input
            type="range"
            min={1}
            max={4}
            value={settings.concurrency}
            className="range range-primary w-full"
            onChange={(e) =>
              void patch({ concurrency: Number(e.target.value) })
            }
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="text-sm">Speed limit</span>
          <input
            className="input input-bordered w-full"
            placeholder="2M"
            value={settings.rateLimit}
            onChange={(e) => void patch({ rateLimit: e.target.value })}
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="text-sm">Filename template</span>
          <input
            className="input input-bordered w-full font-mono text-sm"
            value={settings.filenameTemplate}
            onChange={(e) => void patch({ filenameTemplate: e.target.value })}
          />
        </div>
      </div>

      <div className="glass rounded-box flex flex-col gap-3 p-5">
        <p className="font-display">Clipboard & defaults</p>
        <Toggle
          label="Watch clipboard for YouTube links"
          checked={settings.clipboardWatch}
          onChange={(clipboardWatch) => void patch({ clipboardWatch })}
        />
        <Toggle
          label="Keep watching while unfocused"
          checked={settings.clipboardUnfocused}
          onChange={(clipboardUnfocused) => void patch({ clipboardUnfocused })}
        />
        <Toggle
          label="Embed chapters by default"
          checked={settings.embedChapters}
          onChange={(embedChapters) => void patch({ embedChapters })}
        />
        <Toggle
          label="Embed thumbnail by default"
          checked={settings.embedThumbnail}
          onChange={(embedThumbnail) => void patch({ embedThumbnail })}
        />
        <Toggle
          label="Write subtitles by default"
          checked={settings.writeSubs}
          onChange={(writeSubs) => void patch({ writeSubs })}
        />
        <Toggle
          label="Write auto captions by default"
          checked={settings.writeAutoSubs}
          onChange={(writeAutoSubs) => void patch({ writeAutoSubs })}
        />
      </div>

      <div className="glass rounded-box p-5">
        <p className="font-display">App updates</p>
        <p className="text-sm opacity-60 mt-1">
          {appVersion ? `Current version ${appVersion}. ` : null}
          {appUpdateMessage}
        </p>
        {appUpdateProgress != null ? (
          <progress
            className="progress progress-primary mt-3"
            value={appUpdateProgress}
            max={100}
          />
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn btn-sm"
            disabled={appUpdateBusy}
            onClick={() => void checkAppUpdate()}
          >
            {appUpdateBusy && !appUpdate ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Check for updates"
            )}
          </button>
          {appUpdate ? (
            <button
              className="btn btn-primary btn-sm"
              disabled={appUpdateBusy}
              onClick={() => void installApp()}
            >
              {appUpdateBusy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                `Install ${appUpdate.version}`
              )}
            </button>
          ) : null}
        </div>
      </div>

      <div className="glass rounded-box p-5">
        <p className="font-display">yt-dlp engine</p>
        <p className="mt-1 text-sm opacity-60">
          {sidecar?.message ?? "Checking…"}
        </p>
        <button
          className="btn btn-primary btn-sm mt-4"
          disabled={busy}
          onClick={() => void updateEngine()}
        >
          {busy ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Update yt-dlp"
          )}
        </button>
        {updateLog ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs opacity-70">
            {updateLog}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
