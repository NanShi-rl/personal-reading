import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const mono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Personal Reading Garden | PKM Notes',
  description: 'A personal reading notes and knowledge graph powered by GitHub Pages and Actions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
