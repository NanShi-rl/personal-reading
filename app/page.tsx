import { getAllNotes, getAllTopics, getAllTags } from '@/lib/notes';
import DashboardClient from '@/components/DashboardClient';

export default function HomePage() {
  const notes = getAllNotes();
  const topics = getAllTopics();
  const tags = getAllTags();

  return (
    <DashboardClient
      initialNotes={notes}
      topics={topics}
      tags={tags}
    />
  );
}
