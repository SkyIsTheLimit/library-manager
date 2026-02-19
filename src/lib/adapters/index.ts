import { db } from '../db';
import { GenericAdapter } from './generic';
import { BookAdapter } from './types';

export async function getAllAdapters(): Promise<BookAdapter[]> {
  const customDefs = await db.adapters.toArray();
  return customDefs.map(def => new GenericAdapter(def));
}

export async function getAdapterForUrl(url: string): Promise<BookAdapter | null> {
  const adapters = await getAllAdapters();
  return adapters.find(a => a.matches(url)) || null;
}

export async function getAdapterById(id: string): Promise<BookAdapter | null> {
  const adapters = await getAllAdapters();
  return adapters.find(a => a.id === id) || null;
}

export * from './types';
