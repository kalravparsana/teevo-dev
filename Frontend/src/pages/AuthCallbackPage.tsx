import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeAuthCode } from '@/lib/api/teevoApi';
import { consumeOAuthState } from '@/lib/auth/cognito';
import { setTokens } from '@/lib/auth/tokenStorage';
import { useTeevo } from '@/store/TeevoContext';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshData, setSessionUser } = useTeevo();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const expected = consumeOAuthState();

    if (!code) {
      setError('Sign-in was cancelled or incomplete.');
      return;
    }
    if (expected && state && expected !== state) {
      setError('Sign-in state mismatch. Please try again.');
      return;
    }

    void (async () => {
      try {
        const result = await exchangeAuthCode(code);
        setTokens(result.tokens.access_token, result.tokens.refresh_token);
        setSessionUser(result.user);
        await refreshData();
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      }
    })();
  }, [searchParams, navigate, refreshData, setSessionUser]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <p className="text-muted">Completing sign-in…</p>
    </div>
  );
}
