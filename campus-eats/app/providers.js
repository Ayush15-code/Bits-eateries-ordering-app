'use client';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    // Must be attribute="class" for Tailwind v4 to detect .dark
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}