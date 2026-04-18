
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
    <path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4"/>
    <path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853"/>
    <path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04"/>
    <path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 340.6 0 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335"/>
  </svg>
);

const LoadingScreen = () => (
     <div className="flex items-center justify-center h-screen bg-background">
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

export default function LoginPage() {
  const { user, loading, loginWithGoogle, isFirebaseEnabled, profile, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
        // profile is loaded, check if nickname exists
        if (!profileLoading) {
            if (profile?.nickname) {
                router.push("/");
            } else {
                router.push("/welcome");
            }
        }
    }
  }, [user, loading, router, profile, profileLoading]);
  
  if (!isFirebaseEnabled) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
             <Card className="claymorphism text-center max-w-sm">
                <CardHeader>
                    <Image
                      src="https://i.postimg.cc/rsd23Bn5/Mooo-App-2.png"
                      alt="MoooApp Logo"
                      width={80}
                      height={80}
                      className="mx-auto mb-4"
                      priority
                    />
                    <CardTitle>Modo de Desenvolvimento</CardTitle>
                    <CardDescription>A autenticação está desativada neste ambiente. Você pode navegar livremente pelo aplicativo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/')} className="w-full">
                       Acessar o App
                    </Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  if (loading || profileLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center">
        <Image
          src="https://i.postimg.cc/rsd23Bn5/Mooo-App-2.png"
          alt="MoooApp Logo"
          width={120}
          height={120}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vinda ao MoooApp</h1>
        <p className="text-muted-foreground mb-8">Seu espaço pessoal de bem-estar e criatividade.</p>
        
        <Button onClick={loginWithGoogle} className="w-full max-w-xs">
            <GoogleIcon />
            Entrar com o Google
        </Button>
      </div>
    </div>
  );
}
