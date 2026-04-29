import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CaseProvider } from "@/lib/store";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SafeTy-PA | t-PA投与支援システム",
  description: "脳卒中患者に対するt-PA（アルテプラーゼ）安全投与を支援するクリニカルデシジョンサポートツール",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <CaseProvider>{children}</CaseProvider>
      </body>
    </html>
  );
}
