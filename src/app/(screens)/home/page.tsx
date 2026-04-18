
"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    HeartPulse, 
    Moon, 
    Droplets, 
    Utensils, 
    DollarSign, 
    Calendar,
    GlassWater,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import CheckinDonut from '@/components/feature/checkin-donut';
import EmotionPicker, { CheckinResult } from '@/components/feature/emotion-picker';
import { useAuth } from '@/context/auth-context';
import { useDailyLog } from '@/hooks/use-daily-log';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StaggeredEntry from '@/components/feature/staggered-entry';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AmbientBackground } from '@/components/ui/ambient-background';

const DailyQuote = dynamic(() => import('@/components/feature/daily-quote'), {
  loading: () => <Skeleton className="h-[250px] w-full rounded-2xl" />,
  ssr: false,
});

export default function HomeClient() {
  const { profile } = useAuth();
  const { logs, updateLog, loading } = useDailyLog();
  const [isEmotionPickerOpen, setIsEmotionPickerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayLog = useMemo(() => logs[todayKey] || {}, [logs, todayKey]);
  const checkins = todayLog.checkins || [];

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setCurrentDate(format(now, "EEEE, d 'de' MMMM", { locale: ptBR }));
    if (hour >= 5 && hour < 12) setGreeting('Bom dia');
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const handleSaveCheckin = (result: CheckinResult) => {
    updateLog(todayKey, { checkins: [...checkins, result] });
  };

  const handleAddWater = () => {
    updateLog(todayKey, { waterCups: (todayLog.waterCups || 0) + 1 });
  };

  const summaryData = useMemo(() => {
      const totalExpenses = (todayLog.expenses || []).reduce((sum, e) => sum + e.amount, 0);
      const sleepHours = todayLog.sleepLog ? Math.floor(todayLog.sleepLog.totalMinutes / 60) : 0;
      const mealCount = (todayLog.foodLogs || []).length;
      const painLevel = todayLog.painLog?.pain ?? 0;

      return [
          { label: 'Sono', value: sleepHours > 0 ? `${sleepHours}h` : '--', icon: Moon, color: 'text-indigo-400', href: '/vibe/sono' },
          { label: 'Dor', value: painLevel > 0 ? `Nível ${painLevel}` : 'Sem dor', icon: HeartPulse, color: 'text-rose-400', href: '/vibe/dor' },
          { label: 'Grana', value: `R$ ${totalExpenses.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400', href: '/grana' },
          { label: 'Rango', value: `${mealCount} hoje`, icon: Utensils, color: 'text-amber-400', href: '/rango' },
      ];
  }, [todayLog]);

  if (loading) return null;

  return (
    <>
      <AmbientBackground variant="home" />
      <StaggeredEntry className="relative z-10 flex flex-col min-h-screen pb-24">
        <section className="px-6 pt-8 pb-4 text-center">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}, {profile?.nickname || 'Mooo'}</h1>
        </section>

        <section className="relative py-6 flex flex-col items-center">
          <CheckinDonut checkins={checkins} onCheckinClick={() => setIsEmotionPickerOpen(true)} />
          <div className="flex flex-wrap justify-center gap-2 mt-6 px-6">
              {checkins.slice(-3).map((c, i) => (
                  <Badge key={i} variant="outline" className="bg-card/50 border-white/5 py-1 px-3 gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.emotionLabel}
                  </Badge>
              ))}
          </div>
        </section>

        <section className="px-6 mb-8">
          <div className="grid grid-cols-2 gap-3">
              {summaryData.map((item) => (
                  <Link href={item.href} key={item.label}>
                      <Card className="claymorphism bg-card/40 border-white/5 hover:bg-card/60 transition-colors">
                          <CardContent className="p-4 flex flex-col gap-2">
                              <item.icon className={`h-5 w-5 ${item.color}`} />
                              <div>
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.label}</p>
                                  <p className="text-lg font-bold">{item.value}</p>
                              </div>
                          </CardContent>
                      </Card>
                  </Link>
              ))}
          </div>
        </section>

        <section className="px-6 mb-8">
            <Card className="claymorphism bg-blue-500/5 border-blue-500/10">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl"><GlassWater className="h-6 w-6 text-blue-400" /></div>
                        <div>
                            <p className="text-sm font-bold">Hidratação</p>
                            <p className="text-xs text-muted-foreground">{todayLog.waterCups || 0} / 8 copos hoje</p>
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleAddWater} className="rounded-xl h-10 w-10 bg-blue-500/20 text-blue-400">
                        <Plus className="h-6 w-6" />
                    </Button>
                </CardContent>
            </Card>
        </section>

        <section className="px-6 mb-8"><DailyQuote /></section>

        <section className="px-6 grid grid-cols-3 gap-2">
            <Button variant="outline" asChild className="claymorphism h-12 bg-card/40 border-white/5 font-medium"><Link href="/vibe/privada" className="gap-2"><Droplets className="h-4 w-4 text-green-400" /><span className="text-xs">Privada</span></Link></Button>
            <Button variant="outline" asChild className="claymorphism h-12 bg-card/40 border-white/5 font-medium"><Link href="/vibe/ciclo" className="gap-2"><Calendar className="h-4 w-4 text-pink-400" /><span className="text-xs">Ciclo</span></Link></Button>
            <Button variant="outline" asChild className="claymorphism h-12 bg-card/40 border-white/5 font-medium"><Link href="/dashboard" className="gap-2"><ArrowRight className="h-4 w-4 text-blue-400" /><span className="text-xs">Dash</span></Link></Button>
        </section>

        <EmotionPicker isOpen={isEmotionPickerOpen} onClose={() => setIsEmotionPickerOpen(false)} onSave={handleSaveCheckin} />
      </StaggeredEntry>
    </>
  );
}
