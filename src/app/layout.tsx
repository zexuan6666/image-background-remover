import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Image Background Remover - Remove BG for Free',
  description:
    'Remove image backgrounds 100% automatically in seconds. No clicks, no green screens, no fuss. Free online tool powered by AI.',
  keywords: 'background remover, remove bg, image editing, transparent background, AI',
  openGraph: {
    title: 'Image Background Remover - Remove BG for Free',
    description:
      'Remove image backgrounds 100% automatically in seconds. Free online tool powered by AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        {children}
      </body>
    </html>
  );
}
