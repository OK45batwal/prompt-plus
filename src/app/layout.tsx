import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { getValidatedSession } from "@/lib/auth/get-session";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-plus-three.vercel.app"),
  title: {
    default: "Prompt+ — Free AI Prompt Architect & Extension for ChatGPT, Claude & Gemini",
    template: "%s | Prompt+ Architect AI",
  },
  description:
    "Transform simple 3-word prompts into production-grade master engineering specs. 100% Free Chrome extension & Web App with On-Device Gemini Nano AI, zero API key requirement, and Cross-AI conversation memory bridge.",
  keywords: [
    "ChatGPT prompt generator",
    "Claude prompt enhancer",
    "Gemini prompt API",
    "AI prompt engineering tool",
    "On-Device AI extension",
    "free prompt optimizer",
    "cross-AI context bridge",
    "prompt engineering guide",
    "prompt cost calculator",
  ],
  authors: [{ name: "Prompt+ Team" }],
  creator: "Prompt+ Architect AI",
  publisher: "Prompt+",
  icons: {
    icon: [
      { url: "/store-icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/store-icon-128x128.png",
    apple: "/store-icon-128x128.png",
  },
  verification: {
    google: "google37ad5f54b5d08314",
  },
  openGraph: {
    title: "Prompt+ — Free AI Prompt Architect & Extension",
    description:
      "Transform simple 3-word prompts into production-grade master engineering specs. 100% Free Chrome extension & Web App with On-Device Gemini Nano AI.",
    url: "https://prompt-plus-three.vercel.app",
    siteName: "Prompt+",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prompt+ — AI Prompt Engineering Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt+ — Free AI Prompt Architect",
    description:
      "Transform simple 3-word prompts into production-grade master engineering specs. 100% Free Chrome extension & Web App.",
    images: ["/og-image.png"],
    creator: "@promptplus",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://prompt-plus-three.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Prompt+",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web, Chrome Extension",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free AI prompt engineering tool & browser extension that turns simple inputs into production-grade prompts for ChatGPT, Claude, and Gemini.",
  url: "https://prompt-plus-three.vercel.app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getValidatedSession();

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/store-icon-128x128.png" type="image/png" sizes="128x128" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/store-icon-128x128.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider session={session}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <ToastProvider>
                {children}
                <CookieBanner />
                <Analytics />
                <SpeedInsights />
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
