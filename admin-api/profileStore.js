import fs from 'node:fs/promises';
import path from 'node:path';
import { JSONFilePreset } from 'lowdb/node';

const dataPath = process.env.FIS_DATA_PATH || '/data/course-profiles.json';
let databasePromise;
let writeQueue = Promise.resolve();

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      return JSONFilePreset(dataPath, { profiles: {} });
    })();
  }
  return databasePromise;
}

export async function getCourseProfile(sub) {
  const database = await getDatabase();
  await database.read();
  return database.data.profiles[sub] || null;
}

export function saveCourseProfile(sub, profile) {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const database = await getDatabase();
    await database.read();
    database.data.profiles[sub] = {
      identity: { sub },
      profile: { ...profile, updatedAt: new Date().toISOString() },
    };
    await database.write();
    return database.data.profiles[sub];
  });
  return writeQueue;
}

export function deleteCourseProfile(sub) {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const database = await getDatabase();
    await database.read();
    const existed = Boolean(database.data.profiles[sub]);
    delete database.data.profiles[sub];
    await database.write();
    return existed;
  });
  return writeQueue;
}
