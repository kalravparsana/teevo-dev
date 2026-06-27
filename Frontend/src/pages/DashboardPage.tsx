import { Link } from 'react-router-dom';
import { Building2, Calendar, Trophy } from 'lucide-react';
import { useTeevo } from '@/store/TeevoContext';
import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { SuperadminDashboard } from '@/components/dashboard/SuperadminDashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { getAccessibleClubIds } from '@/lib/permissions';
import { formatDate, formatDateTime } from '@/lib/dates';
import { formatDashboardGreeting } from '@/lib/greetings';
import {
  DASHBOARD_ACTIVE_TOURNAMENTS_TITLE,
  getDashboardPageDescription,
} from '@/lib/copy/dashboardPage';

export function DashboardPage() {
  const { data, currentUser } = useTeevo();
  if (!currentUser) return null;

  if (currentUser.role === 'superadmin') {
    return (
      <SuperadminDashboard
        data={data}
        userName={currentUser.name.split(' ')[0] ?? currentUser.name}
      />
    );
  }

  const clubIds = getAccessibleClubIds(
    currentUser,
    data.clubs.map((c) => c.id),
  );

  const myTournaments = data.tournaments.filter(
    (t) => clubIds.includes(t.clubId) && t.status !== 'cancelled' && t.status !== 'completed',
  );

  const myBookings =
    currentUser.role === 'player'
      ? data.bookings.filter((b) => b.playerId === currentUser.id && b.status === 'confirmed')
      : data.bookings.filter((b) => clubIds.includes(b.clubId) && b.status === 'confirmed');

  const stats = [
    {
      label: 'Clubs',
      value: clubIds.length,
      icon: Building2,
      to: '/clubs',
    },
    {
      label: DASHBOARD_ACTIVE_TOURNAMENTS_TITLE,
      value: myTournaments.length,
      icon: Trophy,
      to: '/tournaments',
    },
    {
      label: 'Upcoming Bookings',
      value: myBookings.length,
      icon: Calendar,
      to: '/bookings',
    },
  ];

  return (
    <div>
      <PageHeader
        title={formatDashboardGreeting(currentUser.name.split(' ')[0] ?? currentUser.name)}
        description={getDashboardPageDescription(currentUser.role)}
      />

      <div className="mb-8 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            to={stat.to}
          />
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-stretch">
        <DashboardPanel
          title={DASHBOARD_ACTIVE_TOURNAMENTS_TITLE}
          icon={Trophy}
          contentClassName="min-h-[14rem]"
        >
          {myTournaments.length === 0 ? (
            <p className="text-sm text-muted">No active tournaments scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {myTournaments.slice(0, 5).map((t) => {
                const club = data.clubs.find((c) => c.id === t.clubId);
                return (
                  <li key={t.id}>
                    <Link
                      to={`/tournaments/${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-sand-300/60 px-3 py-2.5 transition-colors hover:bg-fairway-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{t.name}</p>
                        <p className="truncate text-xs text-muted">{club?.name}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDate(t.startsAt)} – {formatDate(t.endsAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>

        {(currentUser.role === 'player' || currentUser.role === 'club_admin') && (
          <DashboardPanel
            title="Upcoming Bookings"
            icon={Calendar}
            contentClassName="min-h-[14rem]"
          >
            {myBookings.length === 0 ? (
              <p className="text-sm text-muted">No upcoming bookings.</p>
            ) : (
              <ul className="space-y-3">
                {myBookings.slice(0, 5).map((b) => {
                  const club = data.clubs.find((c) => c.id === b.clubId);
                  const player = data.users.find((u) => u.id === b.playerId);
                  return (
                    <li key={b.id}>
                      <Link
                        to="/bookings"
                        className="flex items-center justify-between gap-3 rounded-lg border border-sand-300/60 px-3 py-2.5 transition-colors hover:bg-fairway-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{club?.name}</p>
                          {currentUser.role === 'club_admin' && (
                            <p className="truncate text-xs text-muted">{player?.name}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted">
                          {formatDateTime(b.teeTime)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardPanel>
        )}
      </div>
    </div>
  );
}
