import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Image Background Remover - Remove BG for Free | AI Powered',
  description:
    'Remove image backgrounds 100% automatically in seconds. No clicks, no green screens, no fuss. Free online tool powered by AI.',
  keywords:
    'background remover, remove bg, image editing, transparent background, AI, free, online tool',
  openGraph: {
    title: 'Image Background Remover - Remove BG for Free',
    description:
      'Remove image backgrounds 100% automatically in seconds. Free online tool powered by AI.',
    type: 'website',
    siteName: 'BG Remover',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Background Remover - Remove BG for Free',
    description:
      'Remove image backgrounds 100% automatically in seconds. Free online tool powered by AI.',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-theme antialiased">
        {children}
      </body>
    </html>
  );
}
