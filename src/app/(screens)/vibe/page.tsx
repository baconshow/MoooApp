"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { HeartPulse, Moon, Droplets, Calendar } from "lucide-react";
import StaggeredEntry from "@/components/feature/staggered-entry";

const hubCards = [
    {
        title: "Diário de Dor",
        description: "Acompanhe seus sintomas",
        href: "/vibe/dor",
        icon: HeartPulse,
        className: "bg-red-500/10 text-red-400",
    },
    {
        title: "Soninho",
        description: "Registre seu descanso",
        href: "/vibe/sono",
        icon: Moon,
        className: "bg-blue-500/10 text-blue-400",
    },
    {
        title: "Privada",
        description: "Registre seu descarrego diário",
        href: "/vibe/privada",
        icon: Droplets,
        className: "bg-green-500/10 text-green-400",
    },
    {
        title: "Ciclo",
        description: "Calendário do ciclo menstrual",
        href: "/vibe/ciclo",
        icon: Calendar,
        className: "bg-pink-500/10 text-pink-400",
    },
];

export default function VibeHubPage() {
    return (
        <StaggeredEntry className="relative z-10 p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hubCards.map((card) => (
                    <Link href={card.href} key={card.title} className="block">
                        <Card className="claymorphism bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors h-full border-white/5 overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
                                <div className={`p-3 rounded-2xl ${card.className}`}>
                                    <card.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">{card.title}</CardTitle>
                                    <CardDescription className="text-xs opacity-70">{card.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </StaggeredEntry>
    );
}
