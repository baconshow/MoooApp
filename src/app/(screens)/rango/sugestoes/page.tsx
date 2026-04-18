"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ChefHat, BookOpen, Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyLog } from "@/hooks/use-daily-log";
import { suggestMeals, MealSuggestionOutput, SuggestedMeal } from "@/ai/flows/meal-suggester-flow";
import Link from "next/link";
import MacrosRadarChart from "@/components/feature/charts/macros-radar-chart";
import { useAuth } from "@/context/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type SuggestionState = "idle" | "loading" | "success" | "error";

export default function SugestoesPage() {
    const { toast } = useToast();
    const { logs } = useDailyLog();
    const { profile } = useAuth();
    const [state, setState] = useState<SuggestionState>("idle");
    const [suggestions, setSuggestions] = useState<MealSuggestionOutput | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<SuggestedMeal | null>(null);

    const handleGetSuggestions = async () => {
        setState("loading");
        try {
            const recent = Object.values(logs).flatMap(l => l.foodLogs || [])
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
            if (recent.length === 0) {
                toast({ title: "Ops!", description: "Analise pelo menos uma refeição antes." });
                setState("idle");
                return;
            }
            const result = await suggestMeals(recent, profile?.nickname, profile?.aiName, "emagrecimento");
            setSuggestions(result);
            setState("success");
        } catch (error: any) {
            setState("error");
            toast({ variant: "destructive", title: "Erro", description: error.message || "Tente de novo!" });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Link href="/rango" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Rango
            </Link>

            <Card className="claymorphism bg-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ChefHat className="h-6 w-6 text-primary" /> Sugestões do {profile?.aiName || "Kook"}
                    </CardTitle>
                    <CardDescription>Receitas pensadas pra você, baseadas no que comeu recentemente.</CardDescription>
                </CardHeader>

                {(state === "idle" || state === "error") && (
                    <CardContent>
                        <Button className="w-full rounded-xl" onClick={handleGetSuggestions}>
                            <Sparkles className="mr-2 h-4 w-4" /> Me dê ideias!
                        </Button>
                        {state === "error" && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>Não consegui pensar em nada. Tente de novo!</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                )}

                {state === "loading" && (
                    <CardContent>
                        <div className="text-center py-6">
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Vasculhando o livro de receitas...</p>
                        </div>
                        <div className="space-y-4 mt-4">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        </div>
                    </CardContent>
                )}

                {state === "success" && suggestions && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-center italic text-foreground">"{suggestions.naturalObservation}"</p>
                        <div className="grid grid-cols-1 gap-4">
                            {suggestions.suggestions.map((meal, i) => (
                                <Card key={i} className="claymorphism bg-card/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{meal.dishName}</CardTitle>
                                                <CardDescription className="font-medium">{meal.calories} kcal</CardDescription>
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedRecipe(meal)}>
                                                <BookOpen className="mr-2 h-4 w-4" /> Receita
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm italic text-center text-muted-foreground">"{meal.creativeReasoning}"</p>
                                        <div className="mt-3">
                                            <MacrosRadarChart data={meal.macros} compact />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Button className="w-full rounded-xl" onClick={handleGetSuggestions}>
                            <Sparkles className="mr-2 h-4 w-4" /> Mais Ideias
                        </Button>
                    </CardContent>
                )}
            </Card>

            <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
                <DialogContent className="claymorphism max-h-[80vh] bg-card/95 backdrop-blur-lg">
                    {selectedRecipe && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedRecipe.dishName}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 pt-1">
                                    <Clock className="h-4 w-4" /> <span>{selectedRecipe.preparationTime}</span>
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="pr-6 -mr-6">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium mb-2">Ingredientes</h4>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {selectedRecipe.ingredients.map((item, i) => (
                                                <li key={i} className="flex justify-between items-center border-b border-border/50 pb-1">
                                                    <span>{item.name}</span>
                                                    <span className="font-medium text-foreground">{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Modo de Preparo</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedRecipe.preparation}</p>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}