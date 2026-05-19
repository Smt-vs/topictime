import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopicTime - Chatroom a tempo",
  description:
    "TopicTime è un social a stanze tematiche con login, Star, Premium, community e Radar conversazionale.",
  icons: {
    apple: [{ sizes: "900x900", type: "image/png", url: "/brand/logo-mark.png" }],
    icon: [{ sizes: "900x900", type: "image/png", url: "/brand/logo-mark.png" }],
    shortcut: [{ sizes: "900x900", type: "image/png", url: "/brand/logo-mark.png" }],
  },
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
