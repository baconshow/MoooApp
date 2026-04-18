"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useDailyLog, FoodLog } from "@/hooks/use-daily-log";
import { analyzeFoodImage } from "@/ai/flows/food-analyzer-flow";
import Image from "next/image";
import Link from "next/link";
import MacrosRadarChart, { VitalityClass } from "@/components/feature/charts/macros-radar-chart";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";

const dailyGoals = { protein: 80, carbohydrates: 250, fat: 70, fiber: 25 };
type AnalysisState = "idle" | "analyzing" | "success" | "error";

const MacroBar = ({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) => {
    const pct = goal > 0 ? (value / goal) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium">{Math.round(value)}<span className="text-muted-foreground">/{goal}{unit}</span></span>
            </div>
            <Progress value={pct > 100 ? 100 : pct} className="h-2 rounded-full" indicatorClassName="rounded-full" indicatorStyle={{ backgroundColor: `hsl(var(--${color}))` }} />
        </div>
    );
};

export default function AnalisarPage() {
    const { toast } = useToast();
    const { logs, updateLog } = useDailyLog();
    const { profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<AnalysisState>("idle");
    const [lastAnalysis, setLastAnalysis] = useState<FoodLog | null>(null);
    const todayKey = format(new Date(), "yyyy-MM-dd");

    const allFoodLogs = useMemo(() =>
        Object.values(logs).flatMap(l => l.foodLogs || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    , [logs]);

    useEffect(() => {
        if (allFoodLogs.length > 0 && !lastAnalysis) setLastAnalysis(allFoodLogs[0]);
    }, [allFoodLogs, lastAnalysis]);

    const runAnalysis = async (imageDataUrl: string) => {
        setState("analyzing");
        try {
            const result = await analyzeFoodImage(imageDataUrl, profile?.nickname, profile?.aiName);
            const newLog: FoodLog = { id: crypto.randomUUID(), imageUrl: imageDataUrl, timestamp: new Date().toISOString(), ...result };
            const current = logs[todayKey]?.foodLogs || [];
            updateLog(todayKey, { foodLogs: [newLog, ...current] });
            setLastAnalysis(newLog);
            setState("success");
            toast({ title: "Análise Concluída!", description: result.dishName });
        } catch (error: any) {
            setState("error");
            toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível analisar." });
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => runAnalysis(ev.target?.result as string);
            reader.readAsDataURL(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Link href="/rango" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Rango
            </Link>

            <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Analisar Refeição</CardTitle>
                    <CardDescription>Envie a foto de um prato para análise nutricional.</CardDescription>
                </CardHeader>
                <CardContent>
                    <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept="image/*" capture="environment" />
                    <Button className="w-full rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={state === "analyzing"}>
                        {state === "analyzing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Enviar Imagem
                    </Button>
                </CardContent>
            </Card>

            {state === "analyzing" && (
                <Card className="claymorphism bg-card/80 backdrop-blur-sm text-center py-10">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Analisando sua refeição...</p>
                    <p className="text-xs text-muted-foreground">Aguarde, o {profile?.aiName || "Kook"} já te fala.</p>
                </Card>
            )}

            {state === "error" && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro na Análise</AlertTitle>
                    <AlertDescription>Tente novamente com outra foto.</AlertDescription>
                </Alert>
            )}

            {lastAnalysis && state !== "analyzing" && (
                <>
                    <Card className="claymorphism bg-card/80 backdrop-blur-sm overflow-hidden">
                        <div className="aspect-video w-full relative">
                            <Image src={lastAnalysis.imageUrl} alt={lastAnalysis.dishName || "Refeição"} fill className="object-cover" />
                        </div>
                    </Card>
                    <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-xl">{lastAnalysis.dishName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MacrosRadarChart
                                data={{ protein: lastAnalysis.protein, carbohydrates: lastAnalysis.carbohydrates, fat: lastAnalysis.fat, fiber: lastAnalysis.fiber, sugar: lastAnalysis.sugar }}
                                calories={lastAnalysis.calories}
                                vitalityClass={(lastAnalysis as any).vitalityClass as VitalityClass | undefined}
                                size="lg"
                                showCornerBadges
                            />
                            <div className="space-y-2 pt-2">
                                <MacroBar label="Proteínas" value={lastAnalysis.protein || 0} goal={dailyGoals.protein} unit="g" color="chart-1" />
                                <MacroBar label="Carboidratos" value={lastAnalysis.carbohydrates || 0} goal={dailyGoals.carbohydrates} unit="g" color="chart-4" />
                                <MacroBar label="Gorduras" value={lastAnalysis.fat || 0} goal={dailyGoals.fat} unit="g" color="chart-5" />
                                <MacroBar label="Fibras" value={lastAnalysis.fiber || 0} goal={dailyGoals.fiber} unit="g" color="chart-3" />
                            </div>
                            {lastAnalysis.analysisText && (
                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-sm italic text-muted-foreground text-center">"{lastAnalysis.analysisText}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}