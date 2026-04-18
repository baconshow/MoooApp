"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, User, Stethoscope, MessageSquare, RotateCcw, BarChart3, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format, subDays, addDays, getDaysInMonth, startOfMonth, startOfToday, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useDailyLog, PainLog, Point } from '@/hooks/use-daily-log';
import Link from 'next/link';
import { AmbientBackground } from '@/components/ui/ambient-background';

const initialSymptoms = [
  { emoji: '😣', label: 'Cólica' },
  { emoji: '🪨', label: 'Prisão de ventre' },
  { emoji: '💦', label: 'Inchaço' },
  { emoji: '🥶', label: 'Sensibilidade' },
  { emoji: '😴', label: 'Fadiga' },
  { emoji: '😖', label: 'Dor nas costas' },
  { emoji: '😵', label: 'Tontura' },
  { emoji: '🤢', label: 'Enjoos' },
  { emoji: '😰', label: 'Angústia' },
  { emoji: '❤️‍🔥', label: 'Dor no peito' },
  { emoji: '🤕', label: 'Dor de cabeça' },
  { emoji: '🤒', label: 'Febre leve' },
  { emoji: '😞', label: 'Desânimo' },
  { emoji: '😮‍💨', label: 'Falta de ar' },
];

const painLevels = [
    { label: 'Sem dor', color: 'hsl(100, 100%, 80%)' },
    { label: 'Desconforto leve', color: 'hsl(60, 100%, 70%)' },
    { label: 'Cólica moderada', color: 'hsl(35, 100%, 60%)' },
    { label: 'Dor intensa', color: 'hsl(10, 100%, 55%)' },
    { label: 'Crise', color: 'hsl(0, 100%, 50%)' },
];

const BodyMap = ({ markedPoints, onMarkPoint, onReset }: { markedPoints: Point[], onMarkPoint: (point: Point) => void, onReset: () => void }) => {
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        onMarkPoint({ x, y });
    };

    return (
        <Card className="claymorphism bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex-row justify-between items-center pb-2">
                <CardTitle className="text-base">Mapa do Corpo</CardTitle>
                <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-muted-foreground">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="relative w-full max-w-xs mx-auto aspect-[2/3] cursor-crosshair border border-white/5 rounded-xl overflow-hidden" onClick={handleMapClick}>
                    <Image 
                        src="https://i.postimg.cc/1ztJjcp0/1.png"
                        alt="Mapa do corpo"
                        fill
                        className="object-contain"
                    />
                    {markedPoints.map((point, index) => (
                        <div
                            key={index}
                            className="absolute w-4 h-4 rounded-full bg-red-500/80 pointer-events-none animate-pulse"
                            style={{
                                left: `calc(${point.x}% - 0.5rem)`,
                                top: `calc(${point.y}% - 0.5rem)`,
                                boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.6)',
                            }}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function DiarioDeDorPage() {
    const { toast } = useToast();
    const { logs, updateLog } = useDailyLog();
    
    const [customSymptom, setCustomSymptom] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<{ date: Date; log: PainLog & { bowel?: boolean } } | null>(null);

    const today = startOfToday();
    const todayLogKey = format(today, 'yyyy-MM-dd');
    const todayLog = useMemo(() => logs[todayLogKey] || {}, [logs, todayLogKey]);
    
    const selectedSymptoms = todayLog.painLog?.symptoms ?? [];
    const painLevel = todayLog.painLog?.pain ?? 0;
    
    const handleSymptomToggle = (label: string) => {
        const newSymptoms = selectedSymptoms.includes(label)
            ? selectedSymptoms.filter(s => s !== label)
            : [...selectedSymptoms, label];
        updateLog(todayLogKey, { painLog: { ...todayLog.painLog, symptoms: newSymptoms } });
    };

    const handleCustomSymptomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter' && customSymptom && !selectedSymptoms.includes(customSymptom)) {
            e.preventDefault();
            handleSymptomToggle(customSymptom);
            setCustomSymptom('');
        }
    }
    
    const handlePainLevelChange = (value: number[]) => {
        const level = value[0];
        updateLog(todayLogKey, { painLog: { ...todayLog.painLog, pain: level } });
    };

    const handleMarkPoint = (point: Point) => {
        const currentPoints = todayLog.painLog?.bodyMapPoints || [];
        let newPoints = [...currentPoints, point];
        if (newPoints.length > 5) newPoints = newPoints.slice(1);
        updateLog(todayLogKey, { painLog: { ...todayLog.painLog, bodyMapPoints: newPoints } });
    }

    const resetBodyMap = () => {
        updateLog(todayLogKey, { painLog: { ...todayLog.painLog, bodyMapPoints: [] } });
        toast({ title: 'Mapa corporal limpo!' });
    };

    const totalPainDays = useMemo(() => {
        return Object.values(logs).filter(l => (l.painLog?.pain || 0) > 0).length;
    }, [logs]);

    return (
        <>
            <AmbientBackground variant="dor" />
            <div className="relative z-10 p-4 md:p-8 space-y-6">
                <Link href="/vibe" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
                </Link>

                <BodyMap 
                    markedPoints={todayLog.painLog?.bodyMapPoints ?? []} 
                    onMarkPoint={handleMarkPoint} 
                    onReset={resetBodyMap}
                />

                <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Sintomas de Hoje</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {initialSymptoms.map(s => (
                                <Button
                                    key={s.label}
                                    variant={selectedSymptoms.includes(s.label) ? 'default' : 'outline'}
                                    onClick={() => handleSymptomToggle(s.label)}
                                    className="h-9 px-3 text-xs gap-1.5 rounded-full"
                                >
                                    <span>{s.emoji}</span>
                                    <span>{s.label}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-1 border border-white/5 rounded-xl bg-background/50">
                            <Input 
                                value={customSymptom}
                                onChange={(e) => setCustomSymptom(e.target.value)}
                                onKeyDown={handleCustomSymptomSubmit}
                                placeholder="Adicionar outro sintoma..."
                                className="w-full border-none focus-visible:ring-0 text-xs h-9 bg-transparent"
                            />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Nível de Dor</CardTitle>
                        <CardDescription className="font-bold text-primary">
                            {painLevels[painLevel].label}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Slider
                            value={[painLevel]}
                            onValueChange={handlePainLevelChange}
                            max={4}
                            step={1}
                            style={{ '--slider-track-color': painLevels[painLevel].color } as any}
                            className="slider-thick"
                        />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="claymorphism bg-card/80 p-4 text-center">
                        <p className="text-3xl font-bold">{totalPainDays}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Dias com dor</p>
                    </Card>
                    <Button variant="outline" className="h-full flex-col gap-1 rounded-2xl border-white/5 bg-card/40" onClick={() => setIsCalendarOpen(true)}>
                        <CalendarIcon className="h-5 w-5" />
                        <span className="text-[10px] uppercase tracking-widest">Calendário</span>
                    </Button>
                </div>

                <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <DialogContent className="claymorphism max-w-md p-0 overflow-hidden">
                        <DialogHeader className="p-4 bg-muted/20">
                            <DialogTitle>Histórico de Dores</DialogTitle>
                        </DialogHeader>
                        <Calendar
                            mode="single"
                            locale={ptBR}
                            className="p-4"
                            disabled={(date) => date > new Date()}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
