import { getAllNotes } from '@/lib/notes';
import TopicsViewClient from '@/components/TopicsViewClient';

export default function TopicsPage() {
  const notes = getAllNotes();

  return <TopicsViewClient initialNotes={notes} />;
}
