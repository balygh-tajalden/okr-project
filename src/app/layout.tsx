import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "نظام إدارة الأهداف المؤسسية | OKR",
    template: "%s | نظام إدارة الأهداف المؤسسية",
  },
  description:
    "نظام مؤسسي متكامل لإدارة الأهداف والنتائج الرئيسية وفق منهجية OKR — يدعم دورات التخطيط، الاعتماد، متابعة الإنجاز، والتقارير.",
  keywords: [
    "OKR",
    "الأهداف والنتائج الرئيسية",
    "إدارة مؤسسية",
    "تخطيط استراتيجي",
    "قياس الأداء",
  ],
  authors: [{ name: "نظام إدارة الأهداف المؤسسية" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "نظام إدارة الأهداف المؤسسية (OKR)",
    description:
      "نظام مؤسسي متكامل لإدارة الأهداف والنتائج الرئيسية وفق منهجية OKR.",
    type: "website",
    locale: "ar_SA",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c6b67" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1419" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${arabicSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster />
        <SonnerToaster richColors position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
