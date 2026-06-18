import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const HISTORY_PREFIX = '@history_';
const MAX_HISTORY_DAYS = 30; // bewaar max 30 dagen

// Genereer CSV string van meetpunten
export function pointsToCSV(points) {
  if (!points || points.length === 0) return '';
  const header = 'Datum,Tijd,PM2.5 (ug/m3),PM10 (ug/m3),Temp (C),NOx (ticks)';
  const rows = points.map(p => {
    const d = p.ts ? new Date(p.ts) : null;
    const datum = d ? d.toLocaleDateString('nl-NL') : '';
    const tijd = p.label || '';
    return `${datum},${tijd},${p.pm25 ?? ''},${p.pm10 ?? ''},${p.temp ?? ''},${p.nox ?? ''}`;
  });
  return header + '\n' + rows.join('\n');
}

// Maak CSV-bestand aan en deel het via het deel-menu
export async function shareCSV(points) {
  if (!points || points.length === 0) return;
  const csv = pointsToCSV(points);
  const now = new Date();
  const fileName = `QualityLuchtSensor_${now.toISOString().slice(0, 10)}.csv`;
  const cacheDir = FileSystem.cacheDirectory || '';
  const filePath = cacheDir + fileName;

  try {
    // Zorg dat de cache-map bestaat
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Exporteren', 'Delen wordt niet ondersteund op dit apparaat.');
      return;
    }

    // Deel het bestand. Probeer eerst het file:// URI direct; op sommige Android-versies
    // werkt dit beter dan een content-URI, op andere juist niet. Vang beide af.
    try {
      await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Deel meetgegevens' });
    } catch (directErr) {
      // Fallback naar content-URI als direct delen faalt
      try {
        const contentUri = await FileSystem.getContentUriAsync(filePath);
        await Sharing.shareAsync(contentUri, { mimeType: 'text/csv', dialogTitle: 'Deel meetgegevens' });
      } catch (contentErr) {
        throw new Error(`Direct: ${directErr?.message || directErr}; Content URI: ${contentErr?.message || contentErr}`);
      }
    }
  } catch (e) {
    Alert.alert('Export mislukt', e?.message || 'Probeer het opnieuw.');
  }
}

// Sla een meetpunt op voor een bepaalde dag
export async function saveDataPoint(sensorData) {
  if (!sensorData) return;
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10); // "2026-06-04"
  const storageKey = HISTORY_PREFIX + dateKey;

  try {
    const existing = await AsyncStorage.getItem(storageKey);
    const points = existing ? JSON.parse(existing) : [];

    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');

    points.push({
      pm25: sensorData.pm25 ?? 0,
      pm10: sensorData.pm10 ?? 0,
      temp: sensorData.temp ?? 0,
      nox: sensorData.nox ?? 0,
      label: h + ':' + m,
      ts: now.getTime(),
    });

    await AsyncStorage.setItem(storageKey, JSON.stringify(points));
  } catch (e) {
    // stil falen — opslag is nice-to-have
  }
}

// Laad alle punten voor een specifieke dag
async function loadDay(dateStr) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_PREFIX + dateStr);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Laad geschiedenis van de afgelopen N dagen (standaard 7)
export async function loadHistory(days = 7) {
  const allPoints = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayPoints = await loadDay(dateKey);
    allPoints.push(...dayPoints);
  }

  return allPoints;
}

// Verwijder geschiedenis ouder dan MAX_HISTORY_DAYS
export async function cleanupOldHistory() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const historyKeys = keys.filter(k => k.startsWith(HISTORY_PREFIX));
    const now = new Date();

    const keysToRemove = historyKeys.filter(k => {
      const dateStr = k.replace(HISTORY_PREFIX, '');
      const d = new Date(dateStr);
      const diffMs = now.getTime() - d.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays > MAX_HISTORY_DAYS;
    });

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    // stil falen
  }
}
