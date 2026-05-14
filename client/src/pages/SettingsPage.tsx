import { useSettings, useUpdateSettings } from "../api/queries";
import TemplateEditor from "../components/settings/TemplateEditor";

const INTERVAL_CHIPS = [10, 25, 45];

export default function SettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  if (!settings) return null;

  function handleIntervalChange(value: number) {
    if (value >= 1 && value <= 120) {
      updateSettings.mutate({ focusInterval: value });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h2 className="text-xl font-semibold tracking-tight">Settings</h2>

      <section className="space-y-3">
        <label className="block text-sm font-medium">
          Default task duration
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            aria-label="Default task duration"
            value={settings.focusInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            min={1}
            max={120}
            className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
        <div className="flex gap-2">
          {INTERVAL_CHIPS.map((mins) => (
            <button
              key={mins}
              onClick={() => handleIntervalChange(mins)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                settings.focusInterval === mins
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between">
        <label htmlFor="notifications" className="text-sm font-medium">
          Notifications
        </label>
        <button
          id="notifications"
          aria-label="Notifications"
          role="switch"
          aria-checked={settings.notificationsEnabled}
          onClick={() =>
            updateSettings.mutate({
              notificationsEnabled: !settings.notificationsEnabled,
            })
          }
          className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
            settings.notificationsEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${
              settings.notificationsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-medium">Task overflow</label>
        <div className="flex gap-2">
          {(["keep", "carry"] as const).map((option) => (
            <button
              key={option}
              onClick={() => updateSettings.mutate({ taskOverflow: option })}
              className={`rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer ${
                settings.taskOverflow === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {option === "keep" ? "Keep in place" : "Rollover to today"}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto-populate new days</label>
          <button
            aria-label="Auto-populate"
            role="switch"
            aria-checked={settings.autoPopulate}
            onClick={() =>
              updateSettings.mutate({ autoPopulate: !settings.autoPopulate })
            }
            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
              settings.autoPopulate ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${
                settings.autoPopulate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          When enabled, new days are pre-filled from your daily schedule.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Daily Schedule</h2>
        <TemplateEditor />
      </section>
    </div>
  );
}
