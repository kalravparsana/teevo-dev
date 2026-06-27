import { ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAccessibleClubIds } from '@/lib/permissions';
import { formatDate } from '@/lib/dates';
import { getScorecardsPageDescription } from '@/lib/copy/scorecardsPage';
import { defaultHoleScores } from '@/lib/clubs/holeCount';

export function ScorecardsPage() {
  const { data, currentUser, saveScorecard } = useTeevo();
  const [modalOpen, setModalOpen] = useState(false);
  const [tournamentId, setTournamentId] = useState('');
  const [holeScores, setHoleScores] = useState<number[]>(() => defaultHoleScores());

  if (!currentUser) return null;

  const clubIds = getAccessibleClubIds(
    currentUser,
    data.clubs.map((c) => c.id),
  );

  const tournaments = data.tournaments.filter(
    (t) => clubIds.includes(t.clubId) && t.status !== 'cancelled',
  );

  const scorecards =
    currentUser.role === 'player'
      ? data.scorecards.filter((s) => s.playerId === currentUser.id)
      : data.scorecards.filter((s) => clubIds.includes(s.clubId));

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const selectedClub = selectedTournament
    ? data.clubs.find((c) => c.id === selectedTournament.clubId)
    : null;
  const activeHoleCount = selectedClub?.holeCount ?? holeScores.length;

  const total = holeScores.reduce((a, b) => a + b, 0);

  const handleTournamentChange = (nextTournamentId: string) => {
    setTournamentId(nextTournamentId);
    const tournament = tournaments.find((t) => t.id === nextTournamentId);
    const club = tournament ? data.clubs.find((c) => c.id === tournament.clubId) : null;
    setHoleScores(defaultHoleScores(club?.holeCount));
  };

  const handleSave = (status: 'draft' | 'submitted') => {
    if (!tournamentId) return;
    if (saveScorecard({ tournamentId, playerId: currentUser.id, holeScores, status })) {
      setModalOpen(false);
      setTournamentId('');
      setHoleScores(defaultHoleScores());
    }
  };

  const updateHole = (index: number, value: number) => {
    const next = [...holeScores];
    next[index] = Math.min(15, Math.max(1, value));
    setHoleScores(next);
  };

  return (
    <div>
      <PageHeader
        title="Scorecards"
        description={getScorecardsPageDescription(currentUser.role)}
        action={
          currentUser.role === 'player' ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Enter scorecard
            </Button>
          ) : undefined
        }
      />

      {scorecards.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No scorecards"
          description="Scorecards appear when players submit tournament rounds."
          action={
            currentUser.role === 'player' ? (
              <Button onClick={() => setModalOpen(true)}>Enter scorecard</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {scorecards.map((s) => {
            const tournament = data.tournaments.find((t) => t.id === s.tournamentId);
            const player = data.users.find((u) => u.id === s.playerId);
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-fairway-900">
                      {tournament?.name ?? 'Tournament'}
                    </h3>
                    <p className="text-sm text-muted">
                      {currentUser.role === 'club_admin' && `${player?.name} · `}
                      {formatDate(s.roundDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-fairway-900">
                      {s.totalScore}
                    </p>
                    <Badge status={s.status} />
                  </div>
                </div>
                {s.holeScores.length > 0 && (
                  <div className="mt-4 grid grid-cols-9 gap-1 text-center text-xs sm:grid-cols-18">
                    {s.holeScores.map((score, i) => (
                      <div
                        key={i}
                        className="rounded bg-fairway-50 px-1 py-1.5 tabular-nums"
                        title={`Hole ${i + 1}`}
                      >
                        <span className="block text-[10px] text-muted">{i + 1}</span>
                        <span className="font-medium">{score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enter scorecard" className="max-w-2xl">
        <div className="space-y-4">
          <Select
            label="Tournament"
            value={tournamentId}
            onChange={(e) => handleTournamentChange(e.target.value)}
            options={[
              { value: '', label: 'Select tournament…' },
              ...tournaments.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />

          <CardHeader
            title="Hole scores"
            description={
              tournamentId
                ? `Enter ${activeHoleCount} scores · Total: ${total}`
                : 'Select a tournament to load the course hole count'
            }
          />

          <div
            className={
              activeHoleCount <= 9
                ? 'grid grid-cols-3 gap-2 sm:grid-cols-9'
                : activeHoleCount <= 18
                  ? 'grid grid-cols-6 gap-2 sm:grid-cols-9'
                  : 'grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12'
            }
          >
            {holeScores.map((score, i) => (
              <label key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted">H{i + 1}</span>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={score}
                  onChange={(e) => updateHole(i, parseInt(e.target.value, 10) || 4)}
                  className="w-full rounded border border-sand-300 px-2 py-1 text-center text-sm tabular-nums"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => handleSave('draft')} disabled={!tournamentId}>
              Save draft
            </Button>
            <Button onClick={() => handleSave('submitted')} disabled={!tournamentId}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
