import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { loadConfig } from './config.js';

let client: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (!client) {
    const cfg = loadConfig();
    client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: cfg.region }), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return client;
}

export function entityKeys(type: string, id: string) {
  return { pk: `${type}#${id}`, sk: 'PROFILE' };
}

export function gsi1(type: string, id: string) {
  return { gsi1pk: `TYPE#${type}`, gsi1sk: id };
}

export function gsi2Email(email: string, userId: string) {
  return { gsi2pk: `EMAIL#${email.toLowerCase()}`, gsi2sk: `USER#${userId}` };
}
