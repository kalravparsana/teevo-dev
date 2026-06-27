import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  Calendar,
  MapPin,
  Target,
  Trophy,
  UserCog,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AppData } from '@/types/entities';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { TeamRoleCounts } from '@/components/dashboard/TeamRoleCounts';
import { formatDate, formatDateTime } from '@/lib/dates';
import { formatDashboardGreeting } from '@/lib/greetings';
import {
  DASHBOARD_ACTIVE_TOURNAMENTS_TITLE,
  getDashboardPageDescription,
} from '@/lib/copy/dashboardPage';
import {
  countTournamentsByStatus,
  countUsersByRole,
  getActiveTournaments,
  getClubSummaries,
  getPlatformActivity,
  getRecentScorecards,
  getUpcomingBookings,
  type PlatformActivityType,
} from '@/lib/dashboard/platformMetrics';

const STATUS_PIPELINE: { key: keyof ReturnType<typeof countTournamentsByStatus>; label: string }[] =
  [
    { key: 'draft', label: 'Draft' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

const ACTIVITY_ICONS: Record<PlatformActivityType, typeof Calendar> = {
  booking: Calendar,
  scorecard: Target,
  tournament: Trophy,
};

function PanelLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-fairway-700 transition-colors hover:text-fairway-900"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function QuickActionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-fairway-900 shadow-sm transition-colors hover:bg-fairway-50"
    >
      {children}
    </Link>
  );
}

export function SuperadminDashboard({
  data,
  userName,
}: {
  data: AppData;
  userName: string;
}) {
  const activeTournaments = getActiveTournaments(data.tournaments);
  const upcomingBookings = getUpcomingBookings(data.bookings);
  const tournamentCounts = countTournamentsByStatus(data.tournaments);
  const usersByRole = countUsersByRole(data.users);
  const clubSummaries = getClubSummaries(data);
  const recentScorecards = getRecentScorecards(data.scorecards);
  const platformActivity = getPlatformActivity(data);

  const primaryStats = [
    { label: 'Clubs', value: data.clubs.length, icon: Building2, to: '/clubs' },
    {
      label: DASHBOARD_ACTIVE_TOURNAMENTS_TITLE,
      value: activeTournaments.length,
      icon: Trophy,
      to: '/tournaments',
    },
    {
      label: 'Upcoming Bookings',
      value: upcomingBookings.length,
      icon: Calendar,
      to: '/clubs',
    },
    { label: 'Users', value: data.users.length, icon: Users, to: '/users' },
  ];

  const secondaryStats = [
    {
      label: 'All Tournaments',
      value: data.tournaments.length,
      icon: Trophy,
      to: '/tournaments',
    },
    {
      label: 'Scorecards',
      value: data.scorecards.length,
      icon: Target,
      to: '/tournaments',
    },
    {
      label: 'Club Admins',
      value: usersByRole.club_admin,
      icon: UserCog,
      to: '/users',
    },
    {
      label: 'Players',
      value: usersByRole.player,
      icon: Users,
      to: '/users',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={formatDashboardGreeting(userName)}
        description={getDashboardPageDescription('superadmin')}
      />

      <section aria-label="Key metrics">
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              to={stat.to}
            />
          ))}
        </div>
        <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              to={stat.to}
            />
          ))}
        </div>
      </section>

      <section aria-label="Quick actions" className="flex flex-wrap gap-3">
        <QuickActionLink to="/users">
          <Users className="h-4 w-4" aria-hidden />
          Manage users
        </QuickActionLink>
        <QuickActionLink to="/clubs">
          <Building2 className="h-4 w-4" aria-hidden />
          Browse clubs
        </QuickActionLink>
        <QuickActionLink to="/tournaments">
          <Trophy className="h-4 w-4" aria-hidden />
          All tournaments
        </QuickActionLink>
      </section>

      <section aria-label="Tournament pipeline">
        <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Tournament pipeline
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_PIPELINE.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-xl border border-sand-300/80 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-2xl font-semibold tabular-nums text-fairway-900">
                {tournamentCounts[key]}
              </p>
              <p className="text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <DashboardPanel
        title="Recent platform activity"
        icon={Activity}
        contentClassName="min-h-[12rem]"
      >
        <ul className="space-y-3">
          {platformActivity.map((item) => {
            const Icon = ACTIVITY_ICONS[item.type];
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-fairway-50/80"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fairway-100 text-fairway-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium leading-snug text-ink">{item.title}</p>
                    <p className="truncate text-xs leading-snug text-muted">{item.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge status={item.badge} />
                    <span className="text-xs text-muted">
                      {item.type === 'booking'
                        ? formatDateTime(item.timestamp)
                        : formatDate(item.timestamp)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </DashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel
          title={DASHBOARD_ACTIVE_TOURNAMENTS_TITLE}
          icon={Trophy}
          action={<PanelLink to="/tournaments" label="View all" />}
          contentClassName="min-h-[14rem]"
        >
          {activeTournaments.length === 0 ? (
            <p className="text-sm text-muted">No active tournaments scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {activeTournaments.slice(0, 5).map((t) => {
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
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge status={t.status} />
                        <span className="text-xs text-muted">
                          {formatDate(t.startsAt)} – {formatDate(t.endsAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Upcoming Bookings"
          icon={Calendar}
          action={<PanelLink to="/clubs" label="By club" />}
          contentClassName="min-h-[14rem]"
        >
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted">No upcoming tee times booked.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingBookings.slice(0, 5).map((b) => {
                const club = data.clubs.find((c) => c.id === b.clubId);
                const player = data.users.find((u) => u.id === b.playerId);
                const tournament = b.tournamentId
                  ? data.tournaments.find((t) => t.id === b.tournamentId)
                  : null;
                return (
                  <li key={b.id}>
                    <Link
                      to={`/clubs/${b.clubId}`}
                      className="block rounded-lg border border-sand-300/60 px-3 py-2.5 transition-colors hover:bg-fairway-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{player?.name ?? 'Player'}</p>
                          <p className="text-xs text-muted">{club?.name}</p>
                          {tournament && (
                            <p className="mt-0.5 truncate text-xs text-fairway-700">
                              {tournament.name}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted">
                          {formatDateTime(b.teeTime)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <DashboardPanel
          title="Clubs"
          icon={Building2}
          action={<PanelLink to="/clubs" label="View all" />}
          contentClassName="min-h-[16rem]"
        >
          <ul className="space-y-3">
            {data.clubs.map((club) => {
              const summary = clubSummaries.find((s) => s.clubId === club.id);
              return (
                <li key={club.id}>
                  <Link
                    to={`/clubs/${club.id}`}
                    className="block rounded-lg border border-sand-300/60 px-3 py-2.5 transition-colors hover:bg-fairway-50"
                  >
                    <p className="font-medium text-ink">{club.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {club.location}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {summary?.tournamentCount ?? 0} tournaments ·{' '}
                      {summary?.confirmedBookingCount ?? 0} bookings ·{' '}
                      {summary?.playerCount ?? 0} players
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </DashboardPanel>

        <DashboardPanel
          title="Team"
          icon={Users}
          action={<PanelLink to="/users" label="Manage" />}
          contentClassName="min-h-[16rem]"
        >
          <TeamRoleCounts counts={usersByRole} />
          <ul className="space-y-2">
            {data.users.map((user) => {
              const club = user.clubId
                ? data.clubs.find((c) => c.id === user.clubId)
                : null;
              return (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sand-300/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">
                      {club?.name ?? 'Platform'}
                    </p>
                  </div>
                  <Badge status={user.role} />
                </li>
              );
            })}
          </ul>
        </DashboardPanel>

        <DashboardPanel
          title="Recent Scorecards"
          icon={Target}
          contentClassName="min-h-[16rem]"
        >
          {recentScorecards.length === 0 ? (
            <p className="text-sm text-muted">No scorecards submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentScorecards.map((sc) => {
                const player = data.users.find((u) => u.id === sc.playerId);
                const tournament = data.tournaments.find((t) => t.id === sc.tournamentId);
                const club = data.clubs.find((c) => c.id === sc.clubId);
                return (
                  <li key={sc.id}>
                    <Link
                      to={`/tournaments/${sc.tournamentId}`}
                      className="block rounded-lg border border-sand-300/60 px-3 py-2.5 transition-colors hover:bg-fairway-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{player?.name}</p>
                          <p className="truncate text-xs text-muted">
                            {tournament?.name ?? club?.name}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-fairway-900">
                            {sc.totalScore}
                          </span>
                          <Badge status={sc.status} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(sc.roundDate)} · {club?.name}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
