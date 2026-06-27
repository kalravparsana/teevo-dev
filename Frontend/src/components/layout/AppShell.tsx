import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Flag, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { getNavItemsForRole } from '@/lib/permissions';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function AppShell() {
  const { currentUser, logout, error, clearError } = useTeevo();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const navItems = getNavItemsForRole(currentUser.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-fairway-700 text-white'
        : 'text-fairway-100/80 hover:bg-fairway-800 hover:text-white',
    );

  const sidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-fairway-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500 text-fairway-950">
          <Flag className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <span className="font-display text-lg font-semibold text-white">Teevo</span>
          <p className="text-xs text-fairway-100/60">Tournament Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-fairway-800 p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium text-white">{currentUser.name}</p>
          <p className="truncate text-xs capitalize text-fairway-100/60">
            {currentUser.role.replace('_', ' ')}
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-fairway-100/80 hover:bg-fairway-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh grain">
      <aside className="hidden w-64 shrink-0 flex-col bg-fairway-900 lg:flex">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-fairway-950/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-64 flex-col bg-fairway-900 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-4 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-sand-300/80 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-fairway-800 hover:bg-fairway-50 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {error && (
            <div className="mb-4">
              <Alert message={error} onDismiss={clearError} />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
