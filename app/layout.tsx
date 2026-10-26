import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modulo Simulator",
  description: "A text-based life simulator. Life, mod N.",
  applicationName: "Modulo Simulator",
  appleWebApp: { capable: true, title: "Modulo", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f15" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased font-sans">{children}</body>
    </html>
  );
}
