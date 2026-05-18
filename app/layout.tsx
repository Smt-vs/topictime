import type { Metadata } from "next";
import "../applicativo/app/globals.css";

export const metadata: Metadata = {
  title: "TopicTime - Chatroom a tempo",
  description:
    "TopicTime e un social a stanze tematiche con login, Star, Premium, community e Radar conversazionale.",
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
