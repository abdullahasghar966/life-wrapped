'use client';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { OptionsPatch } from '@/engine/api';
import type { IngestSummary } from '@/engine/types';

function timeZones(current: string): string[] {
  try {
    const all =
      (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
        'timeZone',
      ) ?? [];
    return all.includes(current) ? all : [current, ...all];
  } catch {
    return [current];
  }
}

const selectClass =
  'border-input bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-(--ring)/50';

export function SettingsSheet({
  open,
  onOpenChange,
  summary,
  onChange,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: IngestSummary;
  onChange: (patch: OptionsPatch) => void;
  onClear: () => void;
}) {
  const o = summary.options;
  const zones = useMemo(() => timeZones(o.timeZone), [o.timeZone]);
  const hasSpotify = summary.counts.spotifyPlays > 0;
  const hasSearches = summary.counts.youtubeSearches > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="dark w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Story settings</SheetTitle>
          <SheetDescription>Changes apply instantly. Nothing leaves this tab.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <select
              id="period"
              className={selectClass}
              value={o.periodId ?? summary.period?.id ?? ''}
              onChange={(e) => onChange({ period: e.target.value })}
            >
              {summary.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tz">Time zone</Label>
            <select
              id="tz"
              className={selectClass}
              value={o.timeZone}
              onChange={(e) => onChange({ timeZone: e.target.value })}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Exports are in UTC; we convert every timestamp to this zone on your device.
            </p>
          </div>

          {summary.netflixProfiles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="profile">Netflix profile</Label>
              <select
                id="profile"
                className={selectClass}
                value={o.netflixProfile ?? ''}
                onChange={(e) => onChange({ netflixProfile: e.target.value })}
              >
                {summary.netflixProfiles.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasSpotify && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="private">Include private sessions</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  They always count in your totals. Turn this on to let them into top lists too.
                </p>
              </div>
              <Switch
                id="private"
                checked={o.includePrivateSessions}
                onCheckedChange={(v) => onChange({ includePrivateSessions: v })}
              />
            </div>
          )}

          {hasSearches && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="searches">Include YouTube searches</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Off by default for your own data: searches can be more personal than views.
                </p>
              </div>
              <Switch
                id="searches"
                checked={o.includeSearches}
                onCheckedChange={(v) => onChange({ includeSearches: v })}
              />
            </div>
          )}

          <div className="border-t pt-6">
            <Button
              variant="destructive"
              className="w-full rounded-full"
              size="lg"
              onClick={onClear}
            >
              <Trash2 /> Clear my data
            </Button>
            <p className="text-muted-foreground mt-2 text-xs">
              Wipes everything from this tab. Nothing was ever saved anywhere else.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
