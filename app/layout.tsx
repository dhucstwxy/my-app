import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: '第 11 课：用户认证',
  description: '为应用接入用户体系。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN'>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
