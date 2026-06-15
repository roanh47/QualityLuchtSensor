import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

let db = null;

export async function openDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sensor_data.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        pm25 REAL,
        pm10 REAL,
        temp REAL,
        nox REAL
      );
      CREATE INDEX IF NOT EXISTS idx_ts ON readings(ts);
    `);
  }
  return db;
}

export async function insertReading(data) {
  const d = await openDB();
  await d.runAsync(
    'INSERT INTO readings (ts, pm25, pm10, temp, nox) VALUES (?, ?, ?, ?, ?)',
    Date.now(),
    data.pm25 ?? null,
    data.pm10 ?? null,
    data.temp ?? null,
    data.nox ?? null
  );
  await maybeCleanup();
}

export async function getReadings(fromTs, toTs) {
  const d = await openDB();
  return await d.getAllAsync(
    'SELECT * FROM readings WHERE ts >= ? AND ts <= ? ORDER BY ts ASC',
    fromTs,
    toTs
  );
}

export async function getOldestTs() {
  const d = await openDB();
  const row = await d.getFirstAsync('SELECT MIN(ts) as ts FROM readings');
  return row?.ts ?? Date.now();
}

async function maybeCleanup() {
  const d = await openDB();
  const row = await d.getFirstAsync(
    "SELECT (page_count * page_size) / 1024 / 1024 as mb FROM pragma_page_count, pragma_page_size"
  );
  if (row && row.mb > 2900) {
    const cutoff = Date.now() - 86400000;
    await d.runAsync('DELETE FROM readings WHERE ts < ?', cutoff);
    await d.runAsync('VACUUM');
  }
}

export async function exportCSV(fromTs, toTs) {
  const rows = await getReadings(fromTs, toTs);
  const header = 'timestamp,pm25,pm10,temp,nox';
  const lines = rows.map(r =>
    [r.ts, r.pm25 ?? '', r.pm10 ?? '', r.temp ?? '', r.nox ?? ''].join(',')
  );
  const csv = [header, ...lines].join('\n');
  const path = FileSystem.cacheDirectory + 'sensor_export.csv';
  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, { mimeType: 'text/csv' });
}

export const METRIC_RANGES = {
  pm25: { min: 0, max: 200, label: 'PM2.5 (µg/m³)' },
  pm10: { min: 0, max: 400, label: 'PM10 (µg/m³)' },
  temp: { min: -10, max: 50, label: 'Temperatuur (°C)' },
  nox:  { min: 0, max: 200000, label: 'NOx (ticks)' },
};

export function validateReading(data) {
  const issues = [];
  if (data.pm25 != null && (data.pm25 < METRIC_RANGES.pm25.min || data.pm25 > METRIC_RANGES.pm25.max))
    issues.push(`PM2.5 (${data.pm25}) buiten bereik ${METRIC_RANGES.pm25.min}-${METRIC_RANGES.pm25.max}`);
  if (data.pm10 != null && (data.pm10 < METRIC_RANGES.pm10.min || data.pm10 > METRIC_RANGES.pm10.max))
    issues.push(`PM10 (${data.pm10}) buiten bereik ${METRIC_RANGES.pm10.min}-${METRIC_RANGES.pm10.max}`);
  if (data.temp != null && (data.temp < METRIC_RANGES.temp.min || data.temp > METRIC_RANGES.temp.max))
    issues.push(`Temperatuur (${data.temp}) buiten bereik ${METRIC_RANGES.temp.min}-${METRIC_RANGES.temp.max}`);
  if (data.nox != null && (data.nox < METRIC_RANGES.nox.min || data.nox > METRIC_RANGES.nox.max))
    issues.push(`NOx (${data.nox}) buiten bereik ${METRIC_RANGES.nox.min}-${METRIC_RANGES.nox.max}`);
  return issues;
}
