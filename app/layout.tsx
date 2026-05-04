import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopicTime App",
  description:
    "Applicativo TopicTime per chatroom tematiche, profili post-conversazione e wallet interno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
