
"use client";

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyLog, DailyLog } from '@/hooks/use-daily-log';
import { 
    Wallet, TrendingUp, Cookie, GlassWater, FileText, Heart, 
    HeartPulse, Droplets, ListOrdered, Bell, Bot, Wind, Bed, Waves, Trophy, Target, BarChart3
} from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, getDaysInMonth } from 'date-fns';

import PainChart from '@/components/feature/charts/pain-chart';
import MoodPieChart from '@/components/feature/charts/mood-pie-chart';
import StaggeredEntry from '@/components/feature/staggered-entry';
import { Skeleton } from '@/components/ui/skeleton';

const mockMoodData = [
  { mood: 'Alegre', value: 40, fill: 'var(--chart-2)' },
  { mood: 'Calmo', value: 25, fill: 'var(--chart-3)' },
  { mood: 'Ansioso', value: 20, fill: 'var(--chart-4)' },
  { mood: 'Triste', value: 15, fill: 'var(--chart-5)' },
];

export default function DashboardPage() {
    const { logs, loading: logsLoading } = useDailyLog();
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const today = useMemo(() => new Date(), []);
    const monthStart = useMemo(() => startOfMonth(today), [today]);
    const monthEnd = useMemo(() => endOfMonth(today), [today]);

    const monthlyLogs = useMemo(() => {
        return Object.entries(logs).reduce((acc, [dateKey, log]) => {
             if (!dateKey) return acc;
             try {
                const logDate = parseISO(dateKey);
                if (isWithinInterval(logDate, { start: monthStart, end: monthEnd })) {
                    acc.push(log);
                }
             } catch (e) {
                 // ignore invalid date keys
             }
             return acc;
        }, [] as DailyLog[]);
    }, [logs, monthStart, monthEnd]);

    const monthlyMetrics = useMemo(() => {
        const totalExpenses = monthlyLogs.flatMap(l => l.expenses || []).reduce((sum, e) => sum + e.amount, 0);
        const weeksInMonth = getDaysInMonth(monthStart) / 7;
        const weeklyAverage = totalExpenses / (weeksInMonth > 0 ? weeksInMonth : 1);

        const junkFoodCount = monthlyLogs.filter(l => l.junkFood).length;
        const mateLiters = 5.2; 

        return {
            totalExpenses,
            weeklyAverage,
            junkFoodCount,
            mateLiters,
        };
    }, [monthlyLogs, monthStart]);

    const healthMetrics = useMemo(() => {
        const painDays = monthlyLogs.filter(l => (l.painLog?.pain ?? 0) > 0).length;
        const bowelMovements = monthlyLogs.filter(l => l.bowelMovement).length;
        const allSymptoms = monthlyLogs.flatMap(l => l.painLog?.symptoms || []);
        
        const symptomFrequency = allSymptoms.reduce((acc, symptom) => {
            acc[symptom] = (acc[symptom] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topSymptoms = Object.entries(symptomFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([label, count]) => ({ label, count }));

        return {
            painDays,
            bowelMovements,
            topSymptoms,
            moodEntries: monthlyLogs.filter(l => l.mood).length,
        };
    }, [monthlyLogs]);
    
    const careRoutineMetrics = useMemo(() => {
        const sleepLogs = monthlyLogs.map(l => l.sleepLog).filter(Boolean);
        const totalMinutes = sleepLogs.reduce((sum, log) => sum + (log?.totalMinutes || 0), 0);
        const sleepDays = sleepLogs.length;
        const averageSleepMinutes = sleepDays > 0 ? totalMinutes / sleepDays : 0;
        const avgSleepHours = Math.floor(averageSleepMinutes / 60);
        const avgSleepMins = Math.round(averageSleepMinutes % 60);
        const sleepGoalHours = 8;
        const averageSleepProgress = sleepGoalHours > 0 ? (averageSleepMinutes / (sleepGoalHours * 60)) * 100 : 0;

        return {
            reminders: monthlyLogs.flatMap(l => l.reminders || []).length,
            chatInteractions: 10, 
            meditations: monthlyLogs.filter(l => l.meditationCompleted).length,
            meditationGoal: 12, 
            averageSleep: `${avgSleepHours}h ${avgSleepMins}m`,
            averageSleepProgress,
            sleepGoal: sleepGoalHours,
            hydrationStreak: 5, 
            badges: 4 
        };
    }, [monthlyLogs]);


    const summaryCards = [
        { icon: Wallet, title: 'Grana do Mês', value: `R$ ${monthlyMetrics.totalExpenses.toFixed(2)}` },
        { icon: TrendingUp, title: 'Média Semanal', value: `R$ ${monthlyMetrics.weeklyAverage.toFixed(2)}` },
        { icon: Cookie, title: 'Besteiras no Mês', value: `${monthlyMetrics.junkFoodCount} vezes` },
        { icon: GlassWater, title: 'Litros de Mate', value: `${monthlyMetrics.mateLiters} L` },
    ];
    
    const isLoading = logsLoading || !isClient;

    if (isLoading) {
        return (
             <div className="p-4 md:p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
             </div>
        )
    }

    return (
      <StaggeredEntry className="p-4 md:p-8 space-y-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <Card key={index} className="claymorphism bg-card/80 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center">
              <card.icon className="h-6 w-6 mb-2 text-primary" />
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </Card>
          ))}
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold">Saúde & Hábitos</h2>
          <PainChart logs={logs} />
          
           <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-green-400"/>
                        <CardTitle>Sessão Privada</CardTitle>
                    </div>
                    <CardDescription>{healthMetrics.bowelMovements} idas ao banheiro este mês</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center">Gráfico semanal em breve!</p>
                    <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                       <BarChart3 className="h-8 w-8 text-muted-foreground"/>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ListOrdered className="h-5 w-5 text-red-400"/>
                            <CardTitle>Top 3 Sintomas</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {healthMetrics.topSymptoms.length > 0 ? healthMetrics.topSymptoms.map(symptom => (
                            <div key={symptom.label} className="flex justify-between items-center text-sm">
                                <span>{symptom.label}</span>
                                <Badge variant="secondary">{symptom.count} vezes</Badge>
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center">Nenhum sintoma registrado este mês.</p>}
                    </CardContent>
                </Card>
                <MoodPieChart data={mockMoodData} totalEntries={healthMetrics.moodEntries} />
            </div>
        </section>

        <section className="space-y-6">
            <h2 className="text-xl font-bold">Rotina de Cuidado</h2>
            <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4 space-y-4">
                     <CareRoutineItem icon={Bell} label="Notificações" value={`${careRoutineMetrics.reminders} lembretes`} />
                     <CareRoutineItem icon={Bot} label="Conversas com a IA" value={`${careRoutineMetrics.chatInteractions} interações`} />
                     <CareRoutineItem 
                        icon={Wind} 
                        label="Meditações" 
                        value={`${careRoutineMetrics.meditations} / ${careRoutineMetrics.meditationGoal}`} 
                        progress={(careRoutineMetrics.meditations / careRoutineMetrics.meditationGoal) * 100} 
                     />
                      <CareRoutineItem 
                        icon={Bed} 
                        label="Média de Sono" 
                        value={careRoutineMetrics.averageSleep}
                        progress={careRoutineMetrics.averageSleepProgress} 
                     />
                     <CareRoutineItem icon={Waves} label="Streak de Hidratação" value={`${careRoutineMetrics.hydrationStreak} dias`} />
                     <CareRoutineItem icon={Trophy} label="Badges Desbloqueados" value={`${careRoutineMetrics.badges} selos`} />
                </CardContent>
            </Card>
        </section>

        <section className="space-y-6">
            <h2 className="text-xl font-bold">Insights & Recomendações</h2>
            <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-yellow-400"/>
                        <CardTitle>Desafio do Mês</CardTitle>
                    </div>
                    <CardDescription>Mantenha hábitos saudáveis para ganhar o selo 'Mente Limpa'.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progresso</span>
                        <span className="text-sm font-bold">6/15</span>
                    </div>
                    <Progress value={(6/15)*100} />
                </CardContent>
            </Card>
        </section>
      </StaggeredEntry>
    );
}

const CareRoutineItem = ({ icon: Icon, label, value, progress }: { icon: React.ElementType, label: string, value: string, progress?: number }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <span className="font-bold text-foreground">{value}</span>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-2" />}
    </div>
);
