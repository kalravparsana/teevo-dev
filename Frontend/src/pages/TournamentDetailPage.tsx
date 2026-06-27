import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Medal } from 'lucide-react';
import { useTeevo } from '@/store/TeevoContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TournamentRegistrationsPanel } from '@/components/tournaments/TournamentRegistrationsPanel';
import { canManageTournaments } from '@/lib/permissions';
import { formatDateRange } from '@/lib/dates';
import { formatTournamentType } from '@/lib/tournaments/constants';
import { formatGroupLabel } from '@/lib/tournaments/groups';

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { data, currentUser } = useTeevo();

  const tournament = data.tournaments.find((t) => t.id === tournamentId);
  if (!tournament || !currentUser) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">Tournament not found.</p>
        <Link to="/tournaments" className="mt-4 inline-block text-fairway-700 hover:underline">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const club = data.clubs.find((c) => c.id === tournament.clubId);
  const canReview = canManageTournaments(currentUser, tournament.clubId);
  const isPlayer = currentUser.role === 'player';

  const scorecards = data.scorecards
    .filter((s) => s.tournamentId === tournament.id && s.status === 'submitted')
    .sort((a, b) => a.totalScore - b.totalScore);

  const leaderboard = scorecards.map((s, index) => {
    const player = data.users.find((u) => u.id === s.playerId);
    return { rank: index + 1, player, scorecard: s };
  });

  return (
    <div>
      <Link
        to="/tournaments"
        className="mb-4 inline-flex items-center gap-1 text-sm text-fairway-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All tournaments
      </Link>

      <PageHeader
        title={tournament.name}
        description={`${club?.name} · ${formatTournamentType(tournament.type)} · ${formatDateRange(tournament.startsAt, tournament.endsAt)}`}
        action={<Badge status={tournament.status} />}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Event details" description="Schedule, flights, and booking rules" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Schedule</dt>
              <dd className="text-right font-medium">{formatDateRange(tournament.startsAt, tournament.endsAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Casual bookings</dt>
              <dd className="font-medium">
                {tournament.blockOtherBookings ? 'Paused during event' : 'Allowed'}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-muted">Flights</dt>
              <dd className="space-y-1">
                {tournament.groups.map((g) => (
                  <p key={g.id} className="rounded bg-fairway-50 px-2 py-1 text-sm">
                    {formatGroupLabel(g)}
                  </p>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        <TournamentRegistrationsPanel
          tournament={tournament}
          clubHoleCount={club?.holeCount ?? 18}
          canReview={canReview}
          currentUserId={currentUser.id}
          isPlayer={isPlayer}
        />
      </div>

      <Card>
        <CardHeader
          title="Leaderboard"
          description="Tournament standings from submitted scorecards"
        />
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted">No scorecards submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 text-left text-muted">
                  <th className="pb-2 pr-4 font-medium">Rank</th>
                  <th className="pb-2 pr-4 font-medium">Player</th>
                  <th className="pb-2 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(({ rank, player, scorecard }) => (
                  <tr key={scorecard.id} className="border-b border-sand-300/50">
                    <td className="py-3 pr-4">
                      {rank <= 3 ? (
                        <Medal
                          className={`h-4 w-4 ${
                            rank === 1
                              ? 'text-gold-500'
                              : rank === 2
                                ? 'text-sand-300'
                                : 'text-amber-700'
                          }`}
                        />
                      ) : (
                        <span className="text-muted">{rank}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-medium">{player?.name ?? 'Unknown'}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">
                      {scorecard.totalScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
