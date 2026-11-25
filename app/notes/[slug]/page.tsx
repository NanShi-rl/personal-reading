import { notFound } from 'next/navigation';
import { getAllNoteSlugs, getNoteBySlug, getAllNotes } from '@/lib/notes';
import NoteDetailClient from '@/components/NoteDetailClient';

interface NotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllNoteSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const allNotes = getAllNotes();
  const currentNoteWithBacklinks = allNotes.find((n) => n.slug === slug) || note;

  // key remounts the client component per note so the "folder opens" animation replays
  return <NoteDetailClient key={slug} note={currentNoteWithBacklinks} allNotes={allNotes} />;
}
