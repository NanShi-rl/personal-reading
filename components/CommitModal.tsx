'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Trash2,
  RefreshCw,
  PlusCircle,
  Edit,
  ArrowRight,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { PendingChange, getPendingChanges, removePendingChange, clearPendingChanges } from '@/lib/localStore';
import { commitAllPendingChanges, getStoredGitHubToken, getRepoConfig } from '@/lib/github';
import SettingsModal from '@/components/SettingsModal';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CommitModal({ isOpen, onClose, onSuccess }: CommitModalProps) {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    processed: number;
    sha?: string;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const repoConfig = getRepoConfig();
  const token = typeof window !== 'undefined' ? getStoredGitHubToken() : null;

  const refreshChanges = () => {
    const list = getPendingChanges();
    setChanges(list);
    if (list.length > 0) {
      const summary = list.map((c) => c.title).slice(0, 3).join(', ');
      const extra = list.length > 3 ? ` +${list.length - 3} more` : '';
      setCommitMessage(`docs(notes): update reading notes (${summary}${extra})`);
    } else {
      setCommitMessage('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshChanges();
      setErrorMessage(null);
      setSuccessResult(null);
      setIsCommitting(false);
      setProgressText('');
      setProgressPercent(0);
    }
  }, [isOpen]);

  const handleDiscardItem = (noteId: string) => {
    removePendingChange(noteId);
    refreshChanges();
  };

  const handleDiscardAll = () => {
    if (window.confirm('Are you sure you want to discard all local uncommitted changes?')) {
      clearPendingChanges();
      refreshChanges();
    }
  };

  const handleTriggerCommit = async () => {
    const pat = getStoredGitHubToken();
    if (!pat) {
      setErrorMessage('GitHub Personal Access Token is required to commit. Please configure your PAT first.');
      return;
    }

    if (changes.length === 0) {
      setErrorMessage('No pending changes to commit.');
      return;
    }

    setIsCommitting(true);
    setErrorMessage(null);
    setSuccessResult(null);

    const result = await commitAllPendingChanges(
      changes,
      commitMessage.trim() || undefined,
      (completed, total, item) => {
        setProgressPercent(Math.round((completed / total) * 100));
        setProgressText(`Processing (${completed}/${total}): ${item}`);
      }
    );

    setIsCommitting(false);

    if (result.success) {
      setSuccessResult({
        processed: result.totalProcessed,
        sha: result.lastCommitSha,
      });
      // Clear all committed pending changes
      clearPendingChanges();
      refreshChanges();
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setErrorMessage(result.errors.join('\n') || 'Failed to commit some or all changes.');
    }
  };

  if (!isOpen) return null;

  const typeConfig = {
    create: {
      label: 'Added',
      icon: PlusCircle,
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    update: {
      label: 'Modified',
      icon: Edit,
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    delete: {
      label: 'Deleted',
      icon: Trash2,
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-6 flex flex-col space-y-6 animate-in fade-in duration-200 max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <GitCommit className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Commit Changes to GitHub</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Push your locally saved reading notes to <span className="font-mono">{repoConfig.owner}/{repoConfig.repo}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Result View */}
          {successResult ? (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Successfully Committed & Build Triggered!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {successResult.processed} file(s) have been committed directly to the <code className="font-mono font-semibold">main</code> branch.
                  GitHub Actions will now automatically build and publish the updated site to GitHub Pages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <span className="text-slate-500 block text-[11px]">GitHub Actions Deployment</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Track live build and deployment progress
                  </span>
                </div>
                <a
                  href={`https://github.com/${repoConfig.owner}/${repoConfig.repo}/actions`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shrink-0"
                >
                  <span>View GitHub Actions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold text-xs shadow-md transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Token Alert if missing */}
              {!token && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>GitHub Personal Access Token is required to commit changes.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Set Token
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="whitespace-pre-line">{errorMessage}</span>
                </div>
              )}

              {/* List of Pending Changes */}
              <div className="space-y-2 overflow-y-auto max-h-60 pr-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Staged Local Changes ({changes.length})</span>
                  {changes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDiscardAll}
                      disabled={isCommitting}
                      className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Discard All
                    </button>
                  )}
                </div>

                {changes.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                    <p className="font-medium text-slate-600 dark:text-slate-300">No pending changes</p>
                    <p className="text-[11px] mt-0.5">All your notes are synced with GitHub.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {changes.map((item) => {
                      const cfg = typeConfig[item.type] || typeConfig.update;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={item.noteId}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.badge}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{cfg.label}</span>
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {item.filePath}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDiscardItem(item.noteId)}
                            disabled={isCommitting}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                            title="Discard this change"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Commit Message Box */}
              {changes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    disabled={isCommitting}
                    placeholder="docs(notes): update reading notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Committing to branch <span className="font-mono text-slate-700 dark:text-slate-300">main</span> will trigger automatic deployment.
                  </p>
                </div>
              )}

              {/* Progress Bar when committing */}
              {isCommitting && (
                <div className="space-y-2 p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                  <div className="flex items-center justify-between text-xs text-brand-700 dark:text-brand-300 font-semibold">
                    <span>{progressText || 'Committing changes to GitHub...'}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-200 dark:bg-brand-900 overflow-hidden">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCommitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleTriggerCommit}
                  disabled={isCommitting || changes.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
                >
                  {isCommitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GitPullRequest className="w-4 h-4" />
                  )}
                  <span>
                    {isCommitting
                      ? 'Pushing to GitHub...'
                      : `Commit & Trigger Build (${changes.length})`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
