import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Play Store Review Analyzer",
  description:
    "Fetch and analyze sentiment of Google Play Store reviews for any app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
