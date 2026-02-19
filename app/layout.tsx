import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundDecoration } from "@/components/layout/background-decoration";
import { LoadingProvider } from "@/lib/loading-context";
import { GlobalLoader } from "@/components/shared/global-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: " RIA ATP Rank",
  description: "Mario Tennis rankings for the crew",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoadingProvider>
            <BackgroundDecoration />
            {children}
            <GlobalLoader />
            <Toaster />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
