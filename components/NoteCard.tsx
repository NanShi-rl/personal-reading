'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Star, Calendar, ArrowRight, Tag, Network } from 'lucide-react';
import { ReadingNote } from '@/types/note';

interface NoteCardProps {
  note: ReadingNote;
}

export default function NoteCard({ note }: NoteCardProps) {
  const statusColors = {
    unread: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    reading: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    abandoned: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  };

  const typeLabels = {
    book: 'Book',
    paper: 'Paper',
    article: 'Article',
    video: 'Video',
    podcast: 'Podcast',
  };

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
              {note.topic}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {typeLabels[note.type] || note.type}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColors[note.status]}`}>
            {note.status}
          </span>
        </div>

        {/* Title */}
        <Link href={`/notes/${note.slug}/`} className="block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {note.title}
          </h3>
        </Link>

        {/* Author / Sources */}
        {note.sources && note.sources.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            by <span className="text-slate-700 dark:text-slate-300 font-medium">{note.sources.map((s) => s.author).filter(Boolean).join(', ') || note.sources[0].title}</span>
            {note.sources[0]?.published_year ? ` (${note.sources[0].published_year})` : ''}
            {note.sources.length > 1 ? ` +${note.sources.length - 1} more` : ''}
          </p>
        )}

        {/* Rating Stars */}
        {note.rating ? (
          <div className="flex items-center gap-0.5 mt-2 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < (note.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
        ) : null}

        {/* Summary Snippet */}
        {note.summary && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">
            {note.summary}
          </p>
        )}
      </div>

      {/* Footer Details */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {note.links && note.links.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400" title={`${note.links.length} connected reading(s)`}>
              <Network className="w-3.5 h-3.5 text-brand-500" />
              <span>{note.links.length} links</span>
            </span>
          )}

          {note.tags && note.tags.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Tag className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{note.tags[0]}</span>
              {note.tags.length > 1 ? `+${note.tags.length - 1}` : ''}
            </span>
          )}
        </div>

        <Link
          href={`/notes/${note.slug}/`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Read note</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
