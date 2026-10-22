import Link from 'next/link';
import { BookMarked, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import NoteCard from '@/components/NoteCard';
import { getAllNotes, getAllTopics } from '@/lib/notes';

export default function TopicsPage() {
  const notes = getAllNotes();
  const topics = getAllTopics();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-10">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
            <BookMarked className="w-4 h-4" />
            <span>Taxonomy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Topics & Domain Clusters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Browse all reading notes grouped systematically by intellectual domain.
          </p>
        </div>

        <div className="space-y-12">
          {topics.map(({ topic, count }) => {
            const topicNotes = notes.filter((n) => n.topic === topic);

            return (
              <section key={topic} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{topic}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {count}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {topicNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Personal Reading Notes & Knowledge Graph · Built with Next.js, GitHub Pages & GitHub Actions</p>
      </footer>
    </div>
  );
}
