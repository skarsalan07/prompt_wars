import { MongoClient, type Db } from "mongodb";

import { getDatabaseEnv } from "@/lib/server/env";

declare global {
  // eslint-disable-next-line no-var
  var __cookingAssistantMongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __cookingAssistantMongoIndexesReady: Promise<void> | undefined;
}

export async function getMongoDatabase(): Promise<Db> {
  const env = getDatabaseEnv();
  const clientPromise =
    globalThis.__cookingAssistantMongoClientPromise ??
    new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
    }).connect();

  globalThis.__cookingAssistantMongoClientPromise = clientPromise;
  const client = await clientPromise;
  const database = client.db(env.MONGODB_DB_NAME);

  const indexPromise =
    globalThis.__cookingAssistantMongoIndexesReady ??
    Promise.all([
      database.collection("profiles").createIndex({ ownerId: 1 }, { unique: true }),
      database.collection("plans").createIndex({ ownerId: 1, createdAt: -1 }),
    ]).then(() => undefined);

  globalThis.__cookingAssistantMongoIndexesReady = indexPromise;
  await indexPromise;

  return database;
}
