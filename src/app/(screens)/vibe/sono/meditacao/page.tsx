
"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meditations } from "@/lib/meditation-data";
import StaggeredEntry from "@/components/feature/staggered-entry";

export default function MeditacaoPage() {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center gap-3">
                <Link href="/vibe/sono">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Meditação</h1>
                    <p className="text-xs text-muted-foreground">Práticas para acalmar a mente</p>
                </div>
            </header>

            <StaggeredEntry className="grid grid-cols-1 gap-4">
                {meditations.map((meditation) => {
                    const Icon = meditation.icon;
                    return (
                        <Link href={`/vibe/sono/meditacao/${meditation.slug}`} key={meditation.slug}>
                            <Card className="claymorphism bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-all active:scale-[0.98]">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{meditation.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3" /> {meditation.duration}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </StaggeredEntry>
        </div>
    );
}
