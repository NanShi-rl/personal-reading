'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Network, ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';
import Navbar from '@/components/Navbar';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';

interface GraphViewClientProps {
  notes: ReadingNote[];
}

export default function GraphViewClient({ notes }: GraphViewClientProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const topics = Array.from(new Set(notes.map((n) => n.topic)));

  const filteredNotes = selectedTopic === 'All' ? notes : notes.filter((n) => n.topic === selectedTopic);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Zettelkasten Graph & Connections</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Knowledge Linkages Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Explore how reading notes build upon, contrast, and inspire one another across domains.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTopic('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTopic === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Clusters ({notes.length})
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTopic === t
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Connections Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => {
            const hasLinks = (note.links && note.links.length > 0) || (note.backlinks && note.backlinks.length > 0);

            return (
              <div
                key={note.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {note.topic}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{note.status}</span>
                </div>

                <div>
                  <Link
                    href={`/notes/${note.slug}/`}
                    className="text-lg font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors block"
                  >
                    {note.title}
                  </Link>
                  {note.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{note.summary}</p>
                  )}
                </div>

                {/* Link details */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Outbound */}
                  {note.links && note.links.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Outbound Links ({note.links.length}):
                      </span>
                      <div className="space-y-1.5">
                        {note.links.map((link, idx) => {
                          const target = notes.find((n) => n.id === link.id);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                            >
                              <Link
                                href={`/notes/${target?.slug || link.id}/`}
                                className="font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate max-w-[200px]"
                              >
                                {target?.title || link.id}
                              </Link>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                                {link.relationship}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inbound */}
                  {note.backlinks && note.backlinks.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Inbound Backlinks ({note.backlinks.length}):
                      </span>
                      <div className="space-y-1.5">
                        {note.backlinks.map((backlink, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20"
                          >
                            <Link
                              href={`/notes/${backlink.sourceNoteId}/`}
                              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[200px]"
                            >
                              {backlink.sourceNoteTitle}
                            </Link>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {backlink.relationship}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasLinks && (
                    <p className="text-xs text-slate-400 italic">No connections recorded yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Personal Reading Notes & Knowledge Graph · Built with Next.js, GitHub Pages & GitHub Actions</p>
      </footer>

      <NoteEditorModal
        isOpen={isEditorOpen}
        allAvailableNotes={notes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
