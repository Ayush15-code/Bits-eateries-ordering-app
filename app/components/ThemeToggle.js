'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="p-2 w-9 h-9" />; // Placeholder while loading

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-all hover:scale-110 shadow-sm border border-gray-200 dark:border-gray-700"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}