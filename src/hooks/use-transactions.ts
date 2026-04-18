
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

// ─── TYPES ──────────────────────────────────────────────────────

export type TransactionType = 'despesa' | 'receita' | 'caixinha' | 'planos';
export type Classification = 'planejado' | 'extra' | 'urgente' | 'superfluo';
export type Recurrence = 'mensal' | 'unica' | 'anual';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    account: string;
    month: string;              // "2026-02"
    date: string;               // ISO
    type: TransactionType;
    paid: boolean;
    paidDate?: string;
    classification: Classification;
    recurrence: Recurrence;
    category: string;
    createdAt: string;
    fromTemplate?: string;
}

export interface RecurringTemplate {
    id: string;
    description: string;
    amount: number;
    account: string;
    type: TransactionType;
    classification: Classification;
    recurrence: 'mensal' | 'anual';
    category: string;
    enabled: boolean;
    dayOfMonth?: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────

export const ACCOUNTS = [
    { name: 'Jesse', color: 'bg-blue-500/15 text-blue-400' },
    { name: 'Bibi', color: 'bg-pink-500/15 text-pink-400' },
    { name: 'Casa', color: 'bg-amber-500/15 text-amber-400' },
    { name: 'Projetos', color: 'bg-purple-500/15 text-purple-400' },
    { name: 'Nexaya', color: 'bg-emerald-500/15 text-emerald-400' },
];

export const CLASSIFICATION_COLORS = {
    planejado: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#34d399' },
    extra: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: '#60a5fa' },
    urgente: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: '#fbbf24' },
    superfluo: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30', dot: '#f472b6' },
};

export const TYPE_COLORS = {
    despesa: { bg: 'bg-red-500/15', text: 'text-red-400' },
    receita: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    caixinha: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    planos: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
};

export const CATEGORIES = [
    "Moradia", "Alimentação", "Transporte",
    "Saúde", "Educação", "Lazer",
    "Assinatura", "Vestuário", "Cuidados",
    "Cartão", "Freelance", "Outros",
];

export const DEFAULT_TEMPLATES: Omit<RecurringTemplate, 'id'>[] = [
    { description: "Aluguel do apartamento", amount: 0, account: "Casa", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Moradia", enabled: true },
    { description: "Agua e Luz", amount: 0, account: "Casa", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Moradia", enabled: true },
    { description: "Internet", amount: 0, account: "Casa", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Moradia", enabled: true },
    { description: "Plano Claro", amount: 0, account: "Bibi", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Saúde", enabled: true },
    { description: "Plano Vivo", amount: 0, account: "Jesse", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Outros", enabled: true },
    { description: "Faculdade", amount: 0, account: "Jesse", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Educação", enabled: true },
    { description: "Cartao de Credito", amount: 0, account: "Jesse", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Cartão", enabled: true },
    { description: "YouTube Music", amount: 12, account: "Bibi", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Assinatura", enabled: true },
    { description: "CapCut Pro", amount: 8, account: "Projetos", type: "despesa", classification: "planejado", recurrence: "mensal", category: "Assinatura", enabled: true },
    { description: "Claude IA", amount: 100, account: "Jesse", type: "despesa", classification: "urgente", recurrence: "mensal", category: "Outros", enabled: true },
    { description: "Salario Jesse", amount: 6660, account: "Jesse", type: "receita", classification: "extra", recurrence: "mensal", category: "Freelance", enabled: true },
    { description: "Salario Bibi", amount: 1800, account: "Bibi", type: "receita", classification: "extra", recurrence: "mensal", category: "Freelance", enabled: true },
    { description: "Vale Alimentacao", amount: 400, account: "Bibi", type: "receita", classification: "extra", recurrence: "mensal", category: "Alimentação", enabled: true },
    { description: "Fundo de Reserva", amount: 1000, account: "Jesse", type: "caixinha", classification: "extra", recurrence: "mensal", category: "Outros", enabled: true },
];

// ─── HOOK ───────────────────────────────────────────────────────

export const useTransactions = () => {
    const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user || !isFirebaseEnabled) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const txRef = collection(db, 'users', user.uid, 'transactions');
        const unsub = onSnapshot(txRef, (snap) => {
            const txs: Transaction[] = [];
            snap.forEach((doc) => txs.push(doc.data() as Transaction));
            txs.sort((a, b) => b.date.localeCompare(a.date));
            setTransactions(txs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching transactions:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user, authLoading, isFirebaseEnabled]);

    useEffect(() => {
        if (authLoading || !user || !isFirebaseEnabled) return;

        const tplRef = collection(db, 'users', user.uid, 'recurring-templates');
        const unsub = onSnapshot(tplRef, (snap) => {
            const tpls: RecurringTemplate[] = [];
            snap.forEach((doc) => tpls.push(doc.data() as RecurringTemplate));
            setTemplates(tpls);
        }, (err) => {
            console.error("Error fetching templates:", err);
        });

        return () => unsub();
    }, [user, authLoading, isFirebaseEnabled]);

    const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        if (!user) return;
        const id = crypto.randomUUID();
        const full: Transaction = { ...tx, id, createdAt: new Date().toISOString() };
        const ref = doc(db, 'users', user.uid, 'transactions', id);
        setDoc(ref, full).catch(err => console.error("Error adding transaction:", err));
        return full;
    }, [user]);

    const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'transactions', id);
        updateDoc(ref, data).catch(err => console.error("Error updating transaction:", err));
    }, [user]);

    const deleteTransaction = useCallback((id: string) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'transactions', id);
        deleteDoc(ref).catch(err => console.error("Error deleting transaction:", err));
    }, [user]);

    const togglePaid = useCallback((id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx || !user) return;
        const ref = doc(db, 'users', user.uid, 'transactions', id);
        updateDoc(ref, {
            paid: !tx.paid,
            paidDate: !tx.paid ? new Date().toISOString() : null,
        }).catch(err => console.error("Error toggling paid:", err));
    }, [user, transactions]);

    const addTemplate = useCallback((tpl: Omit<RecurringTemplate, 'id'>) => {
        if (!user) return;
        const id = crypto.randomUUID();
        const full: RecurringTemplate = { ...tpl, id };
        const ref = doc(db, 'users', user.uid, 'recurring-templates', id);
        setDoc(ref, full).catch(err => console.error("Error adding template:", err));
    }, [user]);

    const updateTemplate = useCallback((id: string, data: Partial<RecurringTemplate>) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'recurring-templates', id);
        updateDoc(ref, data).catch(err => console.error("Error updating template:", err));
    }, [user]);

    const deleteTemplate = useCallback((id: string) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'recurring-templates', id);
        deleteDoc(ref).catch(err => console.error("Error deleting template:", err));
    }, [user]);

    const toggleTemplate = useCallback((id: string) => {
        const tpl = templates.find(t => t.id === id);
        if (tpl) {
            updateTemplate(id, { enabled: !tpl.enabled });
        }
    }, [templates, updateTemplate]);

    const generateMonthFromTemplates = useCallback(async (monthKey: string) => {
        if (!user) return 0;

        const enabledTemplates = templates.filter(t => t.enabled);
        const existingFromTemplates = transactions.filter(t => t.month === monthKey && t.fromTemplate);
        const alreadyGenerated = new Set(existingFromTemplates.map(t => t.fromTemplate));

        let count = 0;
        for (const tpl of enabledTemplates) {
            if (alreadyGenerated.has(tpl.id)) continue;

            addTransaction({
                description: tpl.description,
                amount: tpl.amount,
                account: tpl.account,
                month: monthKey,
                date: new Date().toISOString(),
                type: tpl.type,
                paid: false,
                classification: tpl.classification,
                recurrence: tpl.recurrence,
                category: tpl.category,
                fromTemplate: tpl.id,
            });
            count++;
        }
        return count;
    }, [user, templates, transactions, addTransaction]);

    const initDefaultTemplates = useCallback(async () => {
        if (!user || templates.length > 0) return;
        for (const tpl of DEFAULT_TEMPLATES) {
            addTemplate(tpl);
        }
    }, [user, templates, addTemplate]);

    const getMonthMetrics = useCallback((monthKey: string) => {
        const monthTxs = transactions.filter(t => t.month === monthKey);
        const receitas = monthTxs.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
        const despesas = monthTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
        const caixinha = monthTxs.filter(t => t.type === 'caixinha').reduce((s, t) => s + t.amount, 0);
        const saldo = receitas - despesas;

        const byClassification = {
            planejado: monthTxs.filter(t => t.classification === 'planejado').length,
            extra: monthTxs.filter(t => t.classification === 'extra').length,
            urgente: monthTxs.filter(t => t.classification === 'urgente').length,
            superfluo: monthTxs.filter(t => t.classification === 'superfluo').length,
        };

        return { total: monthTxs.length, receitas, despesas, caixinha, saldo, byClassification };
    }, [transactions]);

    return {
        transactions, templates, loading,
        addTransaction, updateTransaction, deleteTransaction, togglePaid,
        addTemplate, updateTemplate, deleteTemplate, toggleTemplate,
        generateMonthFromTemplates, initDefaultTemplates, getMonthMetrics
    };
};
