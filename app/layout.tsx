import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thành Trung Limousine",
  description: "Nền tảng đặt vé xe khách Thành Trung Limousine",
  icons: {
    apple: "/logoicon.png",
    icon: "/logoicon.png",
    shortcut: "/logoicon.png"
  }
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
