import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

import { ThemeProvider } from "@/components/ThemeProvider";
import { CursorShadow } from "@/components/CursorShadow";
import { AuthProvider } from "@/components/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excalidraw Clone",
  description: "A collaborative whiteboard application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <CursorShadow />
            <AuthGuard>{children}</AuthGuard>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
