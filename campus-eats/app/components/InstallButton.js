'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-10">
      <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-800 dark:border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-xl">
            <Download size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Install CampusEats</p>
            <p className="text-[10px] opacity-70">Fast access from your home screen</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstall}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Install
          </button>
          <button onClick={() => setIsVisible(false)} className="p-2 opacity-50">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}