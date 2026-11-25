'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, GitCommit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import FolderStack from '@/components/FolderStack';
import NoteEditorModal from '@/components/NoteEditorModal';
import CommitModal from '@/components/CommitModal';
import { ReadingNote } from '@/types/note';
import { getMergedNotes, getPendingChanges, onPendingChangesUpdated, PendingChange } from '@/lib/localStore';
import { buildTopicColorMap } from '@/lib/topicColor';

interface DashboardClientProps {
  initialNotes: ReadingNote[];
  topics: { topic: string; count: number }[];
  tags: { tag: string; count: number }[];
}

export default function DashboardClient({ initialNotes }: DashboardClientProps) {
  const [notes, setNotes] = useState<ReadingNote[]>(initialNotes);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ReadingNote | null>(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  const initialNoteIds = useMemo(() => new Set(initialNotes.map((n) => n.id)), [initialNotes]);

  // Synchronize with local storage on mount & on changes
  useEffect(() => {
    const updateLocalState = () => {
      setNotes(getMergedNotes(initialNotes));
      setPendingChanges(getPendingChanges());
    };

    updateLocalState();
    const unsubscribe = onPendingChangesUpdated(updateLocalState);
    return () => unsubscribe();
  }, [initialNotes]);

  const pendingIds = useMemo(() => new Set(pendingChanges.map((p) => p.noteId)), [pendingChanges]);

  // Colours are derived from ALL topics so a topic keeps its colour while filtering
  const colorMap = useMemo(() => buildTopicColorMap(notes.map((n) => n.topic || 'General')), [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const matchesSearch =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.summary.toLowerCase().includes(q) ||
        note.sources?.some((s) => s.author?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q)) ||
        note.topic.toLowerCase().includes(q) ||
        note.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesStatus = selectedStatus === 'All' || note.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [notes, searchQuery, selectedStatus]);

  const stats = useMemo(
    () => [
      { label: 'Readings', value: notes.length },
      { label: 'In progress', value: notes.filter((n) => n.status === 'reading').length },
      { label: 'Finished', value: notes.filter((n) => n.status === 'completed').length },
      { label: 'Links', value: notes.reduce((acc, n) => acc + (n.links?.length || 0), 0) },
    ],
    [notes]
  );

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: ReadingNote) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const isFiltering = searchQuery !== '' || selectedStatus !== 'All';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar onOpenNewNote={handleOpenNewNote} onOpenCommit={() => setIsCommitModalOpen(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="display-title text-5xl sm:text-7xl">Reading Garden</h1>
          <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed">
            A personal library of reading notes. Each folder is a topic; each tab is a reading.
            Open a folder to browse it, or pick a tab to read the note.
          </p>

          <dl className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-semibold text-white">{s.value}</dd>
                <span className="text-slate-400">{s.label}</span>
              </div>
            ))}
          </dl>
        </section>

        {/* Pending commit notice */}
        {pendingChanges.length > 0 && (
          <section className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg bg-mosby-yellow text-black px-5 py-3">
            <p className="text-sm font-medium">
              {pendingChanges.length} local update{pendingChanges.length > 1 ? 's' : ''} saved in your browser, not yet on GitHub.
            </p>
            <button
              type="button"
              onClick={() => setIsCommitModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            >
              <GitCommit className="w-4 h-4" />
              Commit &amp; build
            </button>
          </section>
        )}

        {/* Search & status filters */}
        <section className="mt-10 mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, authors, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/15 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white"
            />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto text-sm">
            {['All', 'reading', 'completed', 'unread'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`capitalize whitespace-nowrap pb-1 border-b-2 transition-colors ${
                  selectedStatus === status
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* Folder stack */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 rounded-lg border border-dashed border-white/15">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="font-semibold text-white">No notes match your filters</h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
              }}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-medium border border-white/20 text-slate-200 hover:bg-white/10"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <FolderStack
            notes={filteredNotes}
            colorMap={colorMap}
            pendingIds={pendingIds}
            initialNoteIds={initialNoteIds}
            onEdit={handleEditNote}
            openAll={isFiltering}
          />
        )}
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

      <CommitModal isOpen={isCommitModalOpen} onClose={() => setIsCommitModalOpen(false)} />
    </div>
  );
}
