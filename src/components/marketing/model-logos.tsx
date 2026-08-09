import React from "react";

interface ModelLogoProps {
  className?: string;
  size?: number;
}

export function ChatGptLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.28 9.69a6.27 6.27 0 0 0-.54-5.15 6.34 6.34 0 0 0-6.87-3.07 6.27 6.27 0 0 0-4.78-2.12 6.34 6.34 0 0 0-6.1 4.41 6.27 6.27 0 0 0-4.23 3.07 6.34 6.34 0 0 0 .78 7.48 6.27 6.27 0 0 0 .54 5.15 6.34 6.34 0 0 0 6.87 3.07 6.27 6.27 0 0 0 4.78 2.12 6.34 6.34 0 0 0 6.1-4.41 6.27 6.27 0 0 0 4.23-3.07 6.34 6.34 0 0 0-.78-7.48zM14.28 21.6a4.8 4.8 0 0 1-3.07-1.12l.15-.08 5.07-2.93a.82.82 0 0 0 .41-.71v-5.91l2.13 1.23a.08.08 0 0 1 .04.06v5.89a4.83 4.83 0 0 1-4.73 4.57zm-10.12-4.4a4.8 4.8 0 0 1-.57-3.21l.15.09 5.07 2.93a.82.82 0 0 0 .83 0l5.12-2.96v2.46a.08.08 0 0 1-.03.07l-5.1 2.94a4.83 4.83 0 0 1-5.47-.32zm-1.33-11a4.8 4.8 0 0 1 2.5-2.09v.17v5.86a.82.82 0 0 0 .41.71l5.12 2.96-2.13 1.23a.08.08 0 0 1-.07 0l-5.1-2.95a4.83 4.83 0 0 1-.73-5.89zm17.47 4.1l-5.12-2.96 2.13-1.23a.08.08 0 0 1 .07 0l5.1 2.95a4.83 4.83 0 0 1-.74 8.61v-6.03a.82.82 0 0 0-.44-.74zm2.11-3.2l-.15-.09-5.07-2.93a.82.82 0 0 0-.83 0l-5.12 2.96v-2.46a.08.08 0 0 1 .03-.07l5.1-2.94a4.83 4.83 0 0 1 6.04 5.43zm-13.36 4.38l2.74-1.58 2.74 1.58v3.17l-2.74 1.58-2.74-1.58z" />
    </svg>
  );
}

export function ClaudeLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.6 13.7a.8.8 0 0 1-1.1.2L12 14.3l-2.5 1.6a.8.8 0 0 1-1.1-.2.8.8 0 0 1 .2-1.1L11.1 13 8.6 11.4a.8.8 0 0 1-.2-1.1.8.8 0 0 1 1.1-.2l2.5 1.6 2.5-1.6a.8.8 0 0 1 1.1.2.8.8 0 0 1-.2 1.1L12.9 13l2.5 1.6a.8.8 0 0 1 .2 1.1z" />
    </svg>
  );
}

export function GeminiLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
    </svg>
  );
}

export function DeepSeekLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-2h2zm0-4h-2V7.5h2z" />
    </svg>
  );
}

export function GrokLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PerplexityLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm6 14.2l-6 3.75-6-3.75V8.8l6-3.75 6 3.75v7.4zM12 7L7 10v4l5 3 5-3v-4l-5-3z" />
    </svg>
  );
}

export function CopilotLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  );
}

export function MetaLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.5 6A5.5 5.5 0 0 0 11 11.5 5.5 5.5 0 0 0 5.5 6 5.5 5.5 0 0 0 0 11.5 5.5 5.5 0 0 0 5.5 17 5.5 5.5 0 0 0 11 11.5 5.5 5.5 0 0 0 16.5 17 5.5 5.5 0 0 0 22 11.5 5.5 5.5 0 0 0 16.5 6zm-11 9A3.5 3.5 0 1 1 9 11.5 3.5 3.5 0 0 1 5.5 15zm11 0a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z" />
    </svg>
  );
}
