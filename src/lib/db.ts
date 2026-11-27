import 'server-only';
import mongoose from 'mongoose';
import { env } from './env';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// One connection per server instance, reused across requests and hot reloads
const g = globalThis as unknown as { __zqMongoose?: Cache };
const cache: Cache = g.__zqMongoose ?? (g.__zqMongoose = { conn: null, promise: null });

export async function connectDb(): Promise<typeof mongoose> {
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  if (cache.conn && state === 1) return cache.conn;
  // Reconnecting on its own: wait for it rather than failing the request (commands are not buffered)
  if (cache.conn && state === 2) {
    await mongoose.connection.asPromise();
    return cache.conn;
  }
  // A connection that dropped (Atlas refused new connections while overloaded on 2026-11-27 and one server
  // instance kept answering 500 afterwards) is opened again instead of being reused
  if (cache.conn) { cache.conn = null; cache.promise = null; }
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongodbUri, {
        dbName: env.mongodbDb || undefined,
        bufferCommands: false,
        // the free Atlas cluster allows 500 connections in all; each server instance keeps a few,
        // and closes the ones it has not used for a minute
        maxPoolSize: 5,
        maxIdleTimeMS: 60_000,
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
