import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ReadingNote, ReadingNoteFrontmatter, BacklinkInfo, SourceMetadata } from '@/types/note';

const notesDirectory = path.join(process.cwd(), 'content/notes');

export function ensureNotesDirectoryExists(): void {
  if (!fs.existsSync(notesDirectory)) {
    fs.mkdirSync(notesDirectory, { recursive: true });
  }
}

export function getAllNoteSlugs(): string[] {
  ensureNotesDirectoryExists();
  const fileNames = fs.readdirSync(notesDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}

export function getNoteBySlug(slug: string): ReadingNote | null {
  ensureNotesDirectoryExists();
  const fullPath = path.join(notesDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const frontmatter = data as ReadingNoteFrontmatter;

  // Normalize sources: prefer frontmatter.sources array, fallback to frontmatter.source object
  let sources: SourceMetadata[] = [];
  if (Array.isArray(frontmatter.sources) && frontmatter.sources.length > 0) {
    sources = frontmatter.sources;
  } else if (frontmatter.source && (frontmatter.source.title || frontmatter.source.author)) {
    sources = [frontmatter.source];
  }

  return {
    ...frontmatter,
    id: frontmatter.id || slug,
    slug,
    content,
    sources,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    links: Array.isArray(frontmatter.links) ? frontmatter.links : [],
    key_takeaways: Array.isArray(frontmatter.key_takeaways) ? frontmatter.key_takeaways : [],
  };
}

export function getAllNotes(): ReadingNote[] {
  const slugs = getAllNoteSlugs();
  const notes = slugs
    .map((slug) => getNoteBySlug(slug))
    .filter((note): note is ReadingNote => note !== null);

  // Calculate backlinks
  const backlinkMap: Record<string, BacklinkInfo[]> = {};

  notes.forEach((sourceNote) => {
    sourceNote.links?.forEach((link) => {
      if (!backlinkMap[link.id]) {
        backlinkMap[link.id] = [];
      }
      backlinkMap[link.id].push({
        sourceNoteId: sourceNote.id,
        sourceNoteTitle: sourceNote.title,
        sourceNoteTopic: sourceNote.topic,
        relationship: link.relationship,
      });
    });
  });

  return notes
    .map((note) => ({
      ...note,
      backlinks: backlinkMap[note.id] || [],
    }))
    .sort((a, b) => (b.last_modified || '').localeCompare(a.last_modified || ''));
}

export function getAllTopics(): { topic: string; count: number }[] {
  const notes = getAllNotes();
  const counts: Record<string, number> = {};

  notes.forEach((note) => {
    if (note.topic) {
      counts[note.topic] = (counts[note.topic] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTags(): { tag: string; count: number }[] {
  const notes = getAllNotes();
  const counts: Record<string, number> = {};

  notes.forEach((note) => {
    note.tags?.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
