
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserProfile } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import StaggeredEntry from '@/components/feature/staggered-entry';
import { useToast } from '@/hooks/use-toast';

export default function WelcomePage() {
    const { user, profile, updateProfile, loading, profileLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [nickname, setNickname] = useState('');
    const [aiName, setAiName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // If user is not logged in or loading, redirect to login
        if (!loading && !user) {
            router.push('/login');
        }
        // If profile already exists, redirect to home
        if (!profileLoading && profile?.nickname) {
            router.push('/');
        }
    }, [user, loading, profile, profileLoading, router]);

    const handleSave = async () => {
        if (!nickname.trim()) {
            toast({
                title: "Apelido é obrigatório!",
                description: "Por favor, nos diga como devemos te chamar.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        const newProfile: UserProfile = {
            nickname,
            aiName: aiName.trim() || 'Kook',
        };

        try {
            await updateProfile(newProfile);
            toast({
                title: `Bem-vindo(a), ${nickname}!`,
                description: "Seu perfil foi configurado com sucesso.",
            });
            router.push('/');
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast({
                title: "Erro ao salvar perfil",
                description: "Não foi possível salvar suas informações. Tente novamente.",
                variant: "destructive"
            });
            setIsSaving(false);
        }
    };
    
    if (loading || profileLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
            <StaggeredEntry>
                <Card className="w-full max-w-md claymorphism">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Quase lá!</CardTitle>
                        <CardDescription>Vamos configurar seu perfil para uma experiência mais pessoal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nickname">Como podemos te chamar?</Label>
                            <Input
                                id="nickname"
                                placeholder="Seu apelido"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                            />
                             <p className="text-xs text-muted-foreground">Este será seu nome de usuário no app.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="aiName">Qual será o nome do seu assistente?</Label>
                            <Input
                                id="aiName"
                                placeholder="Kook (padrão)"
                                value={aiName}
                                onChange={(e) => setAiName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Ele te dará conselhos e sugestões.</p>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving || !nickname.trim()} className="w-full">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar e Começar
                        </Button>
                    </CardContent>
                </Card>
            </StaggeredEntry>
        </div>
    );
}
