import { DATA_VERSION, STORAGE_KEYS } from "../data/courses";
import type { QuizHistory, StoredStats, VersionedData } from "../types";
import { createDefaultStats } from "./progression";

export type AppSettings = {
  soundEnabled: boolean;
};

const defaultSettings: AppSettings = {
  soundEnabled: true,
};

const readVersioned = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as VersionedData<T>;
    if (parsed.version !== DATA_VERSION) {
      return fallback;
    }
    return parsed.data;
  } catch {
    return fallback;
  }
};

const writeVersioned = <T,>(key: string, data: T): void => {
  const payload: VersionedData<T> = {
    version: DATA_VERSION,
    data,
  };
  localStorage.setItem(key, JSON.stringify(payload));
};

export const loadHistory = (): QuizHistory[] => readVersioned(STORAGE_KEYS.history, []);

export const saveHistory = (history: QuizHistory[]): void => {
  writeVersioned(STORAGE_KEYS.history, limitHistory(history));
};

export const loadStats = (): StoredStats => readVersioned(STORAGE_KEYS.stats, createDefaultStats());

export const saveStats = (stats: StoredStats): void => {
  writeVersioned(STORAGE_KEYS.stats, stats);
};

export const loadSettings = (): AppSettings =>
  readVersioned(STORAGE_KEYS.settings, defaultSettings);

export const saveSettings = (settings: AppSettings): void => {
  writeVersioned(STORAGE_KEYS.settings, settings);
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

export const limitHistory = (history: QuizHistory[]): QuizHistory[] => history.slice(0, 10);
