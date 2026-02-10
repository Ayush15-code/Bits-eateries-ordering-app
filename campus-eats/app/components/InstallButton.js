"use client";
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all animate-bounce"
    >
      <Download size={14} /> Install App
    </button>
  );
}