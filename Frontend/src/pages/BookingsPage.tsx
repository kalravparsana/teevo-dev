import { Calendar, Plus } from 'lucide-react';
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
import { getAccessibleClubIds } from '@/lib/permissions';
import { bookingSchema, formatZodErrors } from '@/lib/validation/schemas';
import { generateTeeTimeSlots, getBookedTimesForDate, teeTimeToIso } from '@/lib/teeTimes';
import { formatDateTime } from '@/lib/dates';
import { getBookingsPageDescription } from '@/lib/copy/bookingsPage';
import { hasActiveBookingBlock, isCasualBookingBlocked } from '@/lib/tournaments/bookingBlock';

export function BookingsPage() {
  const { data, currentUser, createBooking, updateBookingStatus } = useTeevo();
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clubId: '',
    tournamentId: '',
    date: today,
    time: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const clubIds = getAccessibleClubIds(
    currentUser,
    data.clubs.map((c) => c.id),
  );
  const clubs = data.clubs.filter((c) => clubIds.includes(c.id));

  const bookings =
    currentUser.role === 'player'
      ? data.bookings.filter((b) => b.playerId === currentUser.id)
      : data.bookings.filter((b) => clubIds.includes(b.clubId));

  const selectedClub = data.clubs.find((c) => c.id === form.clubId);
  const availableSlots = selectedClub ? generateTeeTimeSlots(selectedClub) : [];
  const bookedTimes = selectedClub
    ? getBookedTimesForDate(data.bookings, selectedClub.id, form.date)
    : new Set<string>();

  const freeSlots = availableSlots.filter((t) => !bookedTimes.has(t));

  const clubHasBlock =
    form.clubId && hasActiveBookingBlock(data.tournaments, form.clubId);

  const casualBlocked =
    form.clubId &&
    form.date &&
    form.time &&
    !form.tournamentId &&
    isCasualBookingBlocked(
      data.tournaments,
      form.clubId,
      teeTimeToIso(form.date, form.time),
    );

  const clubTournaments = data.tournaments.filter(
    (t) =>
      t.clubId === form.clubId &&
      t.status !== 'cancelled' &&
      t.status !== 'completed',
  );

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const result = bookingSchema.safeParse({
      ...form,
      tournamentId: form.tournamentId || null,
    });
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    const playerId =
      currentUser.role === 'player'
        ? currentUser.id
        : data.users.find((u) => u.role === 'player' && u.clubId === form.clubId)?.id;
    if (!playerId && currentUser.role === 'club_admin') {
      setErrors({ _form: 'No player assigned to this club' });
      return;
    }
    if (
      createBooking({
        playerId: playerId ?? currentUser.id,
        clubId: result.data.clubId,
        tournamentId: result.data.tournamentId,
        date: result.data.date,
        time: result.data.time,
      })
    ) {
      setModalOpen(false);
      setErrors({});
    }
  };

  return (
    <div>
      <PageHeader
        title="Bookings"
        description={getBookingsPageDescription(currentUser.role)}
        action={
          <Button
            onClick={() => {
              setForm({
                clubId: clubs[0]?.id ?? '',
                tournamentId: '',
                date: today,
                time: '',
              });
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New booking
          </Button>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings"
          description="Book a tee time to get on the course."
          action={
            <Button onClick={() => setModalOpen(true)}>Book a round</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings
            .sort((a, b) => new Date(b.teeTime).getTime() - new Date(a.teeTime).getTime())
            .map((b) => {
              const club = data.clubs.find((c) => c.id === b.clubId);
              const player = data.users.find((u) => u.id === b.playerId);
              const tournament = b.tournamentId
                ? data.tournaments.find((t) => t.id === b.tournamentId)
                : null;
              return (
                <Card key={b.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{club?.name}</p>
                    <p className="text-sm text-muted">{formatDateTime(b.teeTime)}</p>
                    {currentUser.role === 'club_admin' && (
                      <p className="text-xs text-muted">Player: {player?.name}</p>
                    )}
                    {tournament && (
                      <p className="text-xs text-fairway-700">{tournament.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={b.status} />
                    {b.status === 'confirmed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateBookingStatus(b.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book a round">
        <form onSubmit={handleBook} className="space-y-4">
          <Select
            label="Club"
            value={form.clubId}
            onChange={(e) =>
              setForm({ ...form, clubId: e.target.value, tournamentId: '', time: '' })
            }
            options={[
              { value: '', label: 'Select club…' },
              ...clubs.map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={errors.clubId}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            min={today}
            onChange={(e) => setForm({ ...form, date: e.target.value, time: '' })}
            error={errors.date}
          />
          <Select
            label="Tee time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            options={[
              { value: '', label: 'Select time…' },
              ...freeSlots.map((t) => ({ value: t, label: t })),
            ]}
            error={errors.time}
          />
          {clubTournaments.length > 0 && (
            <Select
              label="Tournament (optional)"
              value={form.tournamentId}
              onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
              options={[
                { value: '', label: 'Casual round' },
                ...clubTournaments.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          )}
          {clubHasBlock && !form.tournamentId && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              A tournament is blocking casual bookings at this club during part of the schedule.
              Book a tournament tee time or choose another club.
            </p>
          )}
          {casualBlocked && (
            <p className="text-sm text-red-600" role="alert">
              Casual bookings are paused during{' '}
              <span className="font-medium">{casualBlocked.name}</span> for this date and time.
            </p>
          )}
          {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={Boolean(casualBlocked)}>
              Confirm booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
