
"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "./auth-guard";
import AppHeader from "./app-header";
import BottomNav from "./bottom-nav";

const noNavRoutes = ['/login', '/welcome'];

export default function AppStructure({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showNav = !noNavRoutes.includes(pathname);

    if (!showNav) {
        return (
             <AuthGuard>
                {children}
            </AuthGuard>
        )
    }

    return (
        <AuthGuard>
            <div className="flex flex-col h-screen overflow-hidden">
                <AppHeader />
                <main className="flex-grow pt-16 pb-20 overflow-y-auto">
                    {children}
                </main>
                <BottomNav />
            </div>
        </AuthGuard>
    );
}
