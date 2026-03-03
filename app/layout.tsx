import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gong",
  description: "Strike the gong and leave a celebration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
