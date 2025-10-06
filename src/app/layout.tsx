import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { IncidentProvider } from '@/context/IncidentContext';

export const metadata: Metadata = {
  title: 'Suraksha Sahayak - AI Tourist Guardian',
  description: 'AI-Powered Tourist Guardian Platform to predict unsafe zones and provide SOS alerts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <IncidentProvider>
          {children}
          <Toaster />
        </IncidentProvider>
      </body>
    </html>
  );
}
