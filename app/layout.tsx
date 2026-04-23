import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: '第 13 课：Google 图片生成工具',
  description: '实现一个完整的高级工具案例。',
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
