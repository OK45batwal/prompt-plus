import React from "react";

interface ModelLogoProps {
  className?: string;
  size?: number;
}

export function ChatGptLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ChatGPT Logo"
    >
      <path
        fill="#10A37F"
        d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .75 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zm-9.66-4.13a4.47 4.47 0 0 1-.54-3.01l.14.08 4.79 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.98v5.69a.77.77 0 0 0 .39.67l5.81 3.36-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.9zm16.6 3.84L13.12 8.39l2.02-1.17a.08.08 0 0 1 .07 0l4.83 2.79a4.5 4.5 0 0 1-.67 8.11v-5.68a.79.79 0 0 0-.44-.7zM20.95 8.72l-.14-.08-4.78-2.79a.78.78 0 0 0-.78 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.67zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.78 2.76a.79.79 0 0 0-.4.68v6.72zm1.08-2.48l2.61-1.5 2.61 1.5v3.01l-2.61 1.5-2.61-1.5z"
      />
    </svg>
  );
}

export function ClaudeLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Claude Logo"
    >
      <path
        fill="#CC785C"
        d="M12 2a1.5 1.5 0 0 1 1.5 1.5v4.38l3.1-3.1a1.5 1.5 0 1 1 2.12 2.12L15.62 10H20a1.5 1.5 0 1 1 0 3h-4.38l3.1 3.1a1.5 1.5 0 0 1-2.12 2.12L13.5 15.12V19.5a1.5 1.5 0 1 1-3 0v-4.38l-3.1 3.1a1.5 1.5 0 0 1-2.12-2.12L8.38 13H4a1.5 1.5 0 1 1 0-3h4.38L5.28 6.9a1.5 1.5 0 0 1 2.12-2.12L10.5 7.88V3.5A1.5 1.5 0 0 1 12 2z"
      />
    </svg>
  );
}

export function GeminiLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Gemini Logo"
    >
      <defs>
        <linearGradient id="geminiLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1BA1E3" />
          <stop offset="35%" stopColor="#5B68DE" />
          <stop offset="68%" stopColor="#9C52DE" />
          <stop offset="100%" stopColor="#E8505B" />
        </linearGradient>
      </defs>
      <path
        fill="url(#geminiLogoGrad)"
        d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"
      />
    </svg>
  );
}

export function DeepSeekLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DeepSeek Logo"
    >
      <rect width="24" height="24" rx="5" fill="#0C60FF" />
      <path
        fill="#FFFFFF"
        d="M18.8 11.2c-.5-3.1-3.3-5.4-6.6-5.2-3.4.2-6.2 2.8-6.5 6.2-.2 2.6 1.1 4.9 3.2 6 0 0 .6.4 1.2.1.6-.3.5-.9.5-1.5 0-1.9 1.5-3.4 3.4-3.4 1.2 0 2.2.6 2.8 1.6.3.4.9.5 1.3.2.4-.3.6-.8.4-1.3l-.6-1.3c.3 0 1 0 1.6 0z"
      />
      <circle cx="8.5" cy="10.5" r="1.1" fill="#FFFFFF" />
      <path
        fill="#FFFFFF"
        d="M12.5 15.2c1.3 0 2.5-.6 3.3-1.6.3-.3.2-.8-.2-1.1-.3-.2-.8-.1-1.1.2-.5.7-1.2 1.1-2 1.1-.8 0-1.5-.4-2-1.1-.3-.3-.8-.4-1.1-.2-.4.3-.5.8-.2 1.1.8 1 2 1.6 3.3 1.6z"
      />
    </svg>
  );
}

export function GrokLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Grok Logo"
    >
      <rect width="24" height="24" rx="5" fill="#000000" />
      <path
        fill="#FFFFFF"
        d="M18.244 4.25h2.556l-5.584 6.383 6.568 8.684h-5.144l-4.028-5.267-4.61 5.267H5.446l5.972-6.827L5.116 4.25h5.275l3.642 4.815zm-.897 13.535h1.416L8.98 5.7H7.46z"
      />
    </svg>
  );
}

export function PerplexityLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Perplexity Logo"
    >
      <rect width="24" height="24" rx="5" fill="#142629" />
      <path
        fill="#22D3EE"
        d="M12 4a1 1 0 0 1 1 1v4.09l2.89-2.89a1 1 0 1 1 1.41 1.41L14.41 10.5H18.5a1 1 0 1 1 0 2h-4.09l2.89 2.89a1 1 0 0 1-1.41 1.41L13 13.91V18a1 1 0 1 1-2 0v-4.09l-2.89 2.89a1 1 0 0 1-1.41-1.41L9.59 12.5H5.5a1 1 0 1 1 0-2h4.09L6.7 7.61a1 1 0 0 1 1.41-1.41L11 9.09V5a1 1 0 0 1 1-1z"
      />
      <circle cx="12" cy="11.5" r="1.6" fill="#0E7490" />
    </svg>
  );
}

export function CopilotLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Copilot Logo"
    >
      <defs>
        <linearGradient id="copilotLogoPill1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0078D4" />
          <stop offset="50%" stopColor="#5C2D91" />
          <stop offset="100%" stopColor="#B4009E" />
        </linearGradient>
        <linearGradient id="copilotLogoPill2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E81123" />
          <stop offset="50%" stopColor="#FF6A00" />
          <stop offset="100%" stopColor="#FFB900" />
        </linearGradient>
      </defs>
      <path
        d="M12.5 3.5a5 5 0 0 0-4.3 2.5l-3 5.2a5 5 0 0 0 1.8 6.8l3 1.7a5 5 0 0 0 6.8-1.8l3-5.2a5 5 0 0 0-1.8-6.8L15 4.2a5 5 0 0 0-2.5-.7z"
        fill="url(#copilotLogoPill1)"
      />
      <path
        d="M16 7.5a4 4 0 0 1 3.5 6l-2.4 4.2a4 4 0 0 1-5.5 1.5l-2.4-1.4a4 4 0 0 1-1.5-5.5l2.4-4.2a4 4 0 0 1 3.4-1.6l2.5 1z"
        fill="url(#copilotLogoPill2)"
        fillOpacity="0.95"
      />
    </svg>
  );
}

export function MetaLogo({ className = "", size = 20 }: ModelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Meta Llama Logo"
    >
      <defs>
        <linearGradient id="llamaLogoExactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0081FB" />
          <stop offset="50%" stopColor="#0064E0" />
          <stop offset="100%" stopColor="#004EC4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#llamaLogoExactGrad)"
        d="M16.5 6A5.5 5.5 0 0 0 11 11.5 5.5 5.5 0 0 0 5.5 6 5.5 5.5 0 0 0 0 11.5 5.5 5.5 0 0 0 5.5 17 5.5 5.5 0 0 0 11 11.5 5.5 5.5 0 0 0 16.5 17 5.5 5.5 0 0 0 22 11.5 5.5 5.5 0 0 0 16.5 6zm-11 9A3.5 3.5 0 1 1 9 11.5 3.5 3.5 0 0 1 5.5 15zm11 0a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z"
      />
    </svg>
  );
}
