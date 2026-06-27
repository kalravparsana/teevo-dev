import { Plus, Trash2 } from 'lucide-react';
import { createId } from '@/lib/id';
import { Input } from '@/components/ui/Input';
import type { TournamentGroup } from '@/types/entities';

export function TournamentGroupEditor({
  groups,
  onChange,
  errors,
}: {
  groups: TournamentGroup[];
  onChange: (groups: TournamentGroup[]) => void;
  errors?: Record<string, string>;
}) {
  const updateGroup = (index: number, patch: Partial<TournamentGroup>) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const removeGroup = (index: number) => {
    if (groups.length <= 1) return;
    onChange(groups.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    onChange([
      ...groups,
      { id: createId(), name: 'New flight', minHandicap: null, maxHandicap: null },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">Flights / groups</span>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1 text-sm font-medium text-fairway-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fairway-500/30"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add group
        </button>
      </div>
      <p className="text-xs text-muted">
        Group players by handicap range. Leave min or max blank for open-ended flights.
      </p>
      {groups.map((group, index) => (
        <div
          key={group.id}
          className="rounded-lg border border-sand-300/70 bg-fairway-50/40 p-3 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <Input
              label={`Group ${index + 1} name`}
              value={group.name}
              onChange={(e) => updateGroup(index, { name: e.target.value })}
              error={errors?.[`groups.${index}.name`]}
              required
            />
            <button
              type="button"
              onClick={() => removeGroup(index)}
              disabled={groups.length <= 1}
              aria-label={`Remove ${group.name}`}
              className="mt-7 rounded p-1.5 text-muted hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fairway-500/30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min handicap"
              type="number"
              min={0}
              max={54}
              value={group.minHandicap ?? ''}
              onChange={(e) =>
                updateGroup(index, {
                  minHandicap: e.target.value === '' ? null : parseInt(e.target.value, 10),
                })
              }
              placeholder="Any"
            />
            <Input
              label="Max handicap"
              type="number"
              min={0}
              max={54}
              value={group.maxHandicap ?? ''}
              onChange={(e) =>
                updateGroup(index, {
                  maxHandicap: e.target.value === '' ? null : parseInt(e.target.value, 10),
                })
              }
              placeholder="Any"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
