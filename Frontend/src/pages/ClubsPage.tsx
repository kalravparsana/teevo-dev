import { Link } from 'react-router-dom';
import { Building2, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { Select } from '@/components/ui/Select';
import { getClubsPageDescription } from '@/lib/copy/clubsPage';
import { CLUB_HOLE_COUNT_OPTIONS, DEFAULT_CLUB_HOLE_COUNT, formatClubHoleCount, normalizeClubHoleCount } from '@/lib/clubs/holeCount';
import { canManageClubs, getAccessibleClubIds } from '@/lib/permissions';
import { clubCreateSchema, formatZodErrors } from '@/lib/validation/schemas';

const emptyForm = {
  name: '',
  location: '',
  logoUrl: null as string | null,
  holeCount: DEFAULT_CLUB_HOLE_COUNT,
  startTime: '07:00',
  endTime: '18:00',
  teeTimeInterval: 10,
};

export function ClubsPage() {
  const { data, currentUser, createClub } = useTeevo();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const clubIds = getAccessibleClubIds(
    currentUser,
    data.clubs.map((c) => c.id),
  );
  const clubs = data.clubs.filter((c) => clubIds.includes(c.id));
  const canAdd = canManageClubs(currentUser);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = clubCreateSchema.safeParse(form);
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    createClub(result.data);
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <div>
      <PageHeader
        title="Clubs"
        description={getClubsPageDescription(currentUser.role)}
        action={
          canAdd ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add club
            </Button>
          ) : undefined
        }
      />

      {clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clubs yet"
          description="Clubs will appear here once they are added to the platform."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link key={club.id} to={`/clubs/${club.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  <ClubLogo name={club.name} logoUrl={club.logoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold text-fairway-900">{club.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {club.location}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">
                  {formatClubHoleCount(club.holeCount)} · Hours {club.startTime} – {club.endTime} · Tee
                  slots every {club.teeTimeInterval} min
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="Add club">
        <form onSubmit={handleCreate} className="space-y-4">
          <ImageUpload
            label="Club logo"
            value={form.logoUrl}
            onChange={(logoUrl) => setForm({ ...form, logoUrl })}
            error={errors.logoUrl}
            required
          />
          <Input
            label="Club name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            error={errors.location}
            required
          />
          <Select
            label="Course holes"
            value={String(form.holeCount)}
            onChange={(e) => setForm({ ...form, holeCount: normalizeClubHoleCount(parseInt(e.target.value, 10)) })}
            options={CLUB_HOLE_COUNT_OPTIONS}
            error={errors.holeCount}
            required
          />
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">Create club</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
