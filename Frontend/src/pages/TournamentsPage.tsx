import { Link } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TournamentGroupEditor } from '@/components/tournaments/TournamentGroupEditor';
import { getAccessibleClubIds } from '@/lib/permissions';
import { tournamentSchema, formatZodErrors } from '@/lib/validation/schemas';
import { getTournamentsPageDescription } from '@/lib/copy/tournamentsPage';
import { formatDateRange, parseDateTimeLocal, toDateTimeLocalValue } from '@/lib/dates';
import { createDefaultGroups } from '@/lib/tournaments/normalize';
import { TOURNAMENT_TYPE_OPTIONS, formatTournamentType } from '@/lib/tournaments/constants';
import type { TournamentGroup, TournamentStatus, TournamentType } from '@/types/entities';

const defaultStarts = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(7, 0, 0, 0);
  return toDateTimeLocalValue(d.toISOString());
};

const defaultEnds = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(18, 0, 0, 0);
  return toDateTimeLocalValue(d.toISOString());
};

const emptyForm = {
  name: '',
  clubId: '',
  type: 'stroke_play' as TournamentType,
  groups: createDefaultGroups(),
  startsAtLocal: defaultStarts(),
  endsAtLocal: defaultEnds(),
  status: 'upcoming' as TournamentStatus,
  blockOtherBookings: true,
};

export function TournamentsPage() {
  const { data, currentUser, createTournament, deleteTournament } = useTeevo();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const clubIds = getAccessibleClubIds(
    currentUser,
    data.clubs.map((c) => c.id),
  );
  const clubs = data.clubs.filter((c) => clubIds.includes(c.id));
  const tournaments = data.tournaments.filter((t) => clubIds.includes(t.clubId));
  const canManage = currentUser.role === 'superadmin' || currentUser.role === 'club_admin';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      clubId: form.clubId,
      type: form.type,
      groups: form.groups,
      startsAt: parseDateTimeLocal(form.startsAtLocal),
      endsAt: parseDateTimeLocal(form.endsAtLocal),
      status: form.status,
      blockOtherBookings: form.blockOtherBookings,
    };
    const result = tournamentSchema.safeParse(payload);
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    if (createTournament(result.data)) {
      setModalOpen(false);
      setForm({ ...emptyForm, clubId: clubs[0]?.id ?? '', groups: createDefaultGroups() });
      setErrors({});
    }
  };

  const openModal = () => {
    setForm({
      ...emptyForm,
      clubId: clubs[0]?.id ?? '',
      groups: createDefaultGroups(),
      startsAtLocal: defaultStarts(),
      endsAtLocal: defaultEnds(),
    });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Tournaments"
        description={getTournamentsPageDescription(currentUser.role)}
        action={
          canManage ? (
            <Button onClick={openModal}>
              <Plus className="h-4 w-4" />
              Add tournament
            </Button>
          ) : undefined
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments"
          description="Tournaments will appear here when scheduled at your clubs."
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const club = data.clubs.find((c) => c.id === t.clubId);
            const pendingCount = data.tournamentRegistrations.filter(
              (r) => r.tournamentId === t.id && r.status === 'pending',
            ).length;
            return (
              <Card key={t.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="font-display text-lg font-semibold text-fairway-900 hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {club?.name} · {formatTournamentType(t.type)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatDateRange(t.startsAt, t.endsAt)}</p>
                  {t.blockOtherBookings && (
                    <p className="mt-1 text-xs text-amber-800">Casual bookings paused during event</p>
                  )}
                  {pendingCount > 0 && canManage && (
                    <p className="mt-1 text-xs font-medium text-fairway-800">
                      {pendingCount} registration{pendingCount === 1 ? '' : 's'} awaiting review
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={t.status} />
                  {canManage && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this tournament?')) deleteTournament(t.id);
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add tournament" className="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Tournament name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Club"
              value={form.clubId}
              onChange={(e) => setForm({ ...form, clubId: e.target.value })}
              options={clubs.map((c) => ({ value: c.id, label: c.name }))}
              error={errors.clubId}
            />
            <Select
              label="Format"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TournamentType })}
              options={TOURNAMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              error={errors.type}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Starts"
              type="datetime-local"
              value={form.startsAtLocal}
              onChange={(e) => setForm({ ...form, startsAtLocal: e.target.value })}
              error={errors.startsAt}
            />
            <Input
              label="Ends"
              type="datetime-local"
              value={form.endsAtLocal}
              onChange={(e) => setForm({ ...form, endsAtLocal: e.target.value })}
              error={errors.endsAt}
            />
          </div>
          <TournamentGroupEditor
            groups={form.groups}
            onChange={(groups: TournamentGroup[]) => setForm({ ...form, groups })}
            errors={errors}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-sand-300/70 bg-fairway-50/40 p-3">
            <input
              type="checkbox"
              checked={form.blockOtherBookings}
              onChange={(e) => setForm({ ...form, blockOtherBookings: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-sand-300 text-fairway-700 focus:ring-fairway-500/30"
            />
            <span className="text-sm">
              <span className="font-medium text-ink">Block casual bookings</span>
              <span className="mt-0.5 block text-muted">
                Prevent non-tournament tee times while this event is active
              </span>
            </span>
          </label>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TournamentStatus })}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create tournament</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
