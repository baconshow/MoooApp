
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { useDoryState } from '@/hooks/use-dory-state';
import { punishmentPhrases, placeholderPhrases } from '@/lib/punishment-phrases';

const MAX_FORGETS = 5;
const RADIUS = 60;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * 0.75; // 3/4 circle

const emojis = ['😅', '🙂', '😉', '😜', '😈', '😈'];
const colors = ['#4ade80', '#a3e635', '#fde047', '#fb923c', '#f87171', '#ef4444'];

const DoryArc = ({ count }: { count: number }) => {
    const progress = count / MAX_FORGETS;
    const strokeDashoffset = ARC_LENGTH * (1 - progress);
    const color = colors[count];
    const emoji = emojis[count];

    return (
        <div className="relative h-36 w-36 flex items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 150 150">
                {/* Background track */}
                <circle
                    cx="75"
                    cy="75"
                    r={RADIUS}
                    fill="transparent"
                    stroke="hsl(var(--muted) / 0.3)"
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={0}
                    transform="rotate(135 75 75)"
                    strokeLinecap="round"
                />
                {/* Foreground arc */}
                <circle
                    cx="75"
                    cy="75"
                    r={RADIUS}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(135 75 75)"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            <div className="text-5xl">{emoji}</div>
        </div>
    );
};


export default function DoryMode() {
    const {
        forgetCount,
        punishmentsRevealed,
        punishmentRevealedToday,
        revealedPunishment,
        incrementForgetCount,
        revealPunishment,
        reset,
    } = useDoryState();
    const { toast } = useToast();
    
    // Ensure placeholder is memoized and stable on client
    const placeholder = useMemo(() => {
        return placeholderPhrases[Math.floor(Math.random() * placeholderPhrases.length)];
    }, [punishmentRevealedToday]); // Reroll placeholder only when punishment state changes


    const handleForget = () => {
        if (forgetCount < MAX_FORGETS) {
            incrementForgetCount();
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    };

    const handleReveal = () => {
        if (punishmentRevealedToday) {
            toast({
                title: "Castigo já revelado hoje.",
                description: "Amanhã tem outro!",
            });
        } else {
            const newPunishment = punishmentPhrases[Math.floor(Math.random() * punishmentPhrases.length)];
            revealPunishment(newPunishment);
        }
    };
    
    const handleReset = () => {
        reset();
        toast({ title: "Contador resetado!", duration: 2000 });
    }

    return (
        <Card className="claymorphism bg-card/80 backdrop-blur-sm text-center relative overflow-hidden">
            <CardHeader>
                <CardTitle>Dory Mode</CardTitle>
                <CardDescription>Contador de esquecimentos</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <DoryArc count={forgetCount} />
                <p className="font-bold text-lg">{forgetCount}/{MAX_FORGETS}</p>
                <Button onClick={handleForget} className="w-full" disabled={forgetCount >= MAX_FORGETS}>
                    Esqueci de novo
                </Button>
                
                <Card 
                    onClick={handleReveal}
                    className="w-full p-4 bg-background/50 cursor-pointer hover:bg-background/70 transition-colors"
                >
                    <p className="font-semibold text-sm">
                        {punishmentRevealedToday ? revealedPunishment : placeholder}
                    </p>
                </Card>

            </CardContent>
            <Button onClick={handleReset} variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground h-8 w-8">
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Resetar</span>
            </Button>
        </Card>
    );
}
