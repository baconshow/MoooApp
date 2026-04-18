
import type { Metadata, Viewport } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-provider";
import AppStructure from "@/components/feature/app-structure";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

export const metadata: Metadata = {
  title: "MoooApp",
  description: "Seu espaço pessoal de bem-estar e criatividade.",
  manifest: "/manifest.json?v=3",
  icons: {
    icon: '/images/logo-192x192.png?v=3',
    apple: '/images/logo-192x192.png?v=3',
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased", ptSans.variable)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
              <AppStructure>
                {children}
              </AppStructure>
              <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
