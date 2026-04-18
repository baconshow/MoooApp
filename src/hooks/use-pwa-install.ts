
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI to notify the user they can install the PWA
      setCanInstall(true);
      // PWA install prompt is ready
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Hide the install button
      setDeferredPrompt(null);
      setCanInstall(false);
      // PWA installed successfully
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setCanInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
        toast({
            title: "Instalação não disponível",
            description: "A instalação só pode ser iniciada pelo navegador.",
            variant: "destructive"
        });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // Install accepted
      toast({ title: "MoooApp instalado!", description: "Aproveite a experiência completa."});
    } else {
      // Install dismissed
    }

    // We can only use the prompt once, so clear it.
    setDeferredPrompt(null);
    setCanInstall(false);

  }, [deferredPrompt, toast]);

  return { canInstall, installPWA };
};
