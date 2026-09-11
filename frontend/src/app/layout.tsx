import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gemini AI — Enterprise DevOps Edition',
  description: 'Production-grade Gemini AI chat platform powered directly by Google Gemini with server-side streaming API gateway.',
  icons: {
    icon: '/gemini-icon.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-gemini-dark text-gray-900 dark:text-gray-100 antialiased overflow-hidden selection:bg-blue-500/20 selection:text-blue-500">
        {children}
      </body>
    </html>
  );
}