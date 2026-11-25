import matter from 'gray-matter';
import { ReadingNote, BacklinkInfo } from '@/types/note';

export type PendingChangeType = 'create' | 'update' | 'delete';

export interface PendingChange {
  type: PendingChangeType;
  noteId: string;
  slug: string;
  title: string;
  filePath: string;
  markdown?: string;
  note?: ReadingNote;
  timestamp: number;
}

const STORAGE_KEY = 'personal_reading_pending_changes';
const CHANGE_EVENT = 'personal_reading_changes_updated';

export function getPendingChanges(): PendingChange[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingChange[];
  } catch (e) {
    console.error('Failed to parse pending changes from localStorage', e);
    return [];
  }
}

export function savePendingChange(change: PendingChange): void {
  if (typeof window === 'undefined') return;
  try {
    const changes = getPendingChanges();
    // Remove existing pending change for the same noteId if any
    const filtered = changes.filter((c) => c.noteId !== change.noteId);
    filtered.push(change);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifyChangesUpdated();
  } catch (e) {
    console.error('Failed to save pending change to localStorage', e);
  }
}

export function removePendingChange(noteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const changes = getPendingChanges();
    const filtered = changes.filter((c) => c.noteId !== noteId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifyChangesUpdated();
  } catch (e) {
    console.error('Failed to remove pending change from localStorage', e);
  }
}

export function clearPendingChanges(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyChangesUpdated();
  } catch (e) {
    console.error('Failed to clear pending changes from localStorage', e);
  }
}

export function deleteNoteLocally(noteId: string, slug: string, title: string): void {
  const filePath = `content/notes/${slug || noteId}.md`;
  savePendingChange({
    type: 'delete',
    noteId,
    slug: slug || noteId,
    title,
    filePath,
    timestamp: Date.now(),
  });
}

export function notifyChangesUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onPendingChangesUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

/**
 * Recomputes bidirectional backlinks across an array of ReadingNotes.
 */
export function recalculateBacklinks(notes: ReadingNote[]): ReadingNote[] {
  const backlinkMap: Record<string, BacklinkInfo[]> = {};

  notes.forEach((sourceNote) => {
    sourceNote.links?.forEach((link) => {
      if (!backlinkMap[link.id]) {
        backlinkMap[link.id] = [];
      }
      backlinkMap[link.id].push({
        sourceNoteId: sourceNote.id,
        sourceNoteTitle: sourceNote.title,
        sourceNoteTopic: sourceNote.topic,
        relationship: link.relationship,
      });
    });
  });

  return notes.map((note) => ({
    ...note,
    backlinks: backlinkMap[note.id] || [],
  }));
}

/**
 * Merges statically baked notes with any local pending additions, updates, and deletes.
 */
export function getMergedNotes(initialNotes: ReadingNote[]): ReadingNote[] {
  const pending = getPendingChanges();
  if (pending.length === 0) {
    return initialNotes;
  }

  const deleteIds = new Set(
    pending.filter((p) => p.type === 'delete').map((p) => p.noteId)
  );
  const updateMap = new Map<string, ReadingNote>();
  const newNotes: ReadingNote[] = [];

  pending.forEach((p) => {
    if (p.type === 'update' && p.note) {
      updateMap.set(p.noteId, p.note);
    } else if (p.type === 'create' && p.note) {
      // Check if note already existed in initial notes
      const existsInInitial = initialNotes.some((n) => n.id === p.noteId);
      if (existsInInitial) {
        updateMap.set(p.noteId, p.note);
      } else {
        newNotes.push(p.note);
      }
    }
  });

  // 1. Filter out deleted notes and replace updated notes
  const mergedInitial = initialNotes
    .filter((note) => !deleteIds.has(note.id))
    .map((note) => {
      if (updateMap.has(note.id)) {
        return updateMap.get(note.id)!;
      }
      return note;
    });

  // 2. Prepend newly created local notes
  const allMerged = [...newNotes, ...mergedInitial];

  // 3. Recompute backlinks
  return recalculateBacklinks(allMerged);
}
