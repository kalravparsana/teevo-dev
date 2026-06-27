import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useTeevo } from '@/store/TeevoContext';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { isApiMode } from '@/lib/api/config';
import { redirectToCognitoLogin } from '@/lib/auth/cognito';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export function LoginPage() {
  const { login, error, clearError, currentUser } = useTeevo();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (login(email.trim())) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-dvh grain">
      <div className="hidden w-1/2 flex-col justify-between bg-fairway-900 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 text-fairway-950">
            <Flag className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-semibold text-white">Teevo</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white">
            Run tournaments.
            <br />
            <span className="text-gold-400">Book tee times.</span>
            <br />
            Track every round.
          </h1>
          <p className="mt-4 max-w-md text-fairway-100/70">
            The all-in-one platform for golf clubs, tournament directors, and players.
          </p>
        </div>
        <p className="text-sm text-fairway-100/40">© Teevo Golf Management</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fairway-700 text-white">
              <Flag className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-fairway-900">Sign in to Teevo</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="font-display text-2xl font-semibold text-fairway-900">Welcome back</h2>
            <p className="mt-1 text-muted">Sign in with your account email</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert message={error} onDismiss={clearError} />
            </div>
          )}

          {isApiMode ? (
            <div className="space-y-4">
              <Button
                type="button"
                className="w-full"
                onClick={() => void redirectToCognitoLogin()}
              >
                Sign in with Cognito
              </Button>
              <p className="text-center text-xs text-muted">
                You will be redirected to the secure Cognito hosted sign-in page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@club.teevo.app"
                required
                autoComplete="email"
              />
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          )}

          {!isApiMode && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              Demo accounts
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    clearError();
                    if (login(account.email)) navigate('/dashboard');
                  }}
                  className="rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-left text-sm transition-colors hover:border-fairway-600 hover:bg-fairway-50"
                >
                  <span className="font-medium text-ink">{account.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
