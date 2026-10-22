'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, ExternalLink, X, ShieldAlert } from 'lucide-react';
import { getStoredGitHubToken, setStoredGitHubToken, verifyGitHubToken, getRepoConfig } from '@/lib/github';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; user?: string; error?: string } | null>(null);
  const repoConfig = getRepoConfig();

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGitHubToken() || '';
      setToken(stored);
      if (stored) {
        testToken(stored);
      } else {
        setStatus(null);
      }
    }
  }, [isOpen]);

  const testToken = async (pat: string) => {
    setStatus({ loading: true });
    const result = await verifyGitHubToken(pat);
    if (result.valid) {
      setStatus({ loading: false, user: result.user });
    } else {
      setStatus({ loading: false, error: result.error });
    }
  };

  const handleSave = async () => {
    setStoredGitHubToken(token);
    if (token) {
      await testToken(token);
    } else {
      setStatus(null);
    }
  };

  const handleClear = () => {
    setToken('');
    setStoredGitHubToken('');
    setStatus(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">GitHub Integration Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enable in-page editing via GitHub REST API</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span>Target Repository:</span>
              <span className="font-mono text-brand-600 dark:text-brand-400">{repoConfig.owner}/{repoConfig.repo}</span>
            </div>
            <p className="leading-relaxed">
              Your token is stored safely only in your browser&apos;s <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">localStorage</code> and is never sent to any third-party server.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_... or ghp_..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
            />
          </div>

          {status && (
            <div className={`p-3.5 rounded-xl flex items-center gap-3 text-sm ${
              status.loading
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                : status.user
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {status.loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : status.user ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span className="truncate">
                {status.loading
                  ? 'Verifying token permissions with GitHub...'
                  : status.user
                  ? `Authenticated as @${status.user} with write access`
                  : status.error || 'Token validation failed'}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-sm"
            >
              Save & Test Token
            </button>
            {token && (
              <button
                onClick={handleClear}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm transition-colors"
              >
                Clear Token
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Generate Fine-Grained Token (Repository permissions: Contents - Read & Write)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
