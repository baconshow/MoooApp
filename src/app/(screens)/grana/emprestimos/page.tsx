"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, HandCoins, UserCheck, Plus, Check, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── TYPES ──────────────────────────────────────────────────────

interface Loan {
    id: string;
    personName: string;
    amount: number;
    date: string;
    description?: string;
    settled: boolean;
    settledDate?: string;
}

// ─── PAGE ───────────────────────────────────────────────────────

export default function GranaEmprestimosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isFirebaseEnabled } = useAuth();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loanName, setLoanName] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [loanDescription, setLoanDescription] = useState('');
    const [settledOpen, setSettledOpen] = useState(false);

    // ─── Firestore listener ─────────────────────────────────────
    useEffect(() => {
        if (!user || !isFirebaseEnabled) return;
        const ref = collection(db, 'users', user.uid, 'loans');
        const unsub = onSnapshot(ref, (snap) => {
            const data: Loan[] = [];
            snap.forEach((d) => data.push(d.data() as Loan));
            data.sort((a, b) => b.date.localeCompare(a.date));
            setLoans(data);
        });
        return () => unsub();
    }, [user, isFirebaseEnabled]);

    const active = useMemo(() => loans.filter(l => !l.settled), [loans]);
    const settled = useMemo(() => loans.filter(l => l.settled), [loans]);
    const activeTotal = useMemo(() => active.reduce((s, l) => s + l.amount, 0), [active]);

    // ─── Handlers ───────────────────────────────────────────────

    const handleAdd = async () => {
        if (!user || !loanName.trim() || !loanAmount) return;
        const amount = parseFloat(loanAmount);
        if (isNaN(amount) || amount <= 0) return;

        const id = crypto.randomUUID();
        const loan: Loan = {
            id,
            personName: loanName.trim(),
            amount,
            date: new Date().toISOString(),
            description: loanDescription.trim() || undefined,
            settled: false,
        };

        const ref = doc(db, 'users', user.uid, 'loans', id);
        await setDoc(ref, loan);

        setLoanName('');
        setLoanAmount('');
        setLoanDescription('');
        setIsDialogOpen(false);
        toast({ title: `Emprestou R$ ${amount.toFixed(2)} para ${loan.personName}` });
    };

    const handleSettle = async (loanId: string) => {
        if (!user) return;
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;
        const ref = doc(db, 'users', user.uid, 'loans', loanId);
        await setDoc(ref, { ...loan, settled: true, settledDate: new Date().toISOString() });
        toast({ title: "Marcado como devolvido" });
    };

    const handleUnsettle = async (loanId: string) => {
        if (!user) return;
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;
        const ref = doc(db, 'users', user.uid, 'loans', loanId);
        await setDoc(ref, { ...loan, settled: false, settledDate: undefined });
    };

    const handleDelete = async (loanId: string) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'loans', loanId);
        await deleteDoc(ref);
        toast({ title: "Emprestimo removido" });
    };

    // ─── RENDER ─────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 pb-2">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground">Emprestei</h1>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">

                    {/* Summary */}
                    <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Total emprestado (ativo)</p>
                                    <p className="text-2xl font-bold mt-0.5">R$ {activeTotal.toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10">
                                    <HandCoins className="h-6 w-6 text-amber-400" />
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>{active.length} pendente{active.length !== 1 ? 's' : ''}</span>
                                <span>{settled.length} devolvido{settled.length !== 1 ? 's' : ''}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add button */}
                    <Button onClick={() => setIsDialogOpen(true)} className="w-full rounded-xl font-medium">
                        <Plus className="h-4 w-4 mr-2" /> Registrar Emprestimo
                    </Button>

                    {/* Active loans */}
                    {active.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Pendentes</h3>
                            {active.map(loan => (
                                <Card key={loan.id} className="claymorphism bg-card/80 backdrop-blur-sm">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-amber-500/10">
                                                <UserCheck className="h-4 w-4 text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{loan.personName}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {format(parseISO(loan.date), "dd/MM/yy")}
                                                    {loan.description && ` · ${loan.description}`}
                                                </p>
                                            </div>
                                            <p className="font-bold text-sm text-amber-400">R$ {loan.amount.toFixed(2)}</p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="outline" size="sm"
                                                className="flex-1 h-8 text-xs rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                onClick={() => handleSettle(loan.id)}
                                            >
                                                <Check className="h-3 w-3 mr-1" /> Devolveu
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(loan.id)}>
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Settled loans */}
                    {settled.length > 0 && (
                        <Collapsible open={settledOpen} onOpenChange={setSettledOpen}>
                            <CollapsibleTrigger className="w-full flex items-center justify-between py-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Devolvidos ({settled.length})</h3>
                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", settledOpen && "rotate-180")} />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="space-y-2 pt-1">
                                    {settled.map(loan => (
                                        <Card key={loan.id} className="claymorphism bg-card/60 backdrop-blur-sm opacity-60">
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-emerald-500/10">
                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate line-through">{loan.personName}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Devolvido em {loan.settledDate ? format(parseISO(loan.settledDate), "dd/MM/yy") : '—'}
                                                        </p>
                                                    </div>
                                                    <p className="font-medium text-sm text-muted-foreground">R$ {loan.amount.toFixed(2)}</p>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnsettle(loan.id)}>
                                                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* Empty state */}
                    {loans.length === 0 && (
                        <div className="text-center py-10">
                            <HandCoins className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Nenhum emprestimo registrado.</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Registre quando emprestar dinheiro para alguem.</p>
                        </div>
                    )}

                    <div className="h-6" />
                </div>
            </ScrollArea>

            {/* Add Loan Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="backdrop-blur-xl bg-background/40 border-none shadow-2xl rounded-[2.5rem] w-[95vw] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HandCoins className="h-5 w-5 text-amber-400" /> Novo Emprestimo
                        </DialogTitle>
                        <DialogDescription>Registre dinheiro que voce emprestou.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Para quem?</Label>
                            <Input placeholder="Nome da pessoa" value={loanName} onChange={(e) => setLoanName(e.target.value)} className="h-11" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Quanto?</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                <Input type="number" inputMode="decimal" placeholder="0.00" className="pl-10 h-11 font-medium"
                                    value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Motivo (opcional)</Label>
                            <Input placeholder="Ex: almoco, uber..." value={loanDescription} onChange={(e) => setLoanDescription(e.target.value)} className="h-11" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full rounded-xl font-medium" onClick={handleAdd}>Registrar Emprestimo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
