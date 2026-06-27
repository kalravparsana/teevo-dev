export function loadConfig() {
  const region = process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'us-east-1';
  return {
    region,
    tableName: required('TEEVO_TABLE_NAME'),
    uploadsBucket: required('UPLOADS_BUCKET_NAME'),
    cognitoUserPoolId: required('COGNITO_USER_POOL_ID'),
    cognitoClientId: required('COGNITO_CLIENT_ID'),
    cognitoRegion: process.env.COGNITO_REGION ?? region,
    cognitoDomain: required('COGNITO_DOMAIN'),
    oauthRedirectUri: required('OAUTH_REDIRECT_URI'),
    jwtIssuer:
      process.env.JWT_ISSUER ??
      `https://cognito-idp.${process.env.COGNITO_REGION ?? region}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
