import { fetchLoginUrl } from '@/lib/api/teevoApi';
import { isApiMode } from '@/lib/api/config';

const STATE_KEY = 'teevo:oauth_state';

export async function redirectToCognitoLogin(): Promise<void> {
  if (!isApiMode) return;
  const { url, state } = await fetchLoginUrl();
  sessionStorage.setItem(STATE_KEY, state);
  window.location.assign(url);
}

export function consumeOAuthState(): string | null {
  const state = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return state;
}
