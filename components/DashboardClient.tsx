'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, BookOpen, Layers, CheckCircle2, Bookmark, Filter, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import NoteCard from '@/components/NoteCard';
import NoteEditorModal from '@/components/NoteEditorModal';
import { ReadingNote, ReadingStatus } from '@/types/note';

interface DashboardClientProps {
  initialNotes: ReadingNote[];
  topics: { topic: string; count: number }[];
  tags: { tag: string; count: number }[];
}

export default function DashboardClient({
  initialNotes,
  topics,
  tags,
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Filter notes based on query, topic, status, tag
  const filteredNotes = useMemo(() => {
    return initialNotes.filter((note) => {
      const matchesSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.sources?.some(
          (s) =>
            s.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.title?.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTopic = selectedTopic === 'All' || note.topic === selectedTopic;
      const matchesStatus = selectedStatus === 'All' || note.status === selectedStatus;
      const matchesTag = selectedTag === 'All' || note.tags?.includes(selectedTag);

      return matchesSearch && matchesTopic && matchesStatus && matchesTag;
    });
  }, [initialNotes, searchQuery, selectedTopic, selectedStatus, selectedTag]);

  // Statistics
  const stats = useMemo(() => {
    const total = initialNotes.length;
    const completed = initialNotes.filter((n) => n.status === 'completed').length;
    const reading = initialNotes.filter((n) => n.status === 'reading').length;
    const totalLinks = initialNotes.reduce((acc, n) => acc + (n.links?.length || 0), 0);
    return { total, completed, reading, totalLinks };
  }, [initialNotes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenNewNote={() => setIsEditorOpen(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Hero Section & Metrics */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-slate-900 text-white p-6 sm:p-10 shadow-xl shadow-brand-500/10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-brand-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Connected Knowledge Base
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Personal Reading Garden
            </h1>
            <p className="mt-2 text-sm sm:text-base text-brand-100/90 leading-relaxed">
              Cultivate thoughts, cross-link ideas, and distill timeless principles with bidirectional note linkages.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-brand-100/80">Readings Captured</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-xl sm:text-2xl font-bold">{stats.reading}</div>
                <div className="text-xs text-brand-100/80">Currently In Progress</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-xl sm:text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-brand-100/80">Finished / Summarized</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-xl sm:text-2xl font-bold">{stats.totalLinks}</div>
                <div className="text-xs text-brand-100/80">Zettelkasten Links</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, authors, tags, takeaways..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'reading', 'completed', 'unread'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    selectedStatus === status
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Topics:
            </span>
            <button
              onClick={() => setSelectedTopic('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedTopic === 'All'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Topics ({initialNotes.length})
            </button>
            {topics.map((item) => (
              <button
                key={item.topic}
                onClick={() => setSelectedTopic(item.topic)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedTopic === item.topic
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {item.topic} ({item.count})
              </button>
            ))}
          </div>
        </section>

        {/* Note Cards Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Reading Notes</span>
              <span className="text-xs font-normal text-slate-400">({filteredNotes.length})</span>
            </h2>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">No notes match your filters</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or topic filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic('All');
                  setSelectedStatus('All');
                  setSelectedTag('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Personal Reading Notes & Knowledge Graph · Built with Next.js, GitHub Pages & GitHub Actions</p>
      </footer>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        allAvailableNotes={initialNotes.map((n) => ({ id: n.id, title: n.title }))}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
