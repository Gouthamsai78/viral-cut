import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralCut — AI Video Enhancement",
  description: "Transform any video into viral content with AI-powered analysis, engagement strategy, and motion graphics generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
