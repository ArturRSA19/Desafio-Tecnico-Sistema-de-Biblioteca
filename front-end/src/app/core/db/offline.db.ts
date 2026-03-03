import Dexie, { type Table } from 'dexie';

export interface SyncQueueEntry {
  id?: number;
  url: string;
  method: 'POST' | 'PUT';
  body: unknown;
  timestamp: number;
}

export class BibliotecaOfflineDB extends Dexie {
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super('BibliotecaOfflineDB');

    this.version(1).stores({
      syncQueue: '++id, timestamp',
    });
  }
}

export const offlineDb = new BibliotecaOfflineDB();
