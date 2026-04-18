"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, PieChart as PieChartIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AmbientBackground } from '@/components/ui/ambient-background';
import {
    useTransactions,
    ACCOUNTS,
    CLASSIFICATION_COLORS,
    TYPE_COLORS,
    CATEGORIES,
    TransactionType,
    Classification,
    Recurrence,
} from '@/hooks/use-transactions';

// --- MANDALA CONFIG ---
const CIRCUMFERENCE = 2 * Math.PI * 100;
const CATEGORY_COLORS: Record<string, { start: string; end: string }> = {
  Moradia:     { start: '#2dd4bf', end: '#14b8a6' },
  Alimentação: { start: '#fb7185', end: '#f43f5e' },
  Transporte:  { start: '#60a5fa', end: '#3b82f6' },
  Saúde:       { start: '#4ade80', end: '#16a34a' },
  Educação:    { start: '#c084fc', end: '#a855f7' },
  Lazer:       { start: '#fbbf24', end: '#d97706' },
  Assinatura:  { start: '#818cf8', end: '#6366f1' },
  Vestuário:   { start: '#f472b6', end: '#e11d48' },
  Cuidados:    { start: '#34d399', end: '#059669' },
  Cartão:      { start: '#a78bfa', end: '#7c3aed' },
  Freelance:   { start: '#2dd4bf', end: '#0d9488' },
  Outros:      { start: '#94a3b8', end: '#475569' },
};

export default function GranaAdicionarPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { addTransaction, transactions } = useTransactions();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [account, setAccount] = useState('Jesse');
    const [type, setType] = useState<TransactionType>('despesa');
    const [classification, setClassification] = useState<Classification>('planejado');
    const [recurrence, setRecurrence] = useState<Recurrence>('unica');
    const [category, setCategory] = useState('Outros');
    const [paid, setPaid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date();
    const currentMonthKey = format(today, 'yyyy-MM');

    const segments = useMemo(() => {
        const monthTxs = transactions.filter(t => t.month === currentMonthKey && t.type === 'despesa');
        const totalsByCategory = monthTxs.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalAmount = Object.values(totalsByCategory).reduce((s, v) => s + v, 0);
        if (totalAmount === 0) return [];

        let accumulatedAngle = -90;
        const GAP = 5;

        return Object.entries(totalsByCategory).map(([cat, val], idx) => {
            const proportion = val / totalAmount;
            const segmentAngle = proportion * 360 - GAP;
            const arcLength = (CIRCUMFERENCE * segmentAngle) / 360;
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Outros'];
            
            const segment = {
                category: cat,
                startAngle: accumulatedAngle,
                arcLength: Math.max(0, arcLength),
                colorStart: colors.start,
                colorEnd: colors.end,
            };
            accumulatedAngle += proportion * 360;
            return segment;
        });
    }, [transactions, currentMonthKey]);

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast({ title: "Preencha a descrição.", variant: "destructive" });
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ title: "Valor inválido.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await addTransaction({
                description: description.trim(),
                amount: parsedAmount,
                account,
                month: currentMonthKey,
                date: new Date().toISOString(),
                type,
                paid,
                paidDate: paid ? new Date().toISOString() : undefined,
                classification,
                recurrence,
                category,
            });

            toast({ title: "Transação salva!", description: `${description} — R$ ${parsedAmount.toFixed(2)}` });
            router.back();
        } catch (err) {
            toast({ title: "Erro ao salvar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <AmbientBackground variant="grana" />
            <div className="relative z-10 flex items-center gap-3 p-4 pb-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground">Nova Transação</h1>
            </div>

            <ScrollArea className="flex-1 relative z-10">
                <div className="p-4 space-y-6 pb-24">
                    <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 220 220" className={cn("w-full h-full", segments.length === 0 && "animate-spin-slow opacity-20")}>
                                <circle cx={110} cy={110} r={100} fill="transparent" stroke="hsl(var(--muted) / 0.1)" strokeWidth={20} />
                                {segments.length > 0 ? segments.map((s, i) => (
                                    <g key={s.category} transform={`rotate(${s.startAngle} 110 110)`}>
                                        <defs>
                                            <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor={s.colorStart} />
                                                <stop offset="100%" stopColor={s.colorEnd} />
                                            </linearGradient>
                                        </defs>
                                        <circle cx={110} cy={110} r={100} fill="transparent" stroke={`url(#grad-${i})`} strokeWidth={20} strokeDasharray={`${s.arcLength} ${CIRCUMFERENCE}`} strokeLinecap="round" />
                                    </g>
                                )) : (
                                    <circle cx={110} cy={110} r={100} fill="transparent" stroke="white" strokeWidth={20} strokeDasharray={`${CIRCUMFERENCE * 0.6} ${CIRCUMFERENCE}`} strokeLinecap="round" transform="rotate(-90 110 110)" />
                                )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <PieChartIcon className="h-5 w-5 text-muted-foreground mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{format(today, 'MMMM', { locale: ptBR })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Descrição</Label>
                            <Input placeholder="Aluguel, Açaí, Salário..." value={description} onChange={(e) => setDescription(e.target.value)} className="h-12" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Valor</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                                <Input type="number" placeholder="0.00" className="pl-12 h-14 text-2xl font-bold" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tipo</Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(Object.keys(TYPE_COLORS) as TransactionType[]).map(t => (
                                        <button key={t} onClick={() => setType(t)} className={cn("py-2 rounded-lg text-[10px] font-bold uppercase transition-all border", type === t ? `${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text} border-current` : "border-white/5 bg-card/40 text-muted-foreground")}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Conta</Label>
                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {ACCOUNTS.slice(0, 3).map(acc => (
                                            <button key={acc.name} onClick={() => setAccount(acc.name)} className={cn("py-2 rounded-lg text-[10px] font-bold uppercase transition-all border", account === acc.name ? `${acc.color} border-current` : "border-white/5 bg-card/40 text-muted-foreground")}>
                                                {acc.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {ACCOUNTS.slice(3).map(acc => (
                                            <button key={acc.name} onClick={() => setAccount(acc.name)} className={cn("py-2 rounded-lg text-[10px] font-bold uppercase transition-all border", account === acc.name ? `${acc.color} border-current` : "border-white/5 bg-card/40 text-muted-foreground")}>
                                                {acc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Classificação</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(Object.keys(CLASSIFICATION_COLORS) as Classification[]).map(c => (
                                    <button key={c} onClick={() => setClassification(c)} className={cn("py-2.5 rounded-xl text-[9px] font-bold uppercase transition-all border", classification === c ? `${CLASSIFICATION_COLORS[c].bg} ${CLASSIFICATION_COLORS[c].text} ${CLASSIFICATION_COLORS[c].border}` : "border-white/5 bg-card/40 text-muted-foreground")}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => setCategory(cat)} className={cn("py-2.5 rounded-xl text-[10px] font-medium transition-all border text-center", category === cat ? "bg-primary/15 text-primary border-primary/30" : "border-white/5 bg-card/40 text-muted-foreground")}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Card className="claymorphism bg-card/80 backdrop-blur-sm border-white/5">
                            <CardContent className="py-3 px-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Já foi pago?</p>
                                    <p className="text-[10px] text-muted-foreground">Marque se a transação já ocorreu</p>
                                </div>
                                <Switch checked={paid} onCheckedChange={setPaid} />
                            </CardContent>
                        </Card>

                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                            {isSubmitting ? "Salvando..." : "Salvar Transação"}
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
