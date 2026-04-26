import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: '第 15 课：自定义渲染与交互',
  description: '在已有 Canvas 协议上，只升级预览、编辑、渲染策略与交互体验。',
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
