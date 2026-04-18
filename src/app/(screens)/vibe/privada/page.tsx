"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Droplets, ArrowLeft } from 'lucide-react';
import { startOfToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDailyLog } from '@/hooks/use-daily-log';
import { bowelMovementPhrases } from '@/lib/dory-phrases';
import Link from 'next/link';

export default function SessaoPrivadaPage() {
    const { toast } = useToast();
    const { logs, updateLog } = useDailyLog();
    const today = startOfToday();
    const todayKey = format(today, 'yyyy-MM-dd');
    const hasBowelMovement = logs[todayKey]?.bowelMovement;

    const handleToggle = () => {
        const newState = !hasBowelMovement;
        updateLog(todayKey, { bowelMovement: newState });
        if (newState) {
            toast({ 
                title: bowelMovementPhrases[Math.floor(Math.random() * bowelMovementPhrases.length)],
                duration: 3000 
            });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Link href="/vibe" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
            </Link>

            <Card className="claymorphism bg-card/80 backdrop-blur-sm text-center py-10">
                <CardHeader>
                    <CardTitle className="text-xl">Sessão do Descarrego</CardTitle>
                    <CardDescription>Hoje você já deu aquela aliviada?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <button 
                        onClick={handleToggle}
                        className={cn(
                            "w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-500",
                            hasBowelMovement 
                                ? "bg-primary/20 border-2 border-primary scale-110 shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                                : "bg-muted/10 border-2 border-dashed border-white/10"
                        )}
                    >
                        {hasBowelMovement ? '💩' : '🚽'}
                    </button>
                    <p className={cn("text-sm font-bold uppercase tracking-widest transition-colors", hasBowelMovement ? "text-primary" : "text-muted-foreground")}>
                        {hasBowelMovement ? "Registro concluído!" : "Toque para registrar"}
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                <Card className="claymorphism bg-card/40 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                            <Droplets className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">Frequência Semanal</p>
                    </div>
                    <p className="text-lg font-bold">Excelente ✨</p>
                </Card>
            </div>
        </div>
    );
}
