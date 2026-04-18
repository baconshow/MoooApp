"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, History, HandCoins, Target, TrendingUp, TrendingDown, Sliders } from "lucide-react";
import StaggeredEntry from "@/components/feature/staggered-entry";
import { useTransactions } from "@/hooks/use-transactions";
import { useDailyLog } from "@/hooks/use-daily-log";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useHubGoal } from "@/hooks/use-hub-goal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GranaHubPage() {
    const { getMonthMetrics, transactions, loading: txLoading } = useTransactions();
    const { logs } = useDailyLog();
    const { goal, setNeedsOnboarding } = useHubGoal('grana');
    
    const today = new Date();
    const currentMonthKey = format(today, "yyyy-MM");

    // ─── LEGACY DATA INTEGRATION ───────────────────────────────
    const legacyExpenses = useMemo(() => {
        return Object.entries(logs).flatMap(([date, log]) =>
            (log.expenses || []).map(e => ({
                id: e.id,
                description: e.category, 
                amount: e.amount,
                account: 'Casa',
                month: date.substring(0, 7), 
                date: e.date,
                type: 'despesa' as const,
                paid: true,
                classification: 'extra' as const,
                recurrence: 'unica' as const,
                category: e.category,
                createdAt: e.date,
                isLegacy: true,
            }))
        );
    }, [logs]);

    const allTransactions = useMemo(() => {
        const newIds = new Set(transactions.map(t => t.id));
        const uniqueLegacy = legacyExpenses.filter(e => !newIds.has(e.id));
        return [...transactions, ...uniqueLegacy].sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, legacyExpenses]);

    const metrics = useMemo(() => {
        const monthTxs = allTransactions.filter(t => t.month === currentMonthKey);
        const receitas = monthTxs.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
        const despesas = monthTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
        return {
            receitas,
            despesas,
            saldo: receitas - despesas
        };
    }, [allTransactions, currentMonthKey]);

    const budgetLimit = goal?.details?.monthlySpendingLimit || 3000;
    const budgetProgress = budgetLimit > 0 ? (metrics.despesas / budgetLimit) * 100 : 0;

    const coherenceStatus = useMemo(() => {
        if (!goal) return null;
        if (budgetProgress > 100) return { label: 'Crítico', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
        if (budgetProgress > 85) return { label: 'Atenção', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
        return { label: 'Sob controle', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }, [budgetProgress, goal]);

    const hubCards = [
        { title: "Adicionar Transação", description: "Nova receita ou gasto", href: "/grana/adicionar", icon: Plus, className: "bg-primary/10 text-primary" },
        { title: "Histórico", description: "Calendário e detalhes", href: "/grana/historico", icon: History, className: "bg-blue-500/10 text-blue-400" },
        { title: "Emprestei", description: "Controle de dívidas", href: "/grana/emprestimos", icon: HandCoins, className: "bg-amber-500/10 text-amber-400" },
        { title: "Metas e Orçamento", description: "Templates e limites", href: "/grana/metas", icon: Target, className: "bg-emerald-500/10 text-emerald-400" },
    ];

    return (
        <StaggeredEntry className="relative z-10 p-4 md:p-8 space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{goal?.objectiveLabel || 'Seu controle financeiro'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setNeedsOnboarding(true)} className="rounded-xl text-muted-foreground">
                    <Sliders className="h-5 w-5" />
                </Button>
            </div>

            <Card className="claymorphism bg-card/80 backdrop-blur-sm overflow-hidden border-white/5">
                <CardHeader className="pb-2 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base capitalize font-bold">{format(today, "MMMM yyyy", { locale: ptBR })}</CardTitle>
                            {coherenceStatus && (
                                <span className={cn("text-[9px] uppercase font-bold tracking-tighter px-2 py-0.5 rounded-full border", coherenceStatus.color)}>
                                    {coherenceStatus.label}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-emerald-400">R$ {metrics.saldo.toFixed(0)}</span>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Saldo Atual</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-400" /> Receitas
                            </p>
                            <p className="text-lg font-bold text-emerald-400">R$ {metrics.receitas.toFixed(0)}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                                <TrendingDown className="h-3 w-3 text-red-400" /> Despesas
                            </p>
                            <p className="text-lg font-bold text-red-400">R$ {metrics.despesas.toFixed(0)}</p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Orçamento Mensal</p>
                            <p className="text-xs font-bold">R$ {metrics.despesas.toFixed(0)} <span className="text-muted-foreground font-normal">/ {budgetLimit}</span></p>
                        </div>
                        <Progress
                            value={budgetProgress > 100 ? 100 : budgetProgress}
                            className="h-2.5 rounded-full bg-white/5"
                            indicatorClassName="rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            indicatorStyle={{ backgroundColor: budgetProgress > 90 ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hubCards.map((card) => (
                    <Link href={card.href} key={card.title} className="block group">
                        <Card className="claymorphism bg-card/80 backdrop-blur-sm group-hover:bg-card/95 transition-all h-full border-white/5 overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
                                <div className={cn("p-3.5 rounded-2xl transition-transform group-hover:scale-110", card.className)}>
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
