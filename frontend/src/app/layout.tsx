import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/components/layout/LanguageSwitcher";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ForMinds",
  description: "Digital Community Engagement Platform",
  icons: {
    icon: "/IconeForMinds.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
