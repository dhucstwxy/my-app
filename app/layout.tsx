import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '第 04 课：分层架构',
  description: '理解为什么项目要拆分为 API、Agent、Service、Database 等层次。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN'>
      <body>{children}</body>
    </html>
  );
}
