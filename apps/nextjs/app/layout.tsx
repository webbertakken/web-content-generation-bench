import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Web content generation benchmark - menu',
  description: 'Static menu page benchmark.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
