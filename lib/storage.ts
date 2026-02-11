'use client';

import { openDB } from 'idb';
import type { ImportedDataset, ColumnMapping, PriorityConfig } from './types';

const DB_NAME = 'journal-bord-db';
const DB_VERSION = 1;

const KEYS = {
  dataset: 'dataset',
  mapping: 'mapping',
  priorityConfig: 'priorityConfig'
} as const;

const defaultPriorityConfig: PriorityConfig = {
  P1: ['visibilite', 'visibilité', 'freins'],
  P2: ['electrique', 'électrique'],
  P3: ['confort']
};

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    }
  });
}

export async function saveDataset(dataset: ImportedDataset) {
  const db = await getDb();
  await db.put('settings', dataset, KEYS.dataset);
}

export async function loadDataset(): Promise<ImportedDataset | null> {
  const db = await getDb();
  return (await db.get('settings', KEYS.dataset)) ?? null;
}

export async function saveMapping(mapping: ColumnMapping) {
  const db = await getDb();
  await db.put('settings', mapping, KEYS.mapping);
}

export async function loadMapping(): Promise<ColumnMapping | null> {
  const db = await getDb();
  return (await db.get('settings', KEYS.mapping)) ?? null;
}

export async function savePriorityConfig(config: PriorityConfig) {
  const db = await getDb();
  await db.put('settings', config, KEYS.priorityConfig);
}

export async function loadPriorityConfig(): Promise<PriorityConfig> {
  const db = await getDb();
  return (await db.get('settings', KEYS.priorityConfig)) ?? defaultPriorityConfig;
}

export function getDefaultPriorityConfig() {
  return defaultPriorityConfig;
}
