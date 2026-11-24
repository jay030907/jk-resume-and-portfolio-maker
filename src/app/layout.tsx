import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FolioForge — Smart Resume & Portfolio Builder',
  description:
    'Resume and portfolio builder for beginners with linked coding accounts, live stats sync, customizable wallpapers, typography, and instant exports.',
  openGraph: {
    title: 'FolioForge — Smart Resume & Portfolio Builder',
    description:
      'Resume and portfolio builder for beginners with linked coding accounts, live stats sync, customizable wallpapers, typography, and instant exports.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8F9FA] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
