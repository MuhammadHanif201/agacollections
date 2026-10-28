import 'server-only';
import mongoose from 'mongoose';
import { env } from './env';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// One connection per server instance, reused across requests and hot reloads
const g = globalThis as unknown as { __zqMongoose?: Cache };
const cache: Cache = g.__zqMongoose ?? (g.__zqMongoose = { conn: null, promise: null });

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongodbUri, {
        dbName: env.mongodbDb || undefined,
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((err) => {
        cache.promise = null; // let the next request try again
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
