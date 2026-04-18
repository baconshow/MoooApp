
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getActiveNavItem } from '@/lib/nav-items';
import { useEffect, useState } from "react";
import { MoreVertical, LayoutDashboard, Settings, Sun, Moon, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-provider";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export default function AppHeader() {
  const pathname = usePathname();
  const [activeTitle, setActiveTitle] = useState(getActiveNavItem(pathname)?.label || 'MoooApp');
  const { theme, setTheme } = useTheme();
  const { canInstall, installPWA } = usePWAInstall();

  useEffect(() => {
    const newTitle = getActiveNavItem(pathname)?.label || 'MoooApp';
    if (newTitle !== activeTitle) {
      setActiveTitle(newTitle);
    }
  }, [pathname, activeTitle]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Gradient overlay — same technique as bottom-nav but inverted */}
      <div className="h-20 bg-gradient-to-b from-black via-black/80 to-transparent" />

      {/* Content — positioned on top of gradient */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pointer-events-auto md:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="https://i.postimg.cc/rsd23Bn5/Mooo-App-2.png"
            alt="MoooApp Logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
            priority
            data-ai-hint="logo"
          />
          <div className="flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeTitle}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="text-xl font-bold text-foreground tracking-tight"
              >
                {activeTitle}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 claymorphism bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer py-2.5">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer py-2.5">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2.5" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium">{theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}</span>
              </DropdownMenuItem>
              {canInstall && (
                <>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="cursor-pointer py-2.5 text-primary" onClick={installPWA}>
                    <Download className="h-4 w-4 mr-2" />
                    <span className="font-bold">Instalar MoooApp</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
