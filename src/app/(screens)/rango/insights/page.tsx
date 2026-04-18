"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StaggeredEntry from "@/components/feature/staggered-entry";

export default function InsightsPage() {
    return (
        <StaggeredEntry className="p-4 md:p-8 space-y-6">
            <Link href="/rango" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Rango
            </Link>

            <Card className="claymorphism bg-card/80 backdrop-blur-sm text-center py-16">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardHeader>
                    <CardTitle>Insights Nutricionais</CardTitle>
                    <CardDescription>Cruzamento de dados inteligente com linguagem natural. Em breve!</CardDescription>
                </CardHeader>
            </Card>
        </StaggeredEntry>
    );
}