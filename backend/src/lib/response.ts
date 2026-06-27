import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { AppError } from './errors.js';

export function json(
  statusCode: number,
  body: unknown,
  origin?: string,
  allowedOrigins: string[] = ['*'],
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: corsHeaders(origin, allowedOrigins),
    body: JSON.stringify(body),
  };
}

export function corsHeaders(origin: string | undefined, allowedOrigins: string[]) {
  const allowOrigin =
    allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))
      ? origin ?? allowedOrigins[0] ?? '*'
      : allowedOrigins[0] ?? '*';

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  };
}

export function handleError(
  err: unknown,
  origin: string | undefined,
  allowedOrigins: string[],
): APIGatewayProxyStructuredResultV2 {
  if (err instanceof AppError) {
    return json(err.statusCode, { error: { code: err.code, message: err.message } }, origin, allowedOrigins);
  }
  console.error(err);
  return json(500, { error: { code: 'INTERNAL', message: 'An unexpected error occurred' } }, origin, allowedOrigins);
}
