"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Camera, ChefHat, History, BarChart3, Sliders,
  Sprout, Leaf, Egg, Skull, Target,
} from "lucide-react";
import StaggeredEntry from "@/components/feature/staggered-entry";
import RangoMandala, { WeeklyMandalas } from "@/components/feature/rango-mandala";
import KookFab from "@/components/feature/kook-fab";
import { useDailyLog, FoodLog } from "@/hooks/use-daily-log";
import { useAuth } from "@/context/auth-context";
import { useHubGoal } from "@/hooks/use-hub-goal";
import HubOnboarding, { OnboardingStep } from "@/components/feature/hub-onboarding";
import { Slider } from "@/components/ui/slider";
import {
  format, subDays, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════

const DEFAULT_GOALS = { calories: 2000, protein: 80, carbs: 250, fat: 70, fiber: 25 };

// ═══════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════

const RANGO_STEPS: OnboardingStep[] = [
  {
    id: 'objective',
    title: 'Qual seu objetivo?',
    description: 'Isso ajuda seu assistente a personalizar suas sugestoes.',
    component: (val, update) => (
      <div className="grid grid-cols-1 gap-2">
        {[
          { id: 'lose_weight', label: 'Emagrecer', desc: 'Meta calorica reduzida' },
          { id: 'gain_muscle', label: 'Ganhar massa', desc: 'Foco em proteinas' },
          { id: 'eat_better', label: 'Comer melhor', desc: 'Foco em vitalidade' },
          { id: 'track_only', label: 'So registrar', desc: 'Sem metas especificas' },
        ].map(opt => (
          <button key={opt.id} onClick={() => update(opt)}
            className={cn("p-4 rounded-2xl border-2 text-left transition-all",
              val?.id === opt.id ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" : "bg-white/5 border-transparent hover:bg-white/10")}>
            <p className="font-bold text-sm">{opt.label}</p>
            <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
    )
  },
  {
    id: 'restrictions',
    title: 'Restricoes?',
    description: 'Selecione o que voce evita na dieta.',
    component: (val = [], update) => (
      <div className="grid grid-cols-2 gap-2">
        {['Vegano', 'Vegetariano', 'Sem gluten', 'Sem lactose', 'Low carb', 'Nenhuma'].map(tag => (
          <button key={tag} onClick={() => {
            const n = val.includes(tag) ? val.filter((t: string) => t !== tag) : [...val, tag];
            update(n);
          }} className={cn("p-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-tighter",
            val.includes(tag) ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-transparent text-muted-foreground")}>
            {tag}
          </button>
        ))}
      </div>
    )
  },
  {
    id: 'calories',
    title: 'Meta calorica',
    description: 'Quantas kcal voce quer consumir por dia?',
    component: (val = 2000, update) => (
      <div className="space-y-8 pt-4">
        <div className="text-center">
          <span className="text-4xl font-bold text-primary">{val}</span>
          <span className="text-sm text-muted-foreground ml-2">kcal/dia</span>
        </div>
        <Slider value={[val]} min={1200} max={3500} step={50} onValueChange={(v) => update(v[0])} className="slider-thick" />
        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
          <span>1200</span><span>3500</span>
        </div>
      </div>
    )
  }
];

// ═══════════════════════════════════════════════════
// VITALITY CONFIG
// ═══════════════════════════════════════════════════

type VitalityClass = 'biogenic' | 'bioactive' | 'biostatic' | 'biocidic';

const VITALITY: {
  key: VitalityClass; prefix: string; suffix: string;
  icon: typeof Sprout; color: string; hex: string;
}[] = [
  { key: 'biogenic',  prefix: 'BIO', suffix: 'GENICOS',   icon: Sprout, color: 'text-emerald-400', hex: '#34d399' },
  { key: 'bioactive', prefix: 'BIO', suffix: 'ATIVOS',    icon: Leaf,   color: 'text-lime-400',    hex: '#a3e635' },
  { key: 'biostatic', prefix: 'BIO', suffix: 'ESTATICOS', icon: Egg,    color: 'text-amber-400',   hex: '#fbbf24' },
  { key: 'biocidic',  prefix: 'BIO', suffix: 'CIDICOS',   icon: Skull,  color: 'text-red-400',     hex: '#f87171' },
];

// ═══════════════════════════════════════════════════
// GOAL STATUS PILL
// ═══════════════════════════════════════════════════

function GoalStatus({ calories, calorieGoal, goalLabel }: {
  calories: number; calorieGoal: number; goalLabel: string;
}) {
  const calPct = calorieGoal > 0 ? Math.round((calories / calorieGoal) * 100) : 0;
  const allZero = calories === 0;

  let status: string, statusCls: string;
  if (allZero) { status = 'Sem dados'; statusCls = 'bg-white/[0.04] text-muted-foreground/30 border-white/[0.06]'; }
  else if (calPct > 130) { status = 'Incoerente'; statusCls = 'bg-red-500/10 text-red-400 border-red-500/20'; }
  else if (calPct > 100) { status = 'Acima da meta'; statusCls = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; }
  else if (calPct >= 70) { status = 'No caminho'; statusCls = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'; }
  else { status = 'Progredindo'; statusCls = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        <Target className="h-3 w-3 text-muted-foreground/30" />
        <span className="text-[10px] text-muted-foreground/40">{goalLabel}</span>
        <span className="text-[10px] text-muted-foreground/15">|</span>
        <span className="text-[10px] text-muted-foreground/40">{calorieGoal.toLocaleString('pt-BR')} kcal</span>
      </div>
      <Badge variant="outline" className={cn('text-[9px] uppercase tracking-tighter px-2 py-0.5 border', statusCls)}>
        {status}
      </Badge>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MEAL COUNTER
// ═══════════════════════════════════════════════════

function MealCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={cn('rounded-full transition-all duration-300',
          i < count ? 'w-2 h-2 bg-primary shadow-[0_0_6px_rgba(167,139,250,0.4)]' : 'w-1.5 h-1.5 bg-white/[0.08]')} />
      ))}
      <span className="text-[11px] text-muted-foreground/40 ml-1.5 tabular-nums">
        {count} refeic{count !== 1 ? 'oes' : 'ao'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// VITALITY + CHART SECTION
// ═══════════════════════════════════════════════════

function VitalityChartSection({ logs }: { logs: Record<string, any> }) {
  const [tab, setTab] = useState<'semana' | 'mes'>('semana');

  const weekData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      const foodLogs = (logs[key]?.foodLogs as FoodLog[] | undefined) || [];
      const counts: Record<VitalityClass, number> = { biogenic: 0, bioactive: 0, biostatic: 0, biocidic: 0 };
      foodLogs.forEach(l => {
        const vc = (l as any).vitalityClass as VitalityClass | undefined;
        if (vc && vc in counts) counts[vc]++;
      });
      result.push({ label: format(d, 'EEEEE', { locale: ptBR }).toUpperCase(), ...counts });
    }
    return result;
  }, [logs]);

  const monthData = useMemo(() => {
    const ms = startOfMonth(new Date()), me = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: ms, end: me });
    const weeks: Record<VitalityClass, number>[] = [];
    let current: Record<VitalityClass, number> = { biogenic: 0, bioactive: 0, biostatic: 0, biocidic: 0 };
    days.forEach((d, i) => {
      const key = format(d, 'yyyy-MM-dd');
      const foodLogs = (logs[key]?.foodLogs as FoodLog[] | undefined) || [];
      foodLogs.forEach(l => {
        const vc = (l as any).vitalityClass as VitalityClass | undefined;
        if (vc && vc in current) current[vc]++;
      });
      if (getDay(d) === 0 || i === days.length - 1) {
        weeks.push({ ...current });
        current = { biogenic: 0, bioactive: 0, biostatic: 0, biocidic: 0 };
      }
    });
    return weeks.map((w, i) => ({ label: `S${i + 1}`, ...w }));
  }, [logs]);

  const data = tab === 'semana' ? weekData : monthData;

  const totals = useMemo(() => {
    const t: Record<VitalityClass, number> = { biogenic: 0, bioactive: 0, biostatic: 0, biocidic: 0 };
    data.forEach(d => { t.biogenic += d.biogenic; t.bioactive += d.bioactive; t.biostatic += d.biostatic; t.biocidic += d.biocidic; });
    return t;
  }, [data]);

  const totalAll = totals.biogenic + totals.bioactive + totals.biostatic + totals.biocidic;
  const maxStack = Math.max(...data.map(d => d.biogenic + d.bioactive + d.biostatic + d.biocidic), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Vitalidade</p>
        <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
          {(['semana', 'mes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-3 py-1 rounded-md text-[11px] font-medium transition-all',
                tab === t ? 'bg-primary text-white' : 'text-muted-foreground')}>
              {t === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      <Card className="claymorphism bg-card/80 border-white/[0.06]">
        <CardContent className="py-4">
          {/* Summary — BIO bold on top, suffix below */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {VITALITY.map(v => {
              const count = totals[v.key];
              const active = count > 0;
              return (
                <div key={v.key} className="flex flex-col items-center gap-0.5">
                  <v.icon className={cn('h-3.5 w-3.5', active ? v.color : 'text-muted-foreground/15')} />
                  <span className={cn('text-base font-bold tabular-nums', active ? v.color : 'text-muted-foreground/15')}>
                    {count}
                  </span>
                  <span className={cn('text-[7px] font-bold tracking-wide leading-tight', active ? 'text-muted-foreground/40' : 'text-muted-foreground/15')}>
                    {v.prefix}
                  </span>
                  <span className={cn('text-[7px] tracking-wide leading-tight', active ? 'text-muted-foreground/25' : 'text-muted-foreground/10')}>
                    {v.suffix}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-white/[0.05] mb-3" />

          {/* Stacked bars */}
          <div className={cn('flex items-end', tab === 'semana' ? 'gap-1.5' : 'gap-2.5')} style={{ height: 80 }}>
            {data.map((d, i) => {
              const stack = d.biogenic + d.bioactive + d.biostatic + d.biocidic;
              const pct = stack > 0 ? Math.max(12, (stack / maxStack) * 100) : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <div className="flex-1 w-full flex items-end">
                    {stack === 0 ? (
                      <div className="w-full h-1 rounded-t-sm bg-white/[0.04]" />
                    ) : (
                      <div className="w-full rounded-t overflow-hidden flex flex-col transition-all" style={{ height: `${pct}%` }}>
                        {([...VITALITY].reverse()).map((v, vi) => {
                          const segH = (d[v.key] / stack) * 100;
                          if (segH === 0) return null;
                          return <div key={vi} className="w-full opacity-80" style={{
                            height: `${segH}%`, minHeight: d[v.key] > 0 ? 3 : 0, backgroundColor: v.hex,
                          }} />;
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground leading-none">{d.label}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-2.5 mt-2.5 flex-wrap">
            {VITALITY.map(v => (
              <div key={v.key} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-sm opacity-80" style={{ backgroundColor: v.hex }} />
                <span className="text-[8px] text-muted-foreground/30">{v.prefix}{v.suffix.toLowerCase()}</span>
              </div>
            ))}
          </div>

          {/* Total badge */}
          <div className="flex justify-center mt-2.5">
            <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="text-[10px] text-muted-foreground/40">
                {totalAll} refeicoes analisadas {tab === 'semana' ? 'na semana' : 'no mes'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

export default function RangoHubPage() {
  const { logs } = useDailyLog();
  const { profile } = useAuth();
  const { goal, needsOnboarding, saveGoal, setNeedsOnboarding } = useHubGoal('rango');
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const dailyCalorieGoal = goal?.details?.calories || DEFAULT_GOALS.calories;
  const goalLabel = goal?.objectiveLabel || 'Nutricao';
  const aiName = profile?.aiName || 'Kook';

  // Today's totals
  const todayLogs = useMemo(() =>
    ((logs[todayKey]?.foodLogs || []) as FoodLog[]).filter(l => l.calories),
    [logs, todayKey],
  );

  const totals = useMemo(() => ({
    calories: todayLogs.reduce((s, l) => s + (l.calories || 0), 0),
    protein:  todayLogs.reduce((s, l) => s + (l.protein || 0), 0),
    carbs:    todayLogs.reduce((s, l) => s + (l.carbohydrates || 0), 0),
    fat:      todayLogs.reduce((s, l) => s + (l.fat || 0), 0),
    fiber:    todayLogs.reduce((s, l) => s + (l.fiber || 0), 0),
  }), [todayLogs]);

  // Last 5 days (not today — mandala already shows today)
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 5; i >= 1; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      const fl = ((logs[key]?.foodLogs || []) as FoodLog[]).filter(l => l.calories);
      days.push({
        label: format(d, 'EEE', { locale: ptBR }).slice(0, 3),
        calories: fl.reduce((s, l) => s + (l.calories || 0), 0),
        protein:  fl.reduce((s, l) => s + (l.protein || 0), 0),
        carbs:    fl.reduce((s, l) => s + (l.carbohydrates || 0), 0),
        fat:      fl.reduce((s, l) => s + (l.fat || 0), 0),
        fiber:    fl.reduce((s, l) => s + (l.fiber || 0), 0),
        isToday: false,
      });
    }
    return days;
  }, [logs]);

  const handleOnboardingComplete = (data: any) => {
    saveGoal(data.objective?.id, data.objective?.label, {
      restrictions: data.restrictions,
      calories: data.calories,
    });
  };

  // Secondary cards — uses aiName dynamically
  const secondaryCards = [
    { title: `Sugestoes do ${aiName}`, desc: "Receitas personalizadas", href: "/rango/sugestoes", icon: ChefHat, accent: "text-purple-400", bg: "bg-purple-500/10" },
    { title: "Galeria", desc: "Historico completo", href: "/rango/historico", icon: History, accent: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Insights", desc: "Cruzamento de dados", href: "/rango/insights", icon: BarChart3, accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <>
      <div className="h-full overflow-y-auto">
        <StaggeredEntry className="relative z-10 p-4 md:p-8 space-y-5 pb-28">

          {/* SETTINGS BUTTON — no title (comes from app-header) */}
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => setNeedsOnboarding(true)} className="rounded-xl text-muted-foreground">
              <Sliders className="h-5 w-5" />
            </Button>
          </div>

          {/* ═══ MANDALA (protagonista) ═══ */}
          <div>
            <RangoMandala
              calories={totals.calories} caloriesGoal={dailyCalorieGoal}
              protein={totals.protein}   proteinGoal={DEFAULT_GOALS.protein}
              carbs={totals.carbs}       carbsGoal={DEFAULT_GOALS.carbs}
              fat={totals.fat}           fatGoal={DEFAULT_GOALS.fat}
              fiber={totals.fiber}       fiberGoal={DEFAULT_GOALS.fiber}
              size="lg"
            />
            <div className="mt-3"><MealCounter count={todayLogs.length} /></div>
            <div className="mt-2">
              <GoalStatus calories={totals.calories} calorieGoal={dailyCalorieGoal} goalLabel={goalLabel} />
            </div>
          </div>

          {/* ═══ VITALITY CHART ═══ */}
          <VitalityChartSection logs={logs} />

          {/* ═══ 5-DAY MINI MANDALAS ═══ */}
          <Card className="claymorphism bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ultimos dias</CardTitle>
            </CardHeader>
            <div className="px-4 pb-4">
              <WeeklyMandalas days={weeklyData} goals={DEFAULT_GOALS} />
            </div>
          </Card>

          {/* ═══ PRIMARY ACTION — Analisar Refeicao ═══ */}
          <Link href="/rango/analisar" className="block group">
            <Card className="claymorphism bg-card/80 backdrop-blur-sm border-amber-500/15 group-hover:border-amber-500/30 transition-all overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
                <div className="p-4 rounded-2xl bg-amber-500/10 transition-transform group-hover:scale-110">
                  <Camera className="h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Analisar Refeicao</CardTitle>
                  <CardDescription className="text-xs opacity-70">Tire uma foto do seu prato</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* ═══ SECONDARY CARDS — 3 col grid ═══ */}
          <div className="grid grid-cols-3 gap-3">
            {secondaryCards.map(card => (
              <Link href={card.href} key={card.title} className="block group">
                <Card className="claymorphism bg-card/80 backdrop-blur-sm group-hover:bg-card/95 transition-all h-full border-white/5">
                  <CardHeader className="flex flex-col items-center text-center gap-2 space-y-0 p-3">
                    <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", card.bg)}>
                      <card.icon className={cn("h-5 w-5", card.accent)} />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] font-medium leading-tight">{card.title}</CardTitle>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{card.desc}</p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

        </StaggeredEntry>
      </div>

      {/* ═══ KOOK FAB (global component) ═══ */}
      <KookFab context="rango" />

      {/* ═══ ONBOARDING ═══ */}
      <HubOnboarding
        isOpen={needsOnboarding}
        onClose={() => setNeedsOnboarding(false)}
        hubName="rango"
        steps={RANGO_STEPS}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}