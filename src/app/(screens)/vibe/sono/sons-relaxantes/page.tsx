
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { relaxingSounds } from "@/lib/relaxing-sounds-data";
import { ChevronLeft, Play, Music } from "lucide-react";
import StaggeredEntry from "@/components/feature/staggered-entry";

export default function SonsRelaxantesPage() {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center gap-3">
                <Link href="/vibe/sono">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Sons Relaxantes</h1>
                    <p className="text-xs text-muted-foreground">Ambientes sonoros para o descanso</p>
                </div>
            </header>

            <StaggeredEntry className="grid grid-cols-1 gap-4">
                {relaxingSounds.map((sound) => (
                    <Card key={sound.title} className="claymorphism bg-card/80 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                    <Music className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{sound.title}</CardTitle>
                                    <CardDescription>{sound.description}</CardDescription>
                                </div>
                            </div>
                            <Button asChild size="sm" className="rounded-xl px-6 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
                                <Link href={sound.link} target="_blank" rel="noopener noreferrer">
                                    <Play className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                    </Card>
                ))}
            </StaggeredEntry>
        </div>
    );
}
