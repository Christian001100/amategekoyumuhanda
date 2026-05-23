import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amategeko y'Umuhanda | Rwandan Driving Test Mastery",
  description: "Master all 404 Rwandan driving test questions in exactly 2 weeks using Spaced Repetition (Leitner System) and Active Recall.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Amategeko",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="rw"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
