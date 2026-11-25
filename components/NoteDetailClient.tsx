'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Edit3,
  Trash2,
  Network,
  Tag,
  Star,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';
import { getMergedNotes, deleteNoteLocally, getPendingChanges, onPendingChangesUpdated } from '@/lib/localStore';
import { buildTopicColorMap } from '@/lib/topicColor';

interface NoteDetailClientProps {
  note: ReadingNote;
  allNotes: ReadingNote[];
}

const STATUS_LABELS: Record<string, string> = {
  unread: 'Unread',
  reading: 'Currently reading',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  extends: 'Extends / Builds upon',
  contrasts: 'Contrasts with',
  inspires: 'Inspires',
  references: 'References',
  foundational_for: 'Foundational for',
  related_to: 'Related to',
};

export default function NoteDetailClient({ note: initialNote, allNotes: initialAllNotes }: NoteDetailClientProps) {
  const router = useRouter();
  const [allNotes, setAllNotes] = useState<ReadingNote[]>(initialAllNotes);
  const [currentNote, setCurrentNote] = useState<ReadingNote>(initialNote);
  const [isLocallyModified, setIsLocallyModified] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const updateLocalState = () => {
      const merged = getMergedNotes(initialAllNotes);
      setAllNotes(merged);
      const found = merged.find((n) => n.id === initialNote.id || n.slug === initialNote.slug);
      if (found) {
        setCurrentNote(found);
      }
      const pending = getPendingChanges();
      setIsLocallyModified(pending.some((p) => p.noteId === initialNote.id));
    };

    updateLocalState();
    const unsubscribe = onPendingChangesUpdated(updateLocalState);
    return () => unsubscribe();
  }, [initialNote, initialAllNotes]);

  const colorMap = useMemo(() => buildTopicColorMap(allNotes.map((n) => n.topic || 'General')), [allNotes]);
  const color = colorMap[currentNote.topic || 'General'] || { bg: '#1e4bd7', ink: '#ffffff' };
  const siblings = allNotes.filter((n) => n.topic === currentNote.topic);

  const outboundLinks = (currentNote.links || []).map((link) => {
    const target = allNotes.find((n) => n.id === link.id);
    return {
      ...link,
      targetTitle: target?.title || link.id,
      targetTopic: target?.topic || 'General',
      targetSlug: target?.slug || link.id,
    };
  });

  const handleDeleteNote = () => {
    deleteNoteLocally(currentNote.id, currentNote.slug, currentNote.title);
    setShowDeleteConfirm(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Back link & actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All notes</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 text-xs font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mosby-red/60 text-rose-300 hover:bg-mosby-red/20 text-xs font-medium transition-colors"
              title="Delete this note and remove all linkages to it"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg bg-slate-900 border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Delete reading note?</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Deleting <strong>&ldquo;{currentNote.title}&rdquo;</strong> will remove it locally and stage it for
                deletion. When you commit from the front page, its file will be removed from your GitHub repository.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-mosby-red hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local uncommitted changes banner */}
        {isLocallyModified && (
          <div className="px-4 py-3 rounded-lg bg-mosby-yellow text-black flex items-center justify-between gap-3 text-xs">
            <span>
              <strong>Staged locally:</strong> this note has uncommitted changes. Commit from the front page to deploy.
            </span>
            <Link
              href="/"
              className="px-3 py-1 rounded-lg bg-black text-white font-medium shrink-0 hover:bg-slate-800 transition-colors"
            >
              Go to notes
            </Link>
          </div>
        )}

        {/* Folder: sibling tabs + coloured header panel */}
        <header>
          <div className="flex items-end gap-1 overflow-x-auto no-scrollbar pt-2 px-1">
            {siblings.map((n) => {
              const isCurrent = n.id === currentNote.id;
              return (
                <Link
                  key={n.id}
                  href={`/notes/${n.slug}/`}
                  title={n.title}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`folder-tab shrink-0 max-w-[14rem] h-10 flex items-center text-sm font-semibold whitespace-nowrap transition-opacity ${
                    isCurrent ? 'opacity-100' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{ background: color.bg, color: color.ink }}
                >
                  <span className="truncate">{n.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-5" style={{ background: color.bg, color: color.ink }}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider">
              <span className="font-semibold">{currentNote.topic}</span>
              <span className="opacity-80">
                {currentNote.type} · {STATUS_LABELS[currentNote.status] || currentNote.status}
                {isLocallyModified ? ' · Uncommitted' : ''}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">{currentNote.title}</h1>

            {currentNote.sources && currentNote.sources.length > 0 && (
              <ul className="space-y-1 text-sm">
                {currentNote.sources.map((src, idx) => (
                  <li key={idx} className="flex flex-wrap items-center gap-2">
                    {src.title && src.title !== '-' && src.title !== currentNote.title && (
                      <span className="font-semibold">{src.title}</span>
                    )}
                    {src.author && (
                      <span className="opacity-90">
                        {src.author}
                        {src.published_year ? ` (${src.published_year})` : ''}
                      </span>
                    )}
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline underline-offset-4"
                      >
                        Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {currentNote.summary && <p className="text-sm sm:text-base leading-relaxed max-w-2xl">{currentNote.summary}</p>}

            <div
              className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t text-xs"
              style={{ borderTopColor: color.ink === '#000000' ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.3)' }}
            >
              {currentNote.rating ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < (currentNote.rating || 0) ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                </div>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-4 opacity-90">
                {currentNote.date_started && <span>Started {currentNote.date_started}</span>}
                {currentNote.date_finished && <span>Finished {currentNote.date_finished}</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Key takeaways */}
        {currentNote.key_takeaways && currentNote.key_takeaways.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core takeaways</h2>
            <ol className="space-y-2 text-sm text-slate-200">
              {currentNote.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3 py-2 border-b border-white/10">
                  <span className="font-semibold text-white">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Main content */}
        <section className="p-6 sm:p-8 rounded-lg bg-slate-900 border border-white/10">
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentNote.content}</ReactMarkdown>
          </div>
        </section>

        {/* Connected readings */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Connected readings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg bg-slate-900 border border-white/10 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Outbound ({outboundLinks.length})
              </h3>

              {outboundLinks.length === 0 ? (
                <p className="text-xs text-slate-500">No outbound links.</p>
              ) : (
                <div className="space-y-2.5">
                  {outboundLinks.map((link, idx) => {
                    const c = colorMap[link.targetTopic];
                    return (
                      <div key={idx} className="pl-3 border-l-4" style={{ borderColor: c?.bg || color.bg }}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <Link href={`/notes/${link.targetSlug}/`} className="font-semibold text-white hover:underline">
                            {link.targetTitle}
                          </Link>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                            {RELATIONSHIP_LABELS[link.relationship] || link.relationship}
                          </span>
                        </div>
                        {link.notes && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{link.notes}&rdquo;</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 rounded-lg bg-slate-900 border border-white/10 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                Inbound backlinks ({(currentNote.backlinks || []).length})
              </h3>

              {(currentNote.backlinks || []).length === 0 ? (
                <p className="text-xs text-slate-500">No other notes link back here yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {currentNote.backlinks?.map((backlink, idx) => {
                    const c = colorMap[backlink.sourceNoteTopic];
                    return (
                      <div key={idx} className="pl-3 border-l-4" style={{ borderColor: c?.bg || color.bg }}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <Link
                            href={`/notes/${backlink.sourceNoteId}/`}
                            className="font-semibold text-white hover:underline"
                          >
                            {backlink.sourceNoteTitle}
                          </Link>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                            {RELATIONSHIP_LABELS[backlink.relationship] || backlink.relationship}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">{backlink.sourceNoteTopic}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tags */}
        {currentNote.tags && currentNote.tags.length > 0 && (
          <section className="flex items-center gap-2 flex-wrap pt-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {currentNote.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-lg text-xs border border-white/15 text-slate-300">
                #{tag}
              </span>
            ))}
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>Personal Reading Notes &amp; Knowledge Graph · Built with Next.js, GitHub Pages &amp; GitHub Actions</p>
      </footer>

      <NoteEditorModal
        isOpen={isEditorOpen}
        note={currentNote}
        allAvailableNotes={allNotes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
