'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import FolderStack from '@/components/FolderStack';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';
import { getMergedNotes, onPendingChangesUpdated, getPendingChanges } from '@/lib/localStore';
import { buildTopicColorMap } from '@/lib/topicColor';

interface TopicsViewClientProps {
  initialNotes: ReadingNote[];
}

export default function TopicsViewClient({ initialNotes }: TopicsViewClientProps) {
  const [notes, setNotes] = useState<ReadingNote[]>(initialNotes);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ReadingNote | null>(null);

  const initialNoteIds = useMemo(() => new Set(initialNotes.map((n) => n.id)), [initialNotes]);

  useEffect(() => {
    const updateLocalState = () => {
      setNotes(getMergedNotes(initialNotes));
      setPendingIds(new Set(getPendingChanges().map((p) => p.noteId)));
    };
    updateLocalState();
    const unsubscribe = onPendingChangesUpdated(updateLocalState);
    return () => unsubscribe();
  }, [initialNotes]);

  const colorMap = useMemo(() => buildTopicColorMap(notes.map((n) => n.topic || 'General')), [notes]);
  const topicCount = Object.keys(colorMap).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar
        onOpenNewNote={() => {
          setEditingNote(null);
          setIsEditorOpen(true);
        }}
      />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex-1">
        <section className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="display-title text-5xl sm:text-7xl">Topics</h1>
          <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed">
            {topicCount} {topicCount === 1 ? 'folder' : 'folders'}, {notes.length} readings. Every folder is open here;
            pick any tab to read that note.
          </p>
        </section>

        <FolderStack
          notes={notes}
          colorMap={colorMap}
          pendingIds={pendingIds}
          initialNoteIds={initialNoteIds}
          onEdit={(note) => {
            setEditingNote(note);
            setIsEditorOpen(true);
          }}
          openAll
        />
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>Personal Reading Notes &amp; Knowledge Graph · Built with Next.js, GitHub Pages &amp; GitHub Actions</p>
      </footer>

      <NoteEditorModal
        isOpen={isEditorOpen}
        note={editingNote}
        allAvailableNotes={notes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
      />
    </div>
  );
}
