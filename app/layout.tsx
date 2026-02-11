import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Journal de bord - Plan prêt à faire',
  description: 'Import CSV et génération automatique du plan prêt à faire.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
