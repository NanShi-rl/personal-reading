'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Tag, Network } from 'lucide-react';
import { ReadingNote } from '@/types/note';

interface NoteCardProps {
  note: ReadingNote;
  /** Folder colour, used for a thin accent bar on the card. */
  accent?: string;
  isPending?: boolean;
  isNewDraft?: boolean;
  onEdit?: (note: ReadingNote) => void;
}

const STATUS_STYLES: Record<string, string> = {
  unread: 'text-slate-400',
  reading: 'text-mosby-yellow',
  completed: 'text-emerald-400',
  abandoned: 'text-rose-400',
};

const TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  paper: 'Paper',
  article: 'Article',
  video: 'Video',
  podcast: 'Podcast',
};

/** Dark "document" card that rests on a coloured folder panel. */
export default function NoteCard({ note, accent, isPending, isNewDraft, onEdit }: NoteCardProps) {
  const isDraftLink = isNewDraft && onEdit;
  const title = (
    <h3 className="font-bold text-base text-white line-clamp-2 leading-snug group-hover:underline underline-offset-4">
      {note.title}
    </h3>
  );

  return (
    <div className="group relative rounded-lg bg-slate-950 text-slate-100 border border-white/10 flex flex-col justify-between overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: accent || '#1e4bd7' }} />

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px] uppercase tracking-wider">
            <span className="text-slate-400">
              {TYPE_LABELS[note.type] || note.type}
              {isPending && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-mosby-yellow text-black font-semibold">
                  {isNewDraft ? 'Draft' : 'Modified'}
                </span>
              )}
            </span>
            <span className={`font-semibold ${STATUS_STYLES[note.status] || 'text-slate-400'}`}>{note.status}</span>
          </div>

          {isDraftLink ? (
            <button type="button" onClick={() => onEdit(note)} className="text-left w-full">
              {title}
            </button>
          ) : (
            <Link
              href={`/notes/${note.slug}/`}
              data-folder-href={`/notes/${note.slug}/`}
              data-folder-color={accent}
              className="block"
            >
              {title}
            </Link>
          )}

          {note.sources && note.sources.length > 0 && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {note.sources.map((s) => s.author).filter(Boolean).join(', ') || note.sources[0].title}
              {note.sources[0]?.published_year ? ` (${note.sources[0].published_year})` : ''}
              {note.sources.length > 1 ? ` +${note.sources.length - 1}` : ''}
            </p>
          )}

          {note.rating ? (
            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < (note.rating || 0) ? 'fill-mosby-yellow text-mosby-yellow' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          ) : null}

          {note.summary && (
            <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">{note.summary}</p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            {note.links && note.links.length > 0 && (
              <span className="flex items-center gap-1" title={`${note.links.length} connected reading(s)`}>
                <Network className="w-3.5 h-3.5" />
                {note.links.length}
              </span>
            )}
            {note.tags && note.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{note.tags[0]}</span>
                {note.tags.length > 1 ? `+${note.tags.length - 1}` : ''}
              </span>
            )}
          </div>

          {isDraftLink ? (
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="inline-flex items-center gap-1 font-semibold text-white group-hover:translate-x-0.5 transition-transform"
            >
              Edit draft <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href={`/notes/${note.slug}/`}
              data-folder-href={`/notes/${note.slug}/`}
              data-folder-color={accent}
              className="inline-flex items-center gap-1 font-semibold text-white group-hover:translate-x-0.5 transition-transform"
            >
              Read <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
