'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Edit3, Trash2, Plus, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';
import { ReadingNote, ReadingType, ReadingStatus, LinkRelationship, NoteLinkage } from '@/types/note';
import { commitFileToGitHub, deleteFileFromGitHub, getStoredGitHubToken } from '@/lib/github';

interface NoteEditorModalProps {
  isOpen: boolean;
  note?: ReadingNote | null;
  allAvailableNotes: { id: string; title: string }[];
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NoteEditorModal({
  isOpen,
  note,
  allAvailableNotes,
  onClose,
  onSuccess,
}: NoteEditorModalProps) {
  const isEditing = Boolean(note);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ReadingType>('book');
  const [status, setStatus] = useState<ReadingStatus>('completed');
  const [rating, setRating] = useState<number>(5);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceAuthor, setSourceAuthor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [publishedYear, setPublishedYear] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [summary, setSummary] = useState('');
  const [keyTakeawaysInput, setKeyTakeawaysInput] = useState('');
  const [dateStarted, setDateStarted] = useState('');
  const [dateFinished, setDateFinished] = useState('');
  const [links, setLinks] = useState<NoteLinkage[]>([]);
  const [markdownContent, setMarkdownContent] = useState('');

  // Pre-fill when note changes or modal opens
  useEffect(() => {
    if (note) {
      setId(note.id);
      setTitle(note.title);
      setTopic(note.topic);
      setType(note.type);
      setStatus(note.status);
      setRating(note.rating || 5);
      setSourceTitle(note.source?.title || '');
      setSourceAuthor(note.source?.author || '');
      setSourceUrl(note.source?.url || '');
      setPublishedYear(note.source?.published_year ? String(note.source.published_year) : '');
      setTagsInput(note.tags?.join(', ') || '');
      setSummary(note.summary || '');
      setKeyTakeawaysInput(note.key_takeaways?.join('\n') || '');
      setDateStarted(note.date_started || '');
      setDateFinished(note.date_finished || '');
      setLinks(note.links || []);
      setMarkdownContent(note.content || '');
    } else {
      setId('');
      setTitle('');
      setTopic('');
      setType('book');
      setStatus('reading');
      setRating(5);
      setSourceTitle('');
      setSourceAuthor('');
      setSourceUrl('');
      setPublishedYear('');
      setTagsInput('');
      setSummary('');
      setKeyTakeawaysInput('');
      setDateStarted(new Date().toISOString().split('T')[0]);
      setDateFinished('');
      setLinks([]);
      setMarkdownContent('## Personal Impressions\n\n\n## Key Notes & Highlights\n\n');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [note, isOpen]);

  // Auto-generate slug/id from title if new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !id) {
      const generated = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      setId(generated);
    }
  };

  const handleAddLink = () => {
    const available = allAvailableNotes.find((n) => n.id !== id && !links.some((l) => l.id === n.id));
    if (available) {
      setLinks([...links, { id: available.id, relationship: 'references', notes: '' }]);
    }
  };

  const handleUpdateLink = (index: number, field: keyof NoteLinkage, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const generateFullMarkdown = (): string => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const keyTakeaways = keyTakeawaysInput
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const frontmatterObj: Record<string, any> = {
      id: id.trim(),
      title: title.trim(),
      topic: topic.trim(),
      type,
      source: {
        title: sourceTitle.trim() || title.trim(),
        author: sourceAuthor.trim(),
        ...(sourceUrl.trim() ? { url: sourceUrl.trim() } : {}),
        ...(publishedYear ? { published_year: parseInt(publishedYear, 10) } : {}),
      },
      status,
      rating: Number(rating),
      tags,
      ...(links.length > 0 ? { links } : {}),
      ...(dateStarted ? { date_started: dateStarted } : {}),
      ...(dateFinished ? { date_finished: dateFinished } : {}),
      last_modified: new Date().toISOString().split('T')[0],
      summary: summary.trim(),
      ...(keyTakeaways.length > 0 ? { key_takeaways: keyTakeaways } : {}),
    };

    return matter.stringify(markdownContent, frontmatterObj);
  };

  const handleSaveToGitHub = async () => {
    const token = getStoredGitHubToken();
    if (!token) {
      setErrorMessage('Please set your GitHub Personal Access Token in the top-right Settings modal first.');
      return;
    }

    if (!id.trim() || !title.trim() || !topic.trim()) {
      setErrorMessage('Note ID, Title, and Main Topic are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullMarkdown = generateFullMarkdown();
    const filePath = `content/notes/${id.trim()}.md`;
    const commitMsg = isEditing ? `docs(notes): update reading note for "${title}"` : `docs(notes): add reading note for "${title}"`;

    const result = await commitFileToGitHub(filePath, fullMarkdown, commitMsg);

    setIsSubmitting(false);
    if (result.success) {
      setSuccessMessage('Note committed successfully to GitHub repository! GitHub Actions will trigger a deployment.');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } else {
      setErrorMessage(result.error || 'Failed to save note to repository.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? `Edit: ${note?.title}` : 'Create New Reading Note'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly commits Markdown & structured metadata to GitHub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'editor' ? (
            <div className="space-y-6">
              {/* Core Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Clean Code: A Handbook of Agile Software Craftsmanship"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slug / Unique ID *
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={isEditing}
                    placeholder="clean-code"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Main Topic *
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Software Engineering"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Content Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ReadingType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="book">Book</option>
                    <option value="paper">Research Paper</option>
                    <option value="article">Article / Blog Post</option>
                    <option value="video">Talk / Video</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reading Status & Rating
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                      className="w-2/3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="unread">Unread</option>
                      <option value="reading">Reading</option>
                      <option value="completed">Completed</option>
                      <option value="abandoned">Abandoned</option>
                    </select>

                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-1/3 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value={5}>5 ★</option>
                      <option value={4}>4 ★</option>
                      <option value={3}>3 ★</option>
                      <option value={2}>2 ★</option>
                      <option value={1}>1 ★</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Source Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Source Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Author(s)</label>
                    <input
                      type="text"
                      value={sourceAuthor}
                      onChange={(e) => setSourceAuthor(e.target.value)}
                      placeholder="e.g. Robert C. Martin"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Original Title</label>
                    <input
                      type="text"
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="Defaults to note title"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Source URL</label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={publishedYear}
                      onChange={(e) => setPublishedYear(e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="architecture, best-practices, design-patterns"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Started
                  </label>
                  <input
                    type="date"
                    value={dateStarted}
                    onChange={(e) => setDateStarted(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Finished
                  </label>
                  <input
                    type="date"
                    value={dateFinished}
                    onChange={(e) => setDateFinished(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Summary & Key Takeaways */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Executive Summary / One-sentence synopsis
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief 1-2 sentence core thesis of this reading"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Takeaways (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={keyTakeawaysInput}
                    onChange={(e) => setKeyTakeawaysInput(e.target.value)}
                    placeholder="Takeaway 1&#10;Takeaway 2&#10;Takeaway 3"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Linkage / PKM Network Connections */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Linkages to Other Readings
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Connect ideas across your knowledge network (Zettelkasten cross-references)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                {links.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No linked readings yet. Click above to connect a note.</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <select
                          value={link.id}
                          onChange={(e) => handleUpdateLink(idx, 'id', e.target.value)}
                          className="w-full sm:w-1/3 px-2 py-1 rounded text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          {allAvailableNotes
                            .filter((n) => n.id !== id)
                            .map((target) => (
                              <option key={target.id} value={target.id}>
                                {target.title} ({target.id})
                              </option>
                            ))}
                        </select>

                        <select
                          value={link.relationship}
                          onChange={(e) => handleUpdateLink(idx, 'relationship', e.target.value)}
                          className="w-full sm:w-1/4 px-2 py-1 rounded text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="extends">Extends (Builds upon)</option>
                          <option value="contrasts">Contrasts (Opposing view)</option>
                          <option value="inspires">Inspires</option>
                          <option value="references">References</option>
                          <option value="foundational_for">Foundational For</option>
                          <option value="related_to">Related To</option>
                        </select>

                        <input
                          type="text"
                          value={link.notes || ''}
                          onChange={(e) => handleUpdateLink(idx, 'notes', e.target.value)}
                          placeholder="Context / reason for connection"
                          className="flex-1 w-full px-2 py-1 rounded text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          title="Remove connection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Markdown Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Notes & Deep Dive (Markdown supported)
                </label>
                <textarea
                  rows={12}
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="Write your personal reflections, key quotes, chapter notes, and analyses in Markdown..."
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Live Preview Pane */
            <div className="p-6 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400">
                  {topic || 'Topic'} · {type}
                </span>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {title || 'Untitled Note'}
                </h1>
                {sourceAuthor && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    By <span className="font-medium text-slate-700 dark:text-slate-300">{sourceAuthor}</span>
                    {publishedYear ? ` (${publishedYear})` : ''}
                  </p>
                )}
              </div>

              {summary && (
                <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border-l-4 border-brand-500 text-sm text-slate-700 dark:text-slate-300 italic">
                  {summary}
                </div>
              )}

              {/* Rendered Markdown */}
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500">
            Saved changes trigger automatic GitHub Pages deployment via GitHub Actions.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveToGitHub}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Committing...' : 'Commit to GitHub'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
