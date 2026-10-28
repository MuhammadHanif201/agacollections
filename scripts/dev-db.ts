/**
 * A throwaway local MongoDB replica set for development and testing (transactions need a
 * replica set, as on Atlas). Data is kept in .devdb/ between runs.
 *
 *   npm run dev:db        # then MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=testset
 */
import fs from 'node:fs';
import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function main() {
  const dbPath = path.resolve('.devdb');
  fs.mkdirSync(dbPath, { recursive: true });
  const rs = await MongoMemoryReplSet.create({
    replSet: { count: 1, name: 'testset', storageEngine: 'wiredTiger' },
    instanceOpts: [{ port: 27018, dbPath }],
  });
  console.log(`MongoDB replica set ready: ${rs.getUri()}`);
  console.log('Press Ctrl+C to stop.');
  const stop = async () => { await rs.stop({ doCleanup: false }); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e) => { console.error(e); process.exit(1); });
