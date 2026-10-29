import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Typography is loaded via high-performance preconnected Google Fonts in <head>
// and configured via @theme inline in globals.css (Plus Jakarta Sans + JetBrains Mono)

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-plus-three.vercel.app"),
  title: {
    default: "Prompt+ — Free AI Prompt Architect & Extension for ChatGPT, Claude & Gemini",
    template: "%s | Prompt+ Architect AI",
  },
  description:
    "Turn a rough request into clearer instructions you can review, edit, and use in your AI chat. Free to use, with on-device and built-in processing.",
  keywords: [
    "ChatGPT prompt enhancer",
    "Claude prompt enhancer",
    "Gemini prompt enhancer",
    "AI prompt engineering tool",
    "free prompt optimizer",
    "reusable prompt context",
    "prompt writing assistant",
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
      "Turn a rough request into clearer instructions you can review, edit, and use. Free to use, with on-device and built-in processing options.",
    siteName: "Prompt+ Architect AI",
    images: [
      {
        url: "/prompt-plus-logo.png",
        width: 512,
        height: 512,
        alt: "Prompt+ Architect AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Prompt+ — Free AI Prompt Architect & Extension",
    description:
      "Turn a rough request into a clearer prompt you can review and edit. Free to use, with on-device and built-in processing options.",
    images: ["/prompt-plus-logo.png"],
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
  image: "https://prompt-plus-three.vercel.app/prompt-plus-logo.png",
  logo: "https://prompt-plus-three.vercel.app/prompt-plus-logo.png",
  operatingSystem: "Web, Chrome, Edge, Brave",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0.00",
    priceCurrency: "USD",
  },
  description:
    "Free prompt writing tool and browser extension. Turn a rough request into clearer instructions you can review, edit, and use in ChatGPT, Claude, Gemini, and other AI chat tools.",
  url: "https://prompt-plus-three.vercel.app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <head>
        <link rel="icon" href="/store-icon-128x128.png" type="image/png" sizes="128x128" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/store-icon-128x128.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=function(el){if(el&&el.hasAttribute&&el.hasAttribute('bis_skin_checked')){el.removeAttribute('bis_skin_checked');}};var o=new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='attributes'&&m.attributeName==='bis_skin_checked'){c(m.target);}else if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType===1){c(n);if(n.querySelectorAll){var els=n.querySelectorAll('[bis_skin_checked]');for(var k=0;k<els.length;k++)c(els[k]);}}}}}});o.observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['bis_skin_checked']});}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <ToastProvider>
                {children}
                <Analytics />
                <SpeedInsights />
              </ToastProvider>
            </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
