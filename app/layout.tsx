import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thành Trung Admin",
  description: "Dashboard quản lý doanh nghiệp vận tải"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="vi">
      <body>{children}</body>
    </html>
  );
}
