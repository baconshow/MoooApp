
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Trash2, X, Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDaysInMonth, isToday, isAfter, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AmbientBackground } from '@/components/ui/ambient-background';
import {
    useTransactions,
    Transaction,
    CLASSIFICATION_COLORS,
    TYPE_COLORS,
    ACCOUNTS,
} from '@/hooks/use-transactions';

function getHeatmapClass(amount: number, max: number): string {
    if (amount === 0) return '';
    const intensity = amount / Math.max(max, 1);
    if (intensity < 0.25) return 'bg-emerald-500/20 text-emerald-300';
    if (intensity < 0.5) return 'bg-yellow-500/20 text-yellow-300';
    if (intensity < 0.75) return 'bg-orange-500/20 text-orange-300';
    return 'bg-red-500/20 text-red-300';
}

export default function GranaHistoricoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { transactions, togglePaid, deleteTransaction } = useTransactions();

    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState<string | null>(null);

    const today = new Date();
    const currentMonthKey = format(calendarMonth, 'yyyy-MM');

    const monthTransactions = useMemo(() => {
        let txs = transactions.filter(t => t.month === currentMonthKey);
        if (filterType) txs = txs.filter(t => t.type === filterType);
        if (selectedDate) txs = txs.filter(t => isSameDay(new Date(t.date), selectedDate));
        return txs;
    }, [transactions, currentMonthKey, filterType, selectedDate]);

    const heatmapData = useMemo(() => {
        const monthTxs = transactions.filter(t => t.month === currentMonthKey && t.type === 'despesa');
        const data: Record<string, number> = {};
        let max = 0;

        const startM = startOfMonth(calendarMonth);
        const endM = endOfMonth(calendarMonth);
        eachDayOfInterval({ start: startM, end: endM }).forEach(day => {
            const key = format(day, 'yyyy-MM-dd');
            const total = monthTxs.filter(t => isSameDay(new Date(t.date), day)).reduce((s, t) => s + t.amount, 0);
            data[key] = total;
            if (total > max) max = total;
        });

        return { data, max };
    }, [transactions, currentMonthKey, calendarMonth]);

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getDay(startOfMonth(calendarMonth));
        const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        const cells: React.ReactNode[] = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`e-${i}`} className="aspect-square" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
            const key = format(date, 'yyyy-MM-dd');
            const amount = heatmapData.data[key] || 0;
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(selectedDate, date);
            const isFuture = isAfter(date, today);

            cells.push(
                <button
                    key={key}
                    onClick={() => !isFuture && setSelectedDate(isSelected ? undefined : date)}
                    disabled={isFuture}
                    className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                        isFuture && "opacity-30",
                        !isFuture && "hover:ring-1 hover:ring-white/20",
                        isSelected && "ring-2 ring-primary",
                        isTodayDate && !isSelected && "ring-1 ring-white/30",
                        amount > 0 ? getHeatmapClass(amount, heatmapData.max) : "text-muted-foreground",
                    )}
                >
                    <span className={cn("font-medium", isTodayDate && "text-white")}>{d}</span>
                    {amount > 0 && <span className="text-[8px] leading-none mt-0.5 opacity-80">{amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0)}</span>}
                </button>
            );
        }

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCalendarMonth(p => subMonths(p, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-bold uppercase tracking-widest">{format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCalendarMonth(p => addMonths(p, 1))} disabled={isSameMonth(calendarMonth, today)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((d, i) => <div key={i} className="text-center text-[10px] text-muted-foreground font-bold py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{cells}</div>
            </div>
        );
    };

    const handleDelete = async () => {
        if (!txToDelete) return;
        await deleteTransaction(txToDelete.id);
        setTxToDelete(null);
        toast({ title: "Transação removida" });
    };

    return (
        <div className="flex flex-col h-full">
            <AmbientBackground variant="grana" />
            
            <div className="relative z-10 flex items-center gap-3 p-4 pb-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground flex-1">Histórico</h1>
                {selectedDate && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setSelectedDate(undefined)}>
                        <X className="h-3 w-3 mr-1" /> Limpar
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 relative z-10">
                <div className="p-4 space-y-5 pb-24">
                    <Card className="claymorphism bg-card/80 backdrop-blur-sm border-white/5">
                        <CardContent className="pt-4">{renderCalendar()}</CardContent>
                    </Card>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setFilterType(null)} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border shrink-0 transition-all", !filterType ? "bg-primary/20 border-primary text-primary" : "border-white/5 bg-card/40 text-muted-foreground")}>Todos</button>
                        {(['despesa', 'receita', 'caixinha', 'planos'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(filterType === t ? null : t)} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border shrink-0 transition-all", filterType === t ? `${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text} border-current` : "border-white/5 bg-card/40 text-muted-foreground")}>{t}</button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {monthTransactions.length > 0 ? (
                            monthTransactions.map(tx => {
                                const classColors = CLASSIFICATION_COLORS[tx.classification as keyof typeof CLASSIFICATION_COLORS];
                                const typeColors = TYPE_COLORS[tx.type as keyof typeof TYPE_COLORS];
                                const accColor = ACCOUNTS.find(a => a.name === tx.account)?.color || '';

                                return (
                                    <Card key={tx.id} className="claymorphism bg-card/80 backdrop-blur-sm border-white/5 group">
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                                <button onClick={() => togglePaid(tx.id)} className={cn("mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all", tx.paid ? "bg-emerald-500/20 border-emerald-500/50" : "border-white/10 hover:border-white/30")}>
                                                    {tx.paid && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm font-bold", tx.paid && "line-through opacity-40")}>{tx.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", typeColors.bg, typeColors.text)}>{tx.type}</span>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", classColors.bg, classColors.text)}>{tx.classification}</span>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", accColor)}>{tx.account}</span>
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 text-muted-foreground">{tx.category}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={cn("text-sm font-bold", tx.type === 'receita' ? 'text-emerald-400' : 'text-foreground', tx.paid && "opacity-40")}>
                                                        {tx.type === 'receita' ? '+' : '-'}R${tx.amount.toFixed(0)}
                                                    </span>
                                                    <button onClick={() => setTxToDelete(tx)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-16">
                                <Wallet className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vazio por aqui</p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            <Dialog open={!!txToDelete} onOpenChange={(o) => !o && setTxToDelete(null)}>
                <DialogContent className="backdrop-blur-xl bg-background/40 border-none shadow-2xl rounded-[2.5rem] w-[95vw] max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remover transação?</DialogTitle>
                        <DialogDescription>{txToDelete?.description} — R$ {txToDelete?.amount.toFixed(2)}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button variant="outline" className="flex-1 rounded-xl border-white/5" onClick={() => setTxToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete}>Remover</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
