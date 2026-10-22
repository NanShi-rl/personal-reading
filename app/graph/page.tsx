import { getAllNotes } from '@/lib/notes';
import GraphViewClient from '@/components/GraphViewClient';

export default function GraphPage() {
  const notes = getAllNotes();

  return <GraphViewClient notes={notes} />;
}
