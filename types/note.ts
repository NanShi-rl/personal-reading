export type ReadingType = 'book' | 'paper' | 'article' | 'video' | 'podcast';

export type ReadingStatus = 'unread' | 'reading' | 'completed' | 'abandoned';

export type LinkRelationship =
  | 'extends'
  | 'contrasts'
  | 'inspires'
  | 'references'
  | 'foundational_for'
  | 'related_to';

export interface SourceMetadata {
  title: string;
  author: string;
  url?: string;
  published_year?: number;
}

export interface NoteLinkage {
  id: string;
  relationship: LinkRelationship;
  notes?: string; // Optional context for the link
}

export interface ReadingNoteFrontmatter {
  id: string;
  title: string;
  topic: string;
  type: ReadingType;
  source?: SourceMetadata; // Optional legacy single source
  sources?: SourceMetadata[]; // Multiple sources support
  status: ReadingStatus;
  rating?: number; // 1-5 scale
  tags: string[];
  links?: NoteLinkage[];
  date_started?: string;
  date_finished?: string;
  last_modified: string;
  summary: string;
  key_takeaways?: string[];
}

export interface BacklinkInfo {
  sourceNoteId: string;
  sourceNoteTitle: string;
  sourceNoteTopic: string;
  relationship: LinkRelationship;
}

export interface ReadingNote extends ReadingNoteFrontmatter {
  slug: string;
  content: string;
  sources: SourceMetadata[];
  backlinks?: BacklinkInfo[];
}
