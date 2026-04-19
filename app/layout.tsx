import type { Metadata } from 'next';
import './globals.css';

// 根布局结构没有变化，只更新课程对应的元信息。
export const metadata: Metadata = {
  title: '第 02 课：核心对话流',
  description: '完成用户输入到模型回复的最小闭环。',
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
