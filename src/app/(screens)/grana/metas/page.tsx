
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Target, Download, Zap, Settings, Pencil, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AmbientBackground } from '@/components/ui/ambient-background';
import {
    useTransactions,
    RecurringTemplate,
    CLASSIFICATION_COLORS,
    TYPE_COLORS,
} from '@/hooks/use-transactions';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GranaMetasPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const {
        transactions, templates, loading,
        toggleTemplate, updateTemplate, initDefaultTemplates,
        generateMonthFromTemplates, getMonthMetrics, deleteTemplate,
    } = useTransactions();

    const today = new Date();
    const currentMonthKey = format(today, 'yyyy-MM');
    const monthMetrics = getMonthMetrics(currentMonthKey);

    const [budgetLimit, setBudgetLimit] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Budget Logic ---
    useEffect(() => {
        if (!user) return;
        const loadBudget = async () => {
            const budgetRef = doc(db, 'users', user.uid, 'settings', 'budget');
            const snap = await getDoc(budgetRef);
            if (snap.exists()) setBudgetLimit(snap.data().monthlyLimit.toString());
        };
        loadBudget();
    }, [user]);

    const handleSaveBudget = async () => {
        const val = parseFloat(budgetLimit);
        if (isNaN(val) || !user) return;
        try {
            const budgetRef = doc(db, 'users', user.uid, 'settings', 'budget');
            await setDoc(budgetRef, { monthlyLimit: val }, { merge: true });
            toast({ title: "Limite atualizado!" });
        } catch (e) {
            toast({ title: "Erro ao salvar meta", variant: "destructive" });
        }
    };

    // --- Templates Logic ---
    useEffect(() => {
        if (!loading && templates.length === 0) initDefaultTemplates();
    }, [loading, templates.length, initDefaultTemplates]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const count = await generateMonthFromTemplates(currentMonthKey);
            toast({ title: `${count} transações geradas para ${format(today, 'MMMM', { locale: ptBR })}` });
        } catch (err) {
            toast({ title: "Erro ao gerar.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveEditTemplate = async () => {
        if (!editingTemplate) return;
        const amount = parseFloat(editAmount);
        if (isNaN(amount) || amount < 0) return;
        await updateTemplate(editingTemplate.id, { amount });
        setEditingTemplate(null);
        toast({ title: "Valor atualizado" });
    };

    const renderTemplateGroup = (title: string, tpls: RecurringTemplate[], icon: React.ReactNode) => {
        if (tpls.length === 0) return null;
        return (
            <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                    {icon} {title}
                </h3>
                {tpls.map(tpl => (
                    <Card key={tpl.id} className={cn("claymorphism bg-card/80 backdrop-blur-sm border-white/5 transition-opacity", !tpl.enabled && "opacity-40")}>
                        <CardContent className="p-3 flex items-center gap-3">
                            <Switch checked={tpl.enabled} onCheckedChange={() => toggleTemplate(tpl.id)} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{tpl.description}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", CLASSIFICATION_COLORS[tpl.classification as keyof typeof CLASSIFICATION_COLORS].bg, CLASSIFICATION_COLORS[tpl.classification as keyof typeof CLASSIFICATION_COLORS].text)}>{tpl.classification}</span>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{tpl.account}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold">R${tpl.amount.toFixed(0)}</span>
                                <button onClick={() => { setEditingTemplate(tpl); setEditAmount(tpl.amount.toString()); }} className="p-1 hover:bg-white/5 rounded">
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <AmbientBackground variant="grana" />
            <div className="relative z-10 flex items-center gap-3 p-4 pb-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground">Metas e Orçamento</h1>
            </div>

            <ScrollArea className="flex-1 relative z-10">
                <div className="p-4 space-y-6 pb-24">
                    
                    {/* Budget Limit Card */}
                    <Card className="claymorphism bg-card/80 backdrop-blur-sm border-white/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Target className="h-4 w-4" /> Limite de Gastos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                                <Input type="number" placeholder="3000" className="pl-12 h-14 text-xl font-bold" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} />
                            </div>
                            <Button className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={handleSaveBudget}>Salvar Orçamento</Button>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-2xl font-bold h-14 uppercase tracking-widest text-[10px]">
                            <Zap className="h-4 w-4 mr-2" /> {isGenerating ? "Gerando..." : "Gerar Mês"}
                        </Button>
                        <Button variant="outline" className="rounded-2xl font-bold h-14 border-white/5 bg-white/5 uppercase tracking-widest text-[10px]" onClick={() => toast({title: "Em breve!"})}>
                            <Download className="h-4 w-4 mr-2" /> Exportar CSV
                        </Button>
                    </div>

                    {/* Recurring Templates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 ml-1">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contas Recorrentes</h2>
                        </div>
                        {renderTemplateGroup("Receitas", templates.filter(t => t.type === 'receita'), <TrendingUp className="h-3 w-3 text-emerald-400" />)}
                        {renderTemplateGroup("Despesas", templates.filter(t => t.type === 'despesa'), <TrendingDown className="h-3 w-3 text-red-400" />)}
                        {renderTemplateGroup("Outros", templates.filter(t => t.type !== 'receita' && t.type !== 'despesa'), <PiggyBank className="h-3 w-3 text-purple-400" />)}
                    </div>
                </div>
            </ScrollArea>

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(o) => !o && setEditingTemplate(null)}>
                <DialogContent className="backdrop-blur-xl bg-background/40 border-none shadow-2xl rounded-[2.5rem] w-[95vw] max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar Valor Padrão</DialogTitle>
                        <DialogDescription>{editingTemplate?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                            <Input type="number" className="pl-12 h-14 text-xl font-bold" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditTemplate()} />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button variant="outline" className="rounded-xl border-white/5" onClick={() => { if (editingTemplate) deleteTemplate(editingTemplate.id); setEditingTemplate(null); }}>Remover</Button>
                        <Button className="flex-1 rounded-xl" onClick={handleSaveEditTemplate}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
