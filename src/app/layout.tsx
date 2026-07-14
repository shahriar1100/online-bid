import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "src/components/theme-provider";
import { Toaster } from 'sonner'
import {AppProvider} from "./context";
import FloatingChatButton from "src/components/common/FloatingChatButton";

export const metadata: Metadata = {
  title: "Ibids - Online Auction Platform",
  description: "Join our online auction platform to bid on automobiles, real estate, and business opportunities online.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="antialiased relative min-h-screen bg-fixed bg-cover bg-center"
      >
        <Toaster richColors position="top-center" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme={undefined}
        >
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
        <FloatingChatButton />
      </body>
    </html>
  );
}
