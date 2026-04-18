"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, Droplets, Droplet, Sprout, Sparkles, Moon, 
  Smile, Frown, Angry, Heart, AlertTriangle, Pill, Zap,
  Calendar as CalendarIcon, TrendingUp, Info, Loader2, Plus
} from 'lucide-react';
import { differenceInDays, addDays, parseISO, format, isSameDay, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDailyLog, CycleLog } from '@/hooks/use-daily-log';
import { useAuth } from '@/context/auth-context';
import StaggeredEntry from '@/components/feature/staggered-entry';
import CycleMandala from '@/components/feature/cycle-mandala';
import ContextChat from '@/components/feature/context-chat';
import { cn } from '@/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AmbientBackground } from '@/components/ui/ambient-background';

interface CycleConfig {
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStartDate: string;
  cycleHistory: { startDate: string; cycleLength: number }[];
}

const SYMPTOMS = [
  'Cólica', 'Inchaço', 'Dor lombar', 'Dor de cabeça',
  'Seios sensíveis', 'Náusea', 'Fadiga', 'Acne',
  'Insônia', 'Ansiedade', 'Apetite', 'Libido'
];

const HUMORS = [
  { id: 'happy', icon: Smile, label: 'Feliz' },
  { id: 'sad', icon: Frown, label: 'Triste' },
  { id: 'angry', icon: Angry, label: 'Irritada' },
  { id: 'tired', icon: Moon, label: 'Cansada' },
  { id: 'loved', icon: Heart, label: 'Amada' },
  { id: 'anxious', icon: AlertTriangle, label: 'Ansiosa' },
  { id: 'sick', icon: Pill, label: 'Doente' },
  { id: 'energy', icon: Zap, label: 'Enérgica' },
];

export default function CicloPage() {
  const { user } = useAuth();
  const { logs, updateLog } = useDailyLog();
  const { toast } = useToast();

  const [cycleConfig, setCycleConfig] = useState<CycleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Form State
  const [flow, setFlow] = useState<CycleLog['flow']>('none');
  const [mood, setMood] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string[]>([]);

  // Onboarding State
  const [onStartDate, setOnStartDate] = useState<Date | undefined>(new Date());
  const [onCycleLen, setOnCycleLen] = useState(28);
  const [onPeriodLen, setOnPeriodLen] = useState(5);

  useEffect(() => {
    if (!user) return;
    const fetchConfig = async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'settings', 'cycle');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCycleConfig(snap.data() as CycleConfig);
        } else {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error("Error fetching cycle config:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [user]);

  useEffect(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayLog = logs[todayKey]?.cycleLog;
    if (todayLog) {
      setFlow(todayLog.flow || 'none');
      setMood(todayLog.mood || '');
      setSymptoms(todayLog.symptoms || []);
    }
  }, [logs]);

  const currentCycleDay = useMemo(() => {
    if (!cycleConfig) return 0;
    const diff = differenceInDays(startOfToday(), parseISO(cycleConfig.lastPeriodStartDate));
    return (diff % cycleConfig.averageCycleLength) + 1;
  }, [cycleConfig]);

  const currentPhase = useMemo(() => {
    if (!cycleConfig) return 'follicular';
    const day = currentCycleDay;
    const cycle = cycleConfig.averageCycleLength;
    const period = cycleConfig.averagePeriodLength;
    const ovulation = cycle - 14;

    if (day <= period) return 'menstruation';
    if (day < ovulation) return 'follicular';
    if (day <= ovulation + 2) return 'ovulation';
    return 'luteal';
  }, [currentCycleDay, cycleConfig]);

  const predictions = useMemo(() => {
    if (!cycleConfig) return null;
    const start = parseISO(cycleConfig.lastPeriodStartDate);
    const nextPeriod = addDays(start, cycleConfig.averageCycleLength);
    const ovulationDay = cycleConfig.averageCycleLength - 14;
    const ovulation = addDays(start, ovulationDay);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);

    return {
      nextPeriod,
      ovulation,
      fertileRange: [fertileStart, fertileEnd],
      daysToPeriod: differenceInDays(nextPeriod, startOfToday()),
      daysToOvulation: differenceInDays(ovulation, startOfToday()),
    };
  }, [cycleConfig]);

  const handleSaveLog = useCallback(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    updateLog(todayKey, {
      cycleLog: { flow, symptoms, mood }
    });
    toast({ title: "Registro salvo com sucesso" });
  }, [flow, symptoms, mood, updateLog, toast]);

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleStartTracking = async () => {
    if (!user || !onStartDate) return;
    const config: CycleConfig = {
      averageCycleLength: onCycleLen,
      averagePeriodLength: onPeriodLen,
      lastPeriodStartDate: format(onStartDate, 'yyyy-MM-dd'),
      cycleHistory: []
    };
    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'cycle');
      await setDoc(ref, config);
      setCycleConfig(config);
      setShowOnboarding(false);
      toast({ title: "Ciclo configurado" });
    } catch (e) {
      toast({ title: "Erro ao configurar", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full pt-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <>
      <AmbientBackground variant="ciclo" />
      <div className="relative z-10 min-h-screen pb-24">
        <StaggeredEntry className="p-4 space-y-6">
          <Link href="/vibe">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>

          {/* 1. MANDALA HERO */}
          <section className="py-4">
            {cycleConfig && (
              <CycleMandala
                cycleDay={currentCycleDay}
                cycleLength={cycleConfig.averageCycleLength}
                periodLength={cycleConfig.averagePeriodLength}
                phase={currentPhase as any}
              />
            )}
          </section>

          {/* 2. LEGENDA DAS FASES */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'menstruation', label: 'Menstruação', icon: Droplets, color: 'text-red-400', bg: 'bg-red-500/10' },
              { id: 'follicular', label: 'Folicular', icon: Sprout, color: 'text-green-400', bg: 'bg-green-500/10' },
              { id: 'ovulation', label: 'Ovulação', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { id: 'luteal', label: 'Lútea', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(p => (
              <div key={p.id} className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                currentPhase === p.id ? `${p.bg} border-current ${p.color} scale-105 shadow-lg` : "bg-card/40 border-white/5 text-muted-foreground"
              )}>
                <p.icon className="h-3 w-3" />
                {p.label}
              </div>
            ))}
          </div>

          {/* 3. CARD REGISTRO */}
          <Card className="claymorphism bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 opacity-80">
                <Plus className="h-4 w-4" /> Registro do dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Fluxo */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Fluxo</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'light', 'medium', 'heavy'] as const).map(f => (
                    <Button
                      key={f}
                      variant="outline"
                      size="sm"
                      onClick={() => setFlow(f)}
                      className={cn(
                        "h-12 flex-col gap-1 rounded-xl border-white/5 transition-all",
                        flow === f ? "bg-red-500/20 border-red-400 text-red-400" : "bg-card/40"
                      )}
                    >
                      <div className="flex gap-0.5">
                        {f === 'none' ? <Droplet className="h-3 w-3 opacity-20" /> : Array.from({length: f === 'light' ? 1 : f === 'medium' ? 2 : 3}).map((_, i) => <Droplet key={i} className="h-3 w-3 fill-current" />)}
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-tighter">{f === 'none' ? 'Nenhum' : f === 'light' ? 'Leve' : f === 'medium' ? 'Médio' : f === 'heavy' ? 'Forte' : ''}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Humor */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Humor</p>
                <div className="grid grid-cols-8 gap-1">
                  {HUMORS.map(h => {
                    const Icon = h.icon;
                    return (
                      <button
                        key={h.id}
                        title={h.label}
                        onClick={() => setMood(h.id)}
                        className={cn(
                          "flex items-center justify-center aspect-square rounded-xl transition-all border border-transparent",
                          mood === h.id ? "bg-primary/20 border-primary text-primary scale-110 shadow-lg shadow-primary/20" : "bg-card/40 hover:bg-card/60"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sintomas */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Sintomas</p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all tracking-tight",
                        symptoms.includes(s) ? "bg-primary/20 border-primary text-primary" : "bg-card/40 border-white/5 text-muted-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveLog} className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90">
                Salvar Registro
              </Button>
            </CardContent>
          </Card>

          {/* 4. PREVISÕES */}
          {predictions && (
            <Card className="claymorphism bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 opacity-80">
                  <CalendarIcon className="h-4 w-4" /> Previsões
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><Droplets className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Próxima menstruação</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{format(predictions.nextPeriod, "d 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-widest">em {predictions.daysToPeriod} dias</div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Sparkles className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Janela fértil</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        {format(predictions.fertileRange[0], "d")} - {format(predictions.fertileRange[1], "d 'de' MMMM")}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest opacity-80">Fértil</div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Moon className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Próxima ovulação</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{format(predictions.ovulation, "d 'de' MMMM")}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">em {predictions.daysToOvulation} dia{predictions.daysToOvulation !== 1 ? 's' : ''}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. INSIGHTS */}
          {cycleConfig && cycleConfig.cycleHistory.length >= 2 && (
            <Card className="claymorphism bg-card/80 backdrop-blur-sm border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2 opacity-80">
                  <TrendingUp className="h-4 w-4" /> Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                <p className="text-xs font-medium text-foreground leading-relaxed">Ciclo médio de <span className="text-primary font-bold">{cycleConfig.averageCycleLength} dias</span>.</p>
                <p className="text-xs font-medium text-foreground leading-relaxed">Fluxo médio de <span className="text-red-400 font-bold">{cycleConfig.averagePeriodLength} dias</span>.</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground italic tracking-tight">Com base nos últimos registros salvos.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. CONTEXT CHAT IA */}
          <ContextChat
            pageContext="ciclo"
            contextData={{
              cycleDay: currentCycleDay,
              phase: currentPhase,
              flow,
              symptoms,
              mood,
              predictions: predictions ? {
                daysToPeriod: predictions.daysToPeriod,
                daysToOvulation: predictions.daysToOvulation,
              } : null,
            }}
            placeholder="Pergunte sobre seu ciclo..."
          />
        </StaggeredEntry>

        {/* ONBOARDING DIALOG */}
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="claymorphism bg-card/95 backdrop-blur-xl border-white/10 max-w-[90vw] rounded-[2rem]">
            <DialogHeader className="items-center text-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                <Droplets className="h-8 w-8" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Configurar ciclo</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground px-4 leading-relaxed">
                Para calcular suas fases e previsões, precisamos saber como seu corpo funciona.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-8 py-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Início da última menstruação</p>
                <div className="border border-white/5 rounded-2xl p-2 bg-background/50">
                  <Calendar
                    mode="single"
                    selected={onStartDate}
                    onSelect={setOnStartDate}
                    className="rounded-md"
                    locale={ptBR}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Duração média do ciclo</p>
                  <span className="text-sm font-bold text-primary">{onCycleLen} dias</span>
                </div>
                <Slider value={[onCycleLen]} min={21} max={35} step={1} onValueChange={v => setOnCycleLen(v[0])} className="slider-thick" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Duração média do fluxo</p>
                  <span className="text-sm font-bold text-red-400">{onPeriodLen} dias</span>
                </div>
                <Slider value={[onPeriodLen]} min={2} max={10} step={1} onValueChange={v => setOnPeriodLen(v[0])} className="slider-thick" />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleStartTracking} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                Começar a acompanhar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
