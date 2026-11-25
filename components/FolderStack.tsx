'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import { ReadingNote } from '@/types/note';
import { TopicColor } from '@/lib/topicColor';
import { openWithFolderTransition } from '@/lib/folderTransition';

interface FolderStackProps {
  notes: ReadingNote[];
  colorMap: Record<string, TopicColor>;
  pendingIds: Set<string>;
  initialNoteIds: Set<string>;
  onEdit: (note: ReadingNote) => void;
  /** Expand every folder (used by the Topics page and while searching). */
  openAll?: boolean;
}

/**
 * Stack of coloured "folders", one per topic. Each folder's tabs are its notes
 * (click to open); clicking the folder bar expands it to show note cards.
 */
export default function FolderStack({
  notes,
  colorMap,
  pendingIds,
  initialNoteIds,
  onEdit,
  openAll = false,
}: FolderStackProps) {
  const router = useRouter();

  // Open readings through the folder transition (colour grows from the clicked tab/card)
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest('a[data-folder-href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    e.preventDefault();
    openWithFolderTransition(
      router,
      anchor.dataset.folderHref as string,
      anchor.dataset.folderColor || '#1e4bd7',
      anchor.getBoundingClientRect()
    );
  };

  // undefined = never toggled -> first folder open by default; null = all closed
  const [openTopic, setOpenTopic] = useState<string | null | undefined>(undefined);

  const groups = useMemo(() => {
    const byTopic = new Map<string, ReadingNote[]>();
    notes.forEach((n) => {
      const topic = n.topic || 'General';
      byTopic.set(topic, [...(byTopic.get(topic) || []), n]);
    });
    return Array.from(byTopic.entries())
      .map(([topic, items]) => ({ topic, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [notes]);

  const effectiveOpen = openTopic === undefined ? groups[0]?.topic : openTopic;

  return (
    <div className="flex flex-col" onClickCapture={handleClickCapture}>
      {groups.map(({ topic, items }, i) => {
        const color = colorMap[topic] || { bg: '#1e4bd7', ink: '#ffffff' };
        const prevBg = i > 0 ? (colorMap[groups[i - 1].topic]?.bg ?? 'transparent') : 'transparent';
        const isOpen = openAll || effectiveOpen === topic;

        return (
          <section key={topic}>
            {/* Tab row: this folder's notes, sitting on the previous folder's colour */}
            <div
              className="flex items-end gap-1 overflow-x-auto no-scrollbar pt-4 px-3 sm:px-6 rounded-t"
              style={{ background: prevBg }}
            >
              {items.map((note) => {
                const isNewDraft = pendingIds.has(note.id) && !initialNoteIds.has(note.id);
                const tabClass =
                  'folder-tab shrink-0 max-w-[22rem] h-11 flex items-center text-sm sm:text-base font-semibold whitespace-nowrap transition-transform hover:-translate-y-0.5';
                const tabStyle = { background: color.bg, color: color.ink };
                return isNewDraft ? (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onEdit(note)}
                    className={tabClass}
                    style={tabStyle}
                    title="Local draft — click to edit"
                  >
                    <span className="truncate">{note.title}</span>
                  </button>
                ) : (
                  <Link
                    key={note.id}
                    href={`/notes/${note.slug}/`}
                    data-folder-href={`/notes/${note.slug}/`}
                    data-folder-color={color.bg}
                    className={tabClass}
                    style={tabStyle}
                    title={note.title}
                  >
                    <span className="truncate">{note.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Folder panel */}
            <div style={{ background: color.bg, color: color.ink }}>
              <button
                type="button"
                onClick={() => setOpenTopic(isOpen && !openAll ? null : topic)}
                aria-expanded={isOpen}
                disabled={openAll}
                className="w-full h-11 px-4 sm:px-8 flex items-center justify-between text-xs sm:text-sm font-medium disabled:cursor-default"
              >
                <span className="opacity-80">
                  {items.length} {items.length === 1 ? 'note' : 'notes'}
                </span>
                <span className="flex items-center gap-2">
                  {topic}
                  {!openAll && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-8 pt-2 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((note) => {
                    const isPending = pendingIds.has(note.id);
                    return (
                      <NoteCard
                        key={note.id}
                        note={note}
                        accent={color.bg}
                        isPending={isPending}
                        isNewDraft={isPending && !initialNoteIds.has(note.id)}
                        onEdit={onEdit}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
