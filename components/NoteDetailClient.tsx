'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink, Edit3, Trash2, Star, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote } from '@/types/note';
import { getMergedNotes, deleteNoteLocally, getPendingChanges, onPendingChangesUpdated } from '@/lib/localStore';
import { buildTopicColorMap } from '@/lib/topicColor';
import { FOLDER_CURTAIN_KEY, FOLDER_OVERLAY_ID, openWithFolderTransition } from '@/lib/folderTransition';

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
  extends: 'Extends / builds upon',
  contrasts: 'Contrasts with',
  inspires: 'Inspires',
  references: 'References',
  foundational_for: 'Foundational for',
  related_to: 'Related to',
};

// Sticky-note colours and tilts for the scrapbook (takeaways)
const STICKY = [
  { bg: '#f2a7b5', ink: '#100f0a', rot: -1.2 },
  { bg: '#ffe927', ink: '#000000', rot: 0.9 },
  { bg: '#d71e1e', ink: '#ffffff', rot: -0.6 },
  { bg: '#a9c0f5', ink: '#100f0a', rot: 1.4 },
];

/** Title split per character; each character rises out of a mask (staggered). */
function HeroTitle({ text }: { text: string }) {
  let n = 0;
  return (
    <h1
      aria-label={text}
      className="text-[clamp(2.5rem,7.5vw,7rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-mosby-paper break-words"
      style={{ ['--hero-delay' as string]: '0.35s' }}
    >
      {text.split(' ').map((word, wi) => (
        <span
          key={wi}
          aria-hidden="true"
          className="inline-block whitespace-nowrap overflow-hidden align-top pb-[0.12em] -mb-[0.12em] mr-[0.22em]"
        >
          {Array.from(word).map((ch, ci) => (
            <span
              key={ci}
              className="char-rise inline-block"
              style={{ ['--char-delay' as string]: `${Math.min(n++ * 0.018, 0.9)}s` }}
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

function Paperclip({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 64"
      width="22"
      height="58"
      fill="none"
      stroke="#77736a"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 18 V46 a6 6 0 0 1 -12 0 V14 a9 9 0 0 1 18 0 V50 a11 11 0 0 1 -22 0 V22" />
    </svg>
  );
}

export default function NoteDetailClient({ note: initialNote, allNotes: initialAllNotes }: NoteDetailClientProps) {
  const router = useRouter();
  const [allNotes, setAllNotes] = useState<ReadingNote[]>(initialAllNotes);
  const [currentNote, setCurrentNote] = useState<ReadingNote>(initialNote);
  const [isLocallyModified, setIsLocallyModified] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [curtain, setCurtain] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

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

  // Pick up the folder-click transition: lift our own curtain, then drop the click overlay
  useEffect(() => {
    let color: string | null = null;
    try {
      color = sessionStorage.getItem(FOLDER_CURTAIN_KEY);
      sessionStorage.removeItem(FOLDER_CURTAIN_KEY);
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const overlay = () => document.getElementById(FOLDER_OVERLAY_ID)?.remove();
    if (color && !reduce) {
      setCurtain(color);
      requestAnimationFrame(() => requestAnimationFrame(overlay));
    } else {
      overlay();
    }
  }, []);

  // Header swaps the wordmark for the note title once the hero has scrolled away
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const colorMap = useMemo(() => buildTopicColorMap(allNotes.map((n) => n.topic || 'General')), [allNotes]);
  const color = colorMap[currentNote.topic || 'General'] || { bg: '#1e4bd7', ink: '#ffffff' };
  const siblings = allNotes.filter((n) => n.topic === currentNote.topic);

  const nextNote = useMemo(() => {
    const pool = siblings.length > 1 ? siblings : allNotes;
    if (pool.length < 2) return null;
    const idx = pool.findIndex((n) => n.id === currentNote.id);
    return pool[(idx + 1) % pool.length];
  }, [siblings, allNotes, currentNote.id]);

  const outboundLinks = (currentNote.links || []).map((link) => {
    const target = allNotes.find((n) => n.id === link.id);
    return {
      ...link,
      targetTitle: target?.title || link.id,
      targetTopic: target?.topic || 'General',
      targetSlug: target?.slug || link.id,
    };
  });
  const backlinks = currentNote.backlinks || [];

  const authors = (currentNote.sources || []).map((s) => s.author).filter(Boolean).join(', ');

  const handleDeleteNote = () => {
    deleteNoteLocally(currentNote.id, currentNote.slug, currentNote.title);
    setShowDeleteConfirm(false);
    router.push('/');
  };

  // Sibling tabs / "Next" card also open through the folder transition
  const handleClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest('a[data-folder-href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    e.preventDefault();
    openWithFolderTransition(
      router,
      anchor.dataset.folderHref as string,
      anchor.dataset.folderColor || color.bg,
      anchor.getBoundingClientRect()
    );
  };

  const nextColor = nextNote ? colorMap[nextNote.topic || 'General'] || color : color;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950" onClickCapture={handleClickCapture}>
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} contextTitle={scrolled ? currentNote.title : undefined} />

      {curtain && (
        <div
          className="curtain-lift fixed inset-0 z-[90] pointer-events-none"
          style={{ background: curtain }}
          onAnimationEnd={() => setCurtain(null)}
        />
      )}

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
          <div className="mt-6 px-4 py-3 rounded-lg bg-mosby-yellow text-black flex items-center justify-between gap-3 text-xs">
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

        {/* Hero title */}
        <section className="pt-10 pb-10 sm:pt-14 sm:pb-14">
          <div className="font-mono text-xs uppercase tracking-wider mb-4 text-slate-400">{currentNote.topic}</div>
          <HeroTitle text={currentNote.title} />
        </section>

        {/* Sibling tabs for small screens (the vertical tabs take over from md) */}
        {siblings.length > 1 && (
          <div className="md:hidden flex gap-1 overflow-x-auto no-scrollbar -mb-px">
            {siblings.map((n) => {
              const isCurrent = n.id === currentNote.id;
              return (
                <Link
                  key={n.id}
                  href={`/notes/${n.slug}/`}
                  data-folder-href={`/notes/${n.slug}/`}
                  data-folder-color={color.bg}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`folder-tab shrink-0 max-w-[14rem] h-10 flex items-center text-sm font-semibold whitespace-nowrap ${
                    isCurrent ? 'opacity-100 pointer-events-none' : 'opacity-60'
                  }`}
                  style={{ background: color.bg, color: color.ink }}
                >
                  <span className="truncate">{n.title}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Folder with vertical sibling tabs on its right edge */}
        <div className="relative md:pr-12">
          <div className="folder-stage">
            <div className="relative rounded" style={{ background: color.bg }}>
              {/* Cover: swings open from the left edge */}
              <div
                className="folder-cover absolute inset-0 z-30 rounded pointer-events-none"
                style={{
                  background: color.bg,
                  color: color.ink,
                  boxShadow: '1px 0 8px rgba(0,0,0,.25)',
                }}
                aria-hidden="true"
              >
                <span className="absolute right-6 top-5 font-mono text-xs uppercase tracking-wider">
                  {currentNote.topic}
                </span>
              </div>

              <div className="p-3 sm:p-6 md:p-8 md:pl-20">
                <div
                  className="paper-sheet paper-in pl-[3.75rem] md:pl-[7rem] pr-5 md:pr-10 pt-8 md:pt-12 pb-8"
                  style={{ ['--paper-delay' as string]: '0.3s' }}
                >
                  <div className="paper-clip-col" aria-hidden="true">
                    <span style={{ background: color.bg }} />
                    <span style={{ background: color.bg }} />
                    <span style={{ background: color.bg }} />
                  </div>

                  <div className="relative z-[1]">
                    {/* Top: source card + info (left) / summary (right) */}
                    <div className="grid md:grid-cols-[30%_1fr] gap-8 md:gap-14">
                      <div className="flex flex-col gap-6">
                        <div
                          className="relative bg-white p-2 shadow-[0_2px_10px_rgba(0,0,0,.25)] origin-bottom-left"
                          style={{ transform: 'rotate(-1.5deg)' }}
                        >
                          <div
                            className="aspect-[7/8] min-w-[140px] flex flex-col justify-between p-4"
                            style={{ background: color.bg, color: color.ink }}
                          >
                            <span className="font-mono text-xs uppercase tracking-wider">{currentNote.type}</span>
                            <span className="text-7xl font-extrabold leading-none">
                              {Array.from(currentNote.title)[0]?.toUpperCase()}
                            </span>
                            <span className="font-mono text-xs uppercase tracking-wider">
                              {STATUS_LABELS[currentNote.status] || currentNote.status}
                            </span>
                          </div>
                          <Paperclip className="absolute -top-5 right-6" />
                        </div>

                        <div className="font-mono text-sm leading-[1.4] space-y-3 text-balance">
                          <div>
                            <p className="font-bold">{authors || currentNote.sources?.[0]?.title || currentNote.title}</p>
                            {currentNote.sources?.map((src, idx) => (
                              <p key={idx}>
                                {src.title && src.title !== '-' && src.title !== currentNote.title ? `${src.title}` : ''}
                                {src.published_year ? ` (${src.published_year})` : ''}
                                {src.url && (
                                  <>
                                    {' '}
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-0.5 underline underline-offset-4"
                                    >
                                      Source <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </>
                                )}
                              </p>
                            ))}
                          </div>

                          <div>
                            {currentNote.date_started && <p>Started: {currentNote.date_started}</p>}
                            {currentNote.date_finished && <p>Finished: {currentNote.date_finished}</p>}
                            {isLocallyModified && <p className="font-bold">Uncommitted changes</p>}
                          </div>

                          {currentNote.rating ? (
                            <div className="flex items-center gap-0.5" aria-label={`Rating ${currentNote.rating} of 5`}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < (currentNote.rating || 0) ? 'fill-current' : 'opacity-25'}`}
                                />
                              ))}
                            </div>
                          ) : null}

                          {currentNote.tags && currentNote.tags.length > 0 && (
                            <p className="text-xs opacity-80">{currentNote.tags.map((t) => `#${t}`).join('  ')}</p>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        {currentNote.summary && (
                          <div className="drop-cap font-serif text-xl md:text-2xl leading-[1.4]">
                            <p>{currentNote.summary}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reading body */}
                    <div className="mt-12 pt-8 border-t border-[#100f0a]/20">
                      <div className="prose max-w-3xl">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentNote.content}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Scrapbook: takeaways as sticky notes */}
                    {currentNote.key_takeaways && currentNote.key_takeaways.length > 0 && (
                      <div className="mt-14">
                        <h2 className="font-mono text-xs uppercase tracking-wider mb-5">Core takeaways</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {currentNote.key_takeaways.map((takeaway, idx) => {
                            const s = STICKY[idx % STICKY.length];
                            return (
                              <div
                                key={idx}
                                className="sticky-note note-drop p-6 flex flex-col gap-4"
                                style={{
                                  background: s.bg,
                                  color: s.ink,
                                  transform: `rotate(${s.rot}deg)`,
                                  ['--note-delay' as string]: `${1.1 + idx * 0.08}s`,
                                }}
                              >
                                <span className="text-3xl font-extrabold leading-none">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <p className="font-serif text-base leading-snug">{takeaway}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Connected readings */}
                    {(outboundLinks.length > 0 || backlinks.length > 0) && (
                      <div className="mt-14 space-y-8">
                        {outboundLinks.length > 0 && (
                          <div>
                            <h2 className="font-mono text-xs uppercase tracking-wider mb-5">
                              Connected readings ({outboundLinks.length})
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-5">
                              {outboundLinks.map((link, idx) => {
                                const c = colorMap[link.targetTopic] || color;
                                return (
                                  <Link
                                    key={idx}
                                    href={`/notes/${link.targetSlug}/`}
                                    data-folder-href={`/notes/${link.targetSlug}/`}
                                    data-folder-color={c.bg}
                                    className="sticky-note p-5 flex flex-col gap-2"
                                    style={{ background: c.bg, color: c.ink, transform: `rotate(${idx % 2 ? 0.6 : -0.6}deg)` }}
                                  >
                                    <span className="font-mono text-[11px] uppercase tracking-wider opacity-90">
                                      {RELATIONSHIP_LABELS[link.relationship] || link.relationship}
                                    </span>
                                    <span className="font-serif text-xl leading-snug">{link.targetTitle}</span>
                                    {link.notes && <span className="text-xs italic opacity-90">&ldquo;{link.notes}&rdquo;</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {backlinks.length > 0 && (
                          <div>
                            <h2 className="font-mono text-xs uppercase tracking-wider mb-5">
                              Referenced by ({backlinks.length})
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-5">
                              {backlinks.map((backlink, idx) => {
                                const c = colorMap[backlink.sourceNoteTopic] || color;
                                return (
                                  <Link
                                    key={idx}
                                    href={`/notes/${backlink.sourceNoteId}/`}
                                    data-folder-href={`/notes/${backlink.sourceNoteId}/`}
                                    data-folder-color={c.bg}
                                    className="sticky-note p-5 flex flex-col gap-2"
                                    style={{ background: c.bg, color: c.ink, transform: `rotate(${idx % 2 ? -0.6 : 0.6}deg)` }}
                                  >
                                    <span className="font-mono text-[11px] uppercase tracking-wider opacity-90">
                                      {RELATIONSHIP_LABELS[backlink.relationship] || backlink.relationship}
                                    </span>
                                    <span className="font-serif text-xl leading-snug">{backlink.sourceNoteTitle}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical sibling tabs on the folder's right edge */}
          {siblings.length > 1 && (
            <nav
              aria-label="Other readings in this topic"
              className="hidden md:flex flex-col gap-1 absolute right-0 top-8"
            >
              {siblings.map((n) => {
                const isCurrent = n.id === currentNote.id;
                return (
                  <Link
                    key={n.id}
                    href={`/notes/${n.slug}/`}
                    data-folder-href={`/notes/${n.slug}/`}
                    data-folder-color={color.bg}
                    title={n.title}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`side-tab text-sm font-semibold ${isCurrent ? 'pointer-events-none' : 'opacity-70 hover:opacity-100'}`}
                    style={{
                      background: color.bg,
                      color: color.ink,
                      paddingRight: isCurrent ? '1.1rem' : undefined,
                    }}
                  >
                    {n.title}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Next reading */}
        {nextNote && (
          <div className="mt-10 flex flex-col items-end gap-3">
            <Link
              href={`/notes/${nextNote.slug}/`}
              data-folder-href={`/notes/${nextNote.slug}/`}
              data-folder-color={nextColor.bg}
              className="w-full sm:w-80 min-h-44 rounded-[1.75rem] p-6 flex flex-col justify-between transition-transform hover:-translate-y-1"
              style={{ background: nextColor.bg, color: nextColor.ink }}
            >
              <span className="font-serif text-2xl leading-snug line-clamp-3">{nextNote.title}</span>
              <span className="font-mono text-sm">{nextNote.topic}</span>
            </Link>
            <Link
              href={`/notes/${nextNote.slug}/`}
              data-folder-href={`/notes/${nextNote.slug}/`}
              data-folder-color={nextColor.bg}
              className="w-full sm:w-80 inline-flex items-center justify-center gap-2 py-3 rounded-full bg-mosby-yellow text-black font-mono text-sm hover:bg-white transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
