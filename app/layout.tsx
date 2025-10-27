import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Screenshot → Vercel Blob',
  description: 'Microlink-Screenshot erstellen, in Vercel Blob speichern und direkt anzeigen.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
