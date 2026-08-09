import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { auth } from "@/lib/auth/config";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    type: "website",
    locale: "en_US",
    url: "https://prompt-plus-three.vercel.app",
    title: "Prompt+ — Free AI Prompt Architect for ChatGPT, Claude & Gemini",
    description:
      "Transform simple prompts into master engineering specs directly inside ChatGPT & Claude. 100% Free — On-Device AI & zero API key required.",
    siteName: "Prompt+ Architect AI",
    images: [
      {
        url: "/store-screenshot-1280x800.png",
        width: 1280,
        height: 800,
        alt: "Prompt+ Architect AI Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt+ — Free AI Prompt Architect & Extension",
    description:
      "100% Free AI Prompt Engineering tool & Chrome Extension. On-Device Gemini Nano execution + Cross-AI context bridge.",
    images: ["/store-screenshot-1280x800.png"],
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Prompt+ Architect AI",
  operatingSystem: "Web, Chrome, Edge, Brave",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0.00",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1280",
  },
  description:
    "Free AI prompt engineering tool & browser extension that turns simple inputs into production-grade prompts for ChatGPT, Claude, and Gemini.",
  url: "https://prompt-plus-three.vercel.app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
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
