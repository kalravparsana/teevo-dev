export const useLocalData = import.meta.env.VITE_USE_LOCAL_DATA === 'true';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const isApiMode = !useLocalData && apiBaseUrl.length > 0;

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  region: import.meta.env.VITE_COGNITO_REGION ?? 'us-east-1',
  domain: import.meta.env.VITE_COGNITO_DOMAIN ?? '',
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI ?? `${window.location.origin}/auth/callback`,
};
