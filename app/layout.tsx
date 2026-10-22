import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
