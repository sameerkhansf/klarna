import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientRoot from "./ClientRoot";

export const metadata: Metadata = {
  title: "Klara",
  description: "Your claims assistant for class action settlements.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={geistSans.className}>
        <ClientRoot>{children}</ClientRoot>
        {/* <BottomNav /> */}
      </body>
    </html>
  );
}
