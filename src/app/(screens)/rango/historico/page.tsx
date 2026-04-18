
"use client";

import { useState, useMemo } from 'react';
import { useDailyLog, FoodLog } from '@/hooks/use-daily-log';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MacrosRadarChart from '@/components/feature/charts/macros-radar-chart';
import StaggeredEntry from '@/components/feature/staggered-entry';
import { Skeleton } from '@/components/ui/skeleton';
import FoodGallery from '@/components/feature/food-gallery';
import { ArrowLeft, X, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const AnalysisResultCard = ({ analysis }: { analysis: FoodLog }) => (
    <div className="space-y-6">
        <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
            <Image 
                src={analysis.imageUrl} 
                alt={analysis.dishName || 'Refeição'} 
                fill 
                className="object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-8">
                <h3 className="text-2xl font-bold text-white">{analysis.dishName}</h3>
                <p className="text-primary font-bold text-lg">{analysis.calories} kcal</p>
            </div>
        </div>

        <div className="px-2 space-y-6 pb-8">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{format(new Date(analysis.timestamp), "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{format(new Date(analysis.timestamp), "HH:mm")}</span>
                </div>
            </div>

            <div className="bg-black/20 rounded-[2rem] p-4 border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 text-center">Bio-Análise</h4>
                <MacrosRadarChart 
                    data={{
                        protein: analysis.protein,
                        carbohydrates: analysis.carbohydrates,
                        fat: analysis.fat,
                        fiber: analysis.fiber,
                        sugar: analysis.sugar,
                    }} 
                    vitalityClass={analysis.vitalityClass}
                    size="md" 
                />
            </div>

            {analysis.analysisText && (
                <div className="relative p-6 rounded-[2rem] bg-primary/10 border border-primary/20 overflow-hidden text-center">
                    <p className="text-sm italic leading-relaxed text-foreground/90">
                        "{analysis.analysisText}"
                    </p>
                </div>
            )}
        </div>
    </div>
);

export default function HistoricoPage() {
    const { logs, loading } = useDailyLog();
    const [selectedLog, setSelectedLog] = useState<FoodLog | null>(null);

    const allFoodLogs = useMemo(() => 
        Object.values(logs).flatMap(log => log.foodLogs || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    , [logs]);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <Link href="/rango">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">Histórico</h1>
                <div className="w-10" />
            </header>

            <StaggeredEntry className="space-y-6">
                 <Card className="claymorphism bg-card/80 backdrop-blur-sm border-white/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Sua Jornada</CardTitle>
                        <CardDescription>Toque para ver os detalhes da bio-análise.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="grid grid-cols-3 gap-2">
                                {[...Array(9)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                             </div>
                        ) : (
                           <FoodGallery 
                                foodLogs={allFoodLogs} 
                                onImageClick={(log) => setSelectedLog(log)}
                            />
                        )}
                    </CardContent>
                </Card>
            </StaggeredEntry>

            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="border-none bg-background/40 backdrop-blur-2xl p-0 h-[90vh] max-w-[95vw] sm:max-w-[450px] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
                    <button 
                        onClick={() => setSelectedLog(null)}
                        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {selectedLog ? (
                        <ScrollArea className="flex-1 px-4 pt-4">
                            <div className="p-2">
                                <AnalysisResultCard analysis={selectedLog} />
                            </div>
                        </ScrollArea>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
