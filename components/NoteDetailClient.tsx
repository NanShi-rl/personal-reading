'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  Network,
  Tag,
  Star,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';
import { deleteNoteWithCascadeCleanup, getStoredGitHubToken } from '@/lib/github';

interface NoteDetailClientProps {
  note: ReadingNote;
  allNotes: ReadingNote[];
}

export default function NoteDetailClient({ note, allNotes }: NoteDetailClientProps) {
  const router = useRouter();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status badges
  const statusConfig = {
    unread: { label: 'Unread', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    reading: { label: 'Currently Reading', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
    abandoned: { label: 'Abandoned', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  };

  const relationshipLabels: Record<string, string> = {
    extends: 'Extends / Builds upon',
    contrasts: 'Contrasts with',
    inspires: 'Inspires',
    references: 'References',
    foundational_for: 'Foundational for',
    related_to: 'Related to',
  };

  // Find linked note titles
  const outboundLinks = (note.links || []).map((link) => {
    const target = allNotes.find((n) => n.id === link.id);
    return {
      ...link,
      targetTitle: target?.title || link.id,
      targetTopic: target?.topic || 'General',
      targetSlug: target?.slug || link.id,
    };
  });

  const handleDeleteNote = async () => {
    const token = getStoredGitHubToken();
    if (!token) {
      setDeleteError('Please set your GitHub Personal Access Token in the top-right Settings modal first.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteNoteWithCascadeCleanup(note.id, note.slug, allNotes);

    setIsDeleting(false);
    if (result.success) {
      setShowDeleteConfirm(false);
      router.push('/');
    } else {
      setDeleteError(result.error || 'Failed to delete note.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Back Link & Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold transition-all shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Note</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-semibold transition-all shadow-sm"
              title="Delete this note and remove all linkages to it"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Note</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Reading Note?</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Deleting <strong>&ldquo;{note.title}&rdquo;</strong> will delete its file from your GitHub repository and automatically <strong>clean up any references or linkages to this note</strong> from other notes.
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteNote}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {isDeleting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'Deleting & Cleaning Links...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note Header Card */}
        <header className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80">
                {note.topic}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {note.type}
              </span>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[note.status]?.color}`}>
              {statusConfig[note.status]?.label || note.status}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {note.title}
            </h1>

            {/* Sources list */}
            {note.sources && note.sources.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Sources ({note.sources.length}):
                </span>
                <div className="flex flex-col gap-1.5">
                  {note.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                      {src.title && src.title !== '-' && src.title !== note.title && (
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {src.title}
                        </span>
                      )}
                      {src.author && (
                        <span>
                          by <strong className="text-slate-700 dark:text-slate-200">{src.author}</strong>
                          {src.published_year ? ` (${src.published_year})` : ''}
                        </span>
                      )}
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline text-xs"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating & Timeline */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            {note.rating && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rating:</span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (note.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              {note.date_started && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Started: {note.date_started}</span>
                </div>
              )}
              {note.date_finished && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Finished: {note.date_finished}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Executive Summary Callout */}
        {note.summary && (
          <section className="p-5 sm:p-6 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/40 text-slate-800 dark:text-slate-200 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Executive Summary
            </h2>
            <p className="text-sm sm:text-base leading-relaxed italic">{note.summary}</p>
          </section>
        )}

        {/* Key Takeaways */}
        {note.key_takeaways && note.key_takeaways.length > 0 && (
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Core Takeaways
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {note.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Personal Notes & Content */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
        </section>

        {/* Linked Readings (Knowledge Graph / Zettelkasten) */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-brand-500" />
            <span>Connected Readings & Knowledge Network</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outbound Links */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Outbound References ({outboundLinks.length})</span>
              </h3>

              {outboundLinks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No outbound links defined for this note.</p>
              ) : (
                <div className="space-y-2.5">
                  {outboundLinks.map((link, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/notes/${link.targetSlug}/`}
                          className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {link.targetTitle}
                        </Link>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                          {relationshipLabels[link.relationship] || link.relationship}
                        </span>
                      </div>
                      {link.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          &ldquo;{link.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbound Backlinks */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inbound Backlinks ({(note.backlinks || []).length})</span>
              </h3>

              {(note.backlinks || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No other notes link back to this reading yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {note.backlinks?.map((backlink, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/notes/${backlink.sourceNoteId}/`}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {backlink.sourceNoteTitle}
                        </Link>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {relationshipLabels[backlink.relationship] || backlink.relationship}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Topic: {backlink.sourceNoteTopic}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <section className="flex items-center gap-2 flex-wrap pt-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Personal Reading Notes & Knowledge Graph · Built with Next.js, GitHub Pages & GitHub Actions</p>
      </footer>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        note={note}
        allAvailableNotes={allNotes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
