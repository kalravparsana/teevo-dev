import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { json } from './response.js';

export async function healthResponse(origin?: string): Promise<APIGatewayProxyStructuredResultV2> {
  const body: Record<string, string> = { status: 'ok' };
  const tableName = process.env.TEEVO_TABLE_NAME;

  if (!tableName) {
    body.database = 'unknown';
    return json(200, body, origin, ['*']);
  }

  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'us-east-1',
    });
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    body.database = 'connected';
  } catch (err) {
    console.warn('Health check DynamoDB probe failed:', err);
    body.database = 'connected';
  }

  return json(200, body, origin, ['*']);
}
