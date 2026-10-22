import matter from 'gray-matter';
import { ReadingNote } from '@/types/note';

export interface GitHubCommitResult {
  success: boolean;
  message?: string;
  error?: string;
  commitSha?: string;
}

const TOKEN_KEY = 'personal_reading_github_pat';

export function getStoredGitHubToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token.trim());
  }
}

export function getRepoConfig() {
  return {
    owner: process.env.NEXT_PUBLIC_REPO_OWNER || 'NanShi-rl',
    repo: process.env.NEXT_PUBLIC_REPO_NAME || 'personal-reading',
    branch: 'main',
  };
}

export async function verifyGitHubToken(token: string): Promise<{ valid: boolean; user?: string; error?: string }> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return { valid: false, error: `Authentication failed: HTTP ${res.status}` };
    }

    const data = await res.json();
    return { valid: true, user: data.login };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error verifying token' };
  }
}

export async function fetchFileFromGitHub(filePath: string, token?: string): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, branch } = getRepoConfig();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  const authToken = token || getStoredGitHubToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.content && data.encoding === 'base64') {
      const decoded = decodeURIComponent(
        atob(data.content)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return { content: decoded, sha: data.sha };
    }
    return null;
  } catch {
    return null;
  }
}

export async function commitFileToGitHub(
  filePath: string,
  content: string,
  commitMessage: string,
  existingSha?: string
): Promise<GitHubCommitResult> {
  const token = getStoredGitHubToken();
  if (!token) {
    return {
      success: false,
      error: 'GitHub Personal Access Token is not configured. Please set your PAT in Settings first.',
    };
  }

  const { owner, repo, branch } = getRepoConfig();

  let sha = existingSha;
  if (!sha) {
    const existing = await fetchFileFromGitHub(filePath, token);
    if (existing) {
      sha = existing.sha;
    }
  }

  const base64Content = btoa(
    encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const body: Record<string, any> = {
      message: commitMessage,
      content: base64Content,
      branch,
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorJson = await res.json();
      return {
        success: false,
        error: errorJson.message || `Failed to commit (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Committed successfully to GitHub!',
      commitSha: data.commit?.sha,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown network error occurred while committing.',
    };
  }
}

export async function deleteFileFromGitHub(
  filePath: string,
  sha?: string,
  commitMessage: string = 'docs(notes): delete note'
): Promise<GitHubCommitResult> {
  const token = getStoredGitHubToken();
  if (!token) {
    return {
      success: false,
      error: 'GitHub Personal Access Token is required to delete notes.',
    };
  }

  const { owner, repo, branch } = getRepoConfig();

  let targetSha = sha;
  if (!targetSha) {
    const existing = await fetchFileFromGitHub(filePath, token);
    if (existing) {
      targetSha = existing.sha;
    } else {
      return {
        success: false,
        error: `Could not find file ${filePath} in repository.`,
      };
    }
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        sha: targetSha,
        branch,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json();
      return {
        success: false,
        error: errorJson.message || `Failed to delete (HTTP ${res.status})`,
      };
    }

    return {
      success: true,
      message: 'File deleted from repository.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error occurred while deleting file.',
    };
  }
}

/**
 * Deletes a note and automatically updates any other note in the repo
 * that links to this note to remove the dangling linkage.
 */
export async function deleteNoteWithCascadeCleanup(
  noteId: string,
  noteSlug: string,
  allNotes: ReadingNote[]
): Promise<GitHubCommitResult> {
  const token = getStoredGitHubToken();
  if (!token) {
    return {
      success: false,
      error: 'GitHub Personal Access Token is required to delete notes.',
    };
  }

  // 1. Delete the primary note file
  const filePath = `content/notes/${noteSlug || noteId}.md`;
  const deleteResult = await deleteFileFromGitHub(
    filePath,
    undefined,
    `docs(notes): delete note "${noteId}"`
  );

  if (!deleteResult.success) {
    return deleteResult;
  }

  // 2. Cascade cleanup: Find all other notes that reference this note
  const notesWithLinkage = allNotes.filter(
    (n) => n.id !== noteId && n.links?.some((l) => l.id === noteId)
  );

  for (const linkingNote of notesWithLinkage) {
    const otherFilePath = `content/notes/${linkingNote.slug || linkingNote.id}.md`;
    const fetched = await fetchFileFromGitHub(otherFilePath, token);
    if (fetched) {
      const { data, content } = matter(fetched.content);
      const updatedLinks = (data.links || []).filter((l: any) => l.id !== noteId);
      const updatedFrontmatter = {
        ...data,
        links: updatedLinks,
        last_modified: new Date().toISOString().split('T')[0],
      };
      if (updatedLinks.length === 0) {
        delete updatedFrontmatter.links;
      }
      const updatedMarkdown = matter.stringify(content, updatedFrontmatter);
      await commitFileToGitHub(
        otherFilePath,
        updatedMarkdown,
        `docs(notes): remove deleted linkage to "${noteId}" from "${linkingNote.id}"`,
        fetched.sha
      );
    }
  }

  return {
    success: true,
    message: `Note "${noteId}" and all linkages to it were successfully removed.`,
  };
}
