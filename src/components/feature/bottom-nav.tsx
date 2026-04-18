"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/" || pathname === "/home";
    return href !== "/" && pathname.startsWith(href);
  };
  
  const getIconColor = (href: string) => {
    if (!isActive(href)) return 'text-white/40';
    switch(href) {
      case '/home': return 'text-pink-400';
      case '/vibe': return 'text-red-400';
      case '/grana': return 'text-emerald-400';
      case '/rango': return 'text-amber-400';
      default: return 'text-white';
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pointer-events-none">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4 pt-4">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
            <div className="flex flex-col items-center gap-1 p-2">
              <item.icon className={cn("h-5 w-5 transition-colors", getIconColor(item.href))} />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                isActive(item.href) ? 'text-white opacity-100' : 'text-white opacity-40'
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
