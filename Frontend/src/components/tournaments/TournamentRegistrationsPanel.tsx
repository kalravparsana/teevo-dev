import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, parseDateTimeLocal } from '@/lib/dates';
import { eligibleGroupsForHandicap, formatGroupLabel } from '@/lib/tournaments/groups';
import {
  registrationApprovalSchema,
  tournamentRegistrationSchema,
  formatZodErrors,
} from '@/lib/validation/schemas';
import type { Tournament, TournamentRegistration, User } from '@/types/entities';

function RegistrationRow({
  registration,
  tournament,
  player,
  clubHoleCount,
  canReview,
  onApprove,
  onReject,
}: {
  registration: TournamentRegistration;
  tournament: Tournament;
  player: User | undefined;
  clubHoleCount: number;
  canReview: boolean;
  onApprove: (input: { groupId: string; startingHole: number; teeTimeLocal: string }) => void;
  onReject: () => void;
}) {
  const [groupId, setGroupId] = useState(registration.groupId ?? tournament.groups[0]?.id ?? '');
  const [startingHole, setStartingHole] = useState('1');
  const [teeTimeLocal, setTeeTimeLocal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const group = tournament.groups.find((g) => g.id === registration.groupId);

  if (registration.status !== 'pending') {
    return (
      <li className="rounded-lg border border-sand-300/60 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-ink">{player?.name ?? 'Player'}</p>
            <p className="text-xs text-muted">
              Handicap {player?.handicap ?? '—'} · Requested {formatDateTime(registration.requestedAt)}
            </p>
            {group && <p className="mt-1 text-sm text-muted">{formatGroupLabel(group)}</p>}
            {registration.status === 'approved' && registration.teeTime && (
              <p className="mt-1 text-sm text-fairway-800">
                Hole {registration.startingHole} · Tee {formatDateTime(registration.teeTime)}
              </p>
            )}
          </div>
          <Badge status={registration.status} />
        </div>
      </li>
    );
  }

  if (!canReview) {
    return (
      <li className="rounded-lg border border-sand-300/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink">{player?.name ?? 'You'}</p>
            <p className="text-sm text-muted">
              {group ? formatGroupLabel(group) : 'Flight pending review'}
            </p>
          </div>
          <Badge status="pending" />
        </div>
      </li>
    );
  }

  const handleApprove = () => {
    const result = registrationApprovalSchema.safeParse({
      groupId,
      startingHole: parseInt(startingHole, 10),
      teeTimeLocal,
    });
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    setErrors({});
    onApprove(result.data);
  };

  return (
    <li className="rounded-lg border border-sand-300/60 bg-white px-4 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{player?.name ?? 'Player'}</p>
          <p className="text-xs text-muted">
            Handicap {player?.handicap ?? '—'} · Requested {group ? formatGroupLabel(group) : '—'}
          </p>
        </div>
        <Badge status="pending" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Flight"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          options={tournament.groups.map((g) => ({ value: g.id, label: formatGroupLabel(g) }))}
          error={errors.groupId}
        />
        <Input
          label="Starting hole"
          type="number"
          min={1}
          max={clubHoleCount}
          value={startingHole}
          onChange={(e) => setStartingHole(e.target.value)}
          error={errors.startingHole}
        />
        <Input
          label="Tee time"
          type="datetime-local"
          value={teeTimeLocal}
          onChange={(e) => setTeeTimeLocal(e.target.value)}
          error={errors.teeTimeLocal}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApprove}>
          Approve & assign
        </Button>
        <Button size="sm" variant="danger" onClick={onReject}>
          Reject
        </Button>
      </div>
    </li>
  );
}

export function TournamentRegistrationsPanel({
  tournament,
  clubHoleCount,
  canReview,
  currentUserId,
  isPlayer,
}: {
  tournament: Tournament;
  clubHoleCount: number;
  canReview: boolean;
  currentUserId: string;
  isPlayer: boolean;
}) {
  const { data, currentUser, registerForTournament, reviewRegistration } = useTeevo();
  const [groupId, setGroupId] = useState('');
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const registrations = data.tournamentRegistrations.filter((r) => r.tournamentId === tournament.id);
  const player = currentUser ?? undefined;
  const eligibleGroups = player && isPlayer
    ? eligibleGroupsForHandicap(tournament.groups, player.handicap)
    : tournament.groups;

  const myRegistration = isPlayer
    ? registrations.find((r) => r.playerId === currentUserId)
    : null;

  const canRegister =
    isPlayer &&
    !myRegistration &&
    (tournament.status === 'upcoming' || tournament.status === 'active') &&
    player?.clubId === tournament.clubId;

  const handleRegister = () => {
    const selectedGroupId = groupId || eligibleGroups[0]?.id || '';
    const result = tournamentRegistrationSchema.safeParse({
      tournamentId: tournament.id,
      groupId: selectedGroupId,
    });
    if (!result.success) {
      setRegisterErrors(formatZodErrors(result.error));
      return;
    }
    if (registerForTournament({ tournamentId: tournament.id, groupId: result.data.groupId })) {
      setRegisterErrors({});
    }
  };

  return (
    <Card>
      <CardHeader
        title="Registrations"
        description={
          canReview
            ? 'Review player requests and assign starting hole and tee slot'
            : 'Register to play in this tournament'
        }
      />
      {canRegister && (
        <div className="mb-4 space-y-3 rounded-lg border border-dashed border-sand-300 bg-fairway-50/50 p-4">
          <Select
            label="Your flight"
            value={groupId || eligibleGroups[0]?.id || ''}
            onChange={(e) => setGroupId(e.target.value)}
            options={eligibleGroups.map((g) => ({ value: g.id, label: formatGroupLabel(g) }))}
            error={registerErrors.groupId}
          />
          {player?.handicap !== null && player?.handicap !== undefined && (
            <p className="text-xs text-muted">Your handicap index: {player.handicap}</p>
          )}
          <Button onClick={handleRegister}>Request registration</Button>
        </div>
      )}
      {myRegistration && myRegistration.status === 'pending' && isPlayer && (
        <p className="mb-4 text-sm text-muted">
          Your registration is pending club admin approval. You will receive a starting hole and tee
          time once approved.
        </p>
      )}
      {registrations.length === 0 ? (
        <p className="text-sm text-muted">No registrations yet.</p>
      ) : (
        <ul className="space-y-3">
          {registrations.map((registration) => (
            <RegistrationRow
              key={registration.id}
              registration={registration}
              tournament={tournament}
              player={data.users.find((u) => u.id === registration.playerId)}
              clubHoleCount={clubHoleCount}
              canReview={canReview}
              onApprove={({ groupId: g, startingHole, teeTimeLocal }) => {
                reviewRegistration({
                  registrationId: registration.id,
                  decision: 'approved',
                  groupId: g,
                  startingHole,
                  teeTime: parseDateTimeLocal(teeTimeLocal),
                });
              }}
              onReject={() =>
                reviewRegistration({ registrationId: registration.id, decision: 'rejected' })
              }
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
