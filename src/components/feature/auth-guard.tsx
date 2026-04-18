
"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const SplashScreen = () => (
    <div className="flex items-center justify-center h-screen w-screen fixed inset-0 bg-background z-50">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Image
                src="https://i.postimg.cc/rsd23Bn5/Mooo-App-2.png" 
                alt="MoooApp Logo"
                width={200}
                height={200}
                priority
            />
        </motion.div>
    </div>
);


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading, profileLoading, isFirebaseEnabled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // If Firebase is disabled, we don't need auth or splash.
    if (!isFirebaseEnabled) {
      setShowSplash(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Keep splash for 2s
    return () => clearTimeout(timer);
  }, [isFirebaseEnabled]);

  useEffect(() => {
    if (showSplash || authLoading || profileLoading) {
      return; 
    }
    
    // If firebase is disabled, allow access everywhere.
    if (!isFirebaseEnabled) {
        return;
    }

    // If user is not logged in, redirect to login page, unless they are already there.
    if (!user) {
      if (pathname !== '/login') {
        router.push("/login");
      }
      return;
    }
    
    // If user is logged in...
    if (user) {
        // ...but has no profile, redirect to welcome page
        if (!profile?.nickname) {
            if (pathname !== '/welcome') {
                router.push('/welcome');
            }
        } 
        // ...and has a profile, but is on login/welcome, redirect to home
        else if (pathname === '/login' || pathname === '/welcome') {
            router.push('/');
        }
    }

  }, [user, profile, authLoading, profileLoading, router, showSplash, isFirebaseEnabled, pathname]);

  
  if (showSplash || (isFirebaseEnabled && (authLoading || (user && profileLoading)))) {
    return <SplashScreen />;
  }
  
  // Render children if everything is loaded and checks are passed.
  return <>{children}</>;
}
