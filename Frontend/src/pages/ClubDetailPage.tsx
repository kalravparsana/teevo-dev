import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { canConfigureClub, canManageClubs } from '@/lib/permissions';
import { clubSchema, formatZodErrors } from '@/lib/validation/schemas';
import { CLUB_HOLE_COUNT_OPTIONS, formatClubHoleCount } from '@/lib/clubs/holeCount';
import { formatDate } from '@/lib/dates';

export function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { data, currentUser, updateClub, joinClub } = useTeevo();
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const club = data.clubs.find((c) => c.id === clubId);
  const [form, setForm] = useState(club);

  if (!club || !currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Club not found.</p>
        <Link to="/clubs" className="mt-4 inline-block text-fairway-700 hover:underline">
          Back to clubs
        </Link>
      </div>
    );
  }

  const canEdit = canConfigureClub(currentUser, club.id);
  const canEditHoles = canManageClubs(currentUser);
  const isPlayer = currentUser.role === 'player';
  const isMember = currentUser.clubId === club.id;
  const clubTournaments = data.tournaments.filter((t) => t.clubId === club.id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const result = clubSchema.safeParse(form);
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    updateClub(club.id, result.data);
    setEditing(false);
    setErrors({});
  };

  const display = editing && form ? form : club;

  return (
    <div>
      <Link
        to="/clubs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-fairway-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All clubs
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <ClubLogo name={club.name} logoUrl={club.logoUrl} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-fairway-900">
              {club.name}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted">{club.location}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isPlayer && !isMember && (
            <Button onClick={() => joinClub(club.id)}>
              <UserPlus className="h-4 w-4" />
              Join club
            </Button>
          )}
          {canEdit && !editing && (
            <Button variant="secondary" onClick={() => { setForm({ ...club }); setEditing(true); }}>
              Edit settings
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Club configuration" description="Course layout, hours, and tee time slots" />
          {editing && form ? (
            <form onSubmit={handleSave} className="space-y-4">
              <ImageUpload
                label="Club logo"
                value={form.logoUrl}
                onChange={(logoUrl) => setForm({ ...form, logoUrl })}
                error={errors.logoUrl}
              />
              {canEditHoles && (
                <Select
                  label="Course holes"
                  value={String(form.holeCount)}
                  onChange={(e) => setForm({ ...form, holeCount: parseInt(e.target.value, 10) })}
                  options={CLUB_HOLE_COUNT_OPTIONS}
                  error={errors.holeCount}
                  required
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Opens"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  error={errors.startTime}
                />
                <Input
                  label="Closes"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  error={errors.endTime}
                />
              </div>
              <Input
                label="Tee time interval (minutes)"
                type="number"
                min={5}
                max={60}
                value={form.teeTimeInterval}
                onChange={(e) =>
                  setForm({ ...form, teeTimeInterval: parseInt(e.target.value, 10) || 10 })
                }
                error={errors.teeTimeInterval}
              />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Logo</dt>
                <dd>
                  <ClubLogo name={display.name} logoUrl={display.logoUrl} size="sm" />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Course</dt>
                <dd className="font-medium">{formatClubHoleCount(display.holeCount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Hours</dt>
                <dd className="font-medium">
                  {display.startTime} – {display.endTime}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tee interval</dt>
                <dd className="font-medium">Every {display.teeTimeInterval} minutes</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Tournaments"
            description="Events hosted at this club"
            action={
              canEdit ? (
                <Link to="/tournaments">
                  <Button size="sm" variant="secondary">
                    Manage
                  </Button>
                </Link>
              ) : undefined
            }
          />
          {clubTournaments.length === 0 ? (
            <p className="text-sm text-muted">No tournaments scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {clubTournaments.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="flex items-center justify-between rounded-lg border border-sand-300/60 px-3 py-2 hover:bg-fairway-50"
                  >
                    <span className="font-medium">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge status={t.status} />
                      <span className="text-xs text-muted">{formatDate(t.startsAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
