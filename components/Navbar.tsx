'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Settings, GitCommit } from 'lucide-react';
import SettingsModal from '@/components/SettingsModal';
import CommitModal from '@/components/CommitModal';
import { getPendingChanges, onPendingChangesUpdated } from '@/lib/localStore';

interface NavbarProps {
  onOpenNewNote?: () => void;
  onOpenCommit?: () => void;
}

export default function Navbar({ onOpenNewNote, onOpenCommit }: NavbarProps) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setPendingCount(getPendingChanges().length);
    };
    updateCount();
    const unsubscribe = onPendingChangesUpdated(updateCount);
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { label: 'Notes', href: '/' },
    { label: 'Graph', href: '/graph/' },
    { label: 'Topics', href: '/topics/' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">
          <nav className="flex items-center gap-5 sm:gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm sm:text-base transition-opacity ${
                    isActive ? 'opacity-100 underline underline-offset-8 decoration-2' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Centred wordmark */}
          <Link
            href="/"
            className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-extrabold uppercase text-lg text-mosby-paper tracking-tight whitespace-nowrap"
          >
            Reading Garden
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (onOpenCommit ? onOpenCommit() : setIsCommitModalOpen(true))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pendingCount > 0
                  ? 'bg-mosby-yellow text-black hover:bg-white'
                  : 'border border-white/20 text-slate-300 hover:bg-white/10'
              }`}
              title={pendingCount > 0 ? `${pendingCount} uncommitted local changes` : 'Commit changes to GitHub'}
            >
              <GitCommit className="w-4 h-4" />
              <span className="hidden sm:inline">Commit</span>
              {pendingCount > 0 && <span className="font-semibold">{pendingCount}</span>}
            </button>

            {onOpenNewNote && (
              <button
                onClick={onOpenNewNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mosby-paper text-black hover:bg-white text-xs font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Note</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="GitHub Integration Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
      />
    </>
  );
}
