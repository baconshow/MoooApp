"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Moon, Bell, Star, Music, Brain, Wind, Sparkles, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInMinutes, format, startOfToday, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sleepPhrases } from '@/lib/dory-phrases';
import Link from 'next/link';
import { useDailyLog, SleepLog } from '@/hooks/use-daily-log';

// ═══════════════════════════════════════════════════════════
// SLEEP MANDALA V8 — Tick marks + rounded caps + icons inside
// ═══════════════════════════════════════════════════════════

interface MandalaProps {
  bedtime: string;
  wakeTime: string;
  onBedtimeChange: (v: string) => void;
  onWakeTimeChange: (v: string) => void;
}

function SleepMandala({ bedtime, wakeTime, onBedtimeChange, onWakeTimeChange }: MandalaProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const S = 300, C = S / 2;
  const oR = 120;               // outer radius
  const iR = 84;                // inner radius
  const midR = (oR + iR) / 2;  // center of band = 102
  const bandW = oR - iR;        // thickness = 36
  const capR = bandW / 2;       // rounded cap radius = 18

  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);

  const t2a = (h: number, m: number) => ((h * 60 + m) / 1440) * 360;
  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
  };

  const bA = t2a(bH, bM), wA = t2a(wH, wM);
  let sweep = wA - bA;
  if (sweep <= 0) sweep += 360;

  const arc = () => {
    const la = sweep > 180 ? 1 : 0;
    const s = polar(bA, oR), e = polar(bA + sweep, oR);
    const si = polar(bA, iR), ei = polar(bA + sweep, iR);
    return `M ${s.x} ${s.y} A ${oR} ${oR} 0 ${la} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${iR} ${iR} 0 ${la} 0 ${si.x} ${si.y} Z`;
  };

  let dM = (wH * 60 + wM) - (bH * 60 + bM);
  if (dM <= 0) dM += 1440;
  const dH = Math.floor(dM / 60), dMn = dM % 60;

  // ── Tick marks ──
  const ticks: { p1: {x:number;y:number}; p2: {x:number;y:number}; type: 'quarter'|'major'|'minor' }[] = [];
  for (let idx = 0; idx < 48; idx++) {
    const ang = (idx / 48) * 360;
    const isQuarter = idx % 12 === 0;
    const isMajor = idx % 2 === 0;
    const len = isQuarter ? 10 : isMajor ? 5 : 3;
    ticks.push({
      p1: polar(ang, oR + 2),
      p2: polar(ang, oR + 2 + len),
      type: isQuarter ? 'quarter' : isMajor ? 'major' : 'minor',
    });
  }

  const bedTip = polar(bA, midR);
  const wakeTip = polar(bA + sweep, midR);

  const [drag, setDrag] = useState<'b' | 'w' | null>(null);

  const getAngle = useCallback((cx: number, cy: number) => {
    if (!svgRef.current) return 0;
    const r = svgRef.current.getBoundingClientRect();
    const x = (cx - r.left) * (S / r.width) - C;
    const y = (cy - r.top) * (S / r.height) - C;
    let a = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (a < 0) a += 360;
    return a;
  }, []);

  const a2t = (a: number) => {
    const tm = Math.round((a / 360) * 1440);
    const h = Math.floor(tm / 60) % 24;
    const m = Math.round((tm % 60) / 5) * 5 % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    e.preventDefault();
    const t = a2t(getAngle(e.clientX, e.clientY));
    if (drag === 'b') onBedtimeChange(t); else onWakeTimeChange(t);
  }, [drag, getAngle, onBedtimeChange, onWakeTimeChange]);

  const stop = useCallback(() => setDrag(null), []);

  return (
    <div className="flex justify-center">
      <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`}
        className="w-[270px] h-[270px] md:w-[300px] md:h-[300px] touch-none select-none"
        onPointerMove={onMove} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}>
        <defs>
          <linearGradient id="slpG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d3a8c" />
            <stop offset="30%" stopColor="#4a5bd4" />
            <stop offset="60%" stopColor="#8b7230" />
            <stop offset="85%" stopColor="#d4a120" />
            <stop offset="100%" stopColor="#f0b429" />
          </linearGradient>
          <filter id="arcGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#4a5bd4" floodOpacity="0.25" />
          </filter>
          <filter id="iconGlow">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle cx={C} cy={C} r={midR} fill="none" stroke="hsl(240 6% 14%)" strokeWidth={bandW} opacity="0.45" />

        {/* Sleep arc */}
        <path d={arc()} fill="url(#slpG)" filter="url(#arcGlow)" />

        {/* Rounded caps */}
        <circle cx={bedTip.x} cy={bedTip.y} r={capR} fill="#2d3a8c" />
        <circle cx={wakeTip.x} cy={wakeTip.y} r={capR} fill="#d4a120" />

        {/* Inner dark circle */}
        <circle cx={C} cy={C} r={iR - 1} fill="hsl(240 10% 4%)" />

        {/* Tick marks — outside ring */}
        {ticks.map((t, idx) => (
          <line key={idx} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
            stroke={
              t.type === 'quarter' ? "rgba(255,255,255,0.5)" :
              t.type === 'major' ? "rgba(255,255,255,0.15)" :
              "rgba(255,255,255,0.06)"
            }
            strokeWidth={t.type === 'quarter' ? 2 : 1}
            strokeLinecap="round" />
        ))}

        {/* Hour labels */}
        {[0, 6, 12, 18].map(h => {
          const p = polar((h / 24) * 360, iR - 16);
          return <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.4)" fontSize="12" fontWeight="600" fontFamily="system-ui">{h}</text>;
        })}

        {/* Center duration */}
        <text x={C} y={C - 10} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="26" fontWeight="700" fontFamily="system-ui">
          {dH}h{dMn > 0 ? ` ${dMn}m` : ''}
        </text>
        <text x={C} y={C + 12} textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="system-ui">de descanso</text>

        {/* Moon — inside arc at bedtime */}
        <g onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setDrag('b'); }}
          style={{ cursor: drag === 'b' ? 'grabbing' : 'grab' }}>
          <circle cx={bedTip.x} cy={bedTip.y} r={capR} fill="#1e1b4b" stroke="#4a5bd4" strokeWidth="1.5" filter="url(#iconGlow)" />
          <g transform={`translate(${bedTip.x - 7},${bedTip.y - 7}) scale(0.58)`}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="#c7d2fe" />
          </g>
        </g>

        {/* Bell — inside arc at wake */}
        <g onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setDrag('w'); }}
          style={{ cursor: drag === 'w' ? 'grabbing' : 'grab' }}>
          <circle cx={wakeTip.x} cy={wakeTip.y} r={capR} fill="#451a03" stroke="#d4a120" strokeWidth="1.5" filter="url(#iconGlow)" />
          <g transform={`translate(${wakeTip.x - 7},${wakeTip.y - 7}) scale(0.58)`}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="#fde68a" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="#fde68a" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SLEEP SCORE RING — Animated circular score
// ═══════════════════════════════════════════════════════════

function SleepScoreRing({ score }: { score: number }) {
  const size = 100, C = size / 2, R = 38, stroke = 6;
  const circ = 2 * Math.PI * R;
  const offset = circ - (Math.min(100, score) / 100) * circ;

  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171';
  const label = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom' : score >= 55 ? 'Regular' : score >= 40 ? 'Ruim' : 'Crítico';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={C} cy={C} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${C} ${C})`}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}40)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] text-white/30">{label}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SLEEP LINE CHART — SVG line with color zones
// ═══════════════════════════════════════════════════════════

function SleepLineChart({ data, goalMins }: { data: { label: string; mins: number; score: number }[]; goalMins: number }) {
  const W = 320, H = 200, padX = 32, padTop = 24, padBot = 22;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBot;

  // CRITICAL: Scale from 4h to 10h — amplifies real differences
  const floorMins = 240;  // 4h = bottom of chart
  const ceilMins = 600;   // 10h = top of chart
  const range = ceilMins - floorMins; // 360 mins of visual range

  const yFor = (mins: number) => {
    const clamped = Math.max(floorMins, Math.min(ceilMins, mins));
    const ratio = (clamped - floorMins) / range;
    return padTop + chartH - ratio * chartH;
  };

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(1, data.length - 1)) * chartW,
    y: d.mins > 0 ? yFor(d.mins) : yFor(floorMins),
    mins: d.mins,
    score: d.score,
    label: d.label,
  }));

  const active = points.filter(p => p.mins > 0);
  const baseY = yFor(floorMins); // bottom of chart area (4h)

  const getColor = (mins: number) => {
    if (mins >= goalMins) return '#4ade80';
    if (mins >= 420) return '#818cf8';
    if (mins >= 360) return '#facc15';
    return '#f87171';
  };

  // Cardinal spline
  const smoothPath = (pts: typeof active) => {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const t = 0.3;
      path += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const curve = smoothPath(active);
  const area = active.length >= 2
    ? `${curve} L ${active[active.length - 1].x} ${baseY} L ${active[0].x} ${baseY} Z` : '';

  // Grid lines data
  const gridLines = [
    { mins: 600, label: '10h', color: 'rgba(255,255,255,0.04)', lc: 'rgba(255,255,255,0.1)' },
    { mins: 540, label: '9h', color: 'rgba(255,255,255,0.04)', lc: 'rgba(255,255,255,0.12)' },
    { mins: goalMins, label: '8h', color: 'rgba(74,222,128,0.2)', lc: 'rgba(74,222,128,0.5)' },
    { mins: 420, label: '7h', color: 'rgba(129,140,248,0.12)', lc: 'rgba(129,140,248,0.35)' },
    { mins: 360, label: '6h', color: 'rgba(250,204,21,0.1)', lc: 'rgba(250,204,21,0.3)' },
    { mins: 300, label: '5h', color: 'rgba(248,113,113,0.08)', lc: 'rgba(248,113,113,0.25)' },
    { mins: 240, label: '4h', color: 'rgba(255,255,255,0.03)', lc: 'rgba(255,255,255,0.08)' },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="sleepAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sleepLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          {active.map((p, i) => (
            <stop key={i} offset={`${(i / Math.max(1, active.length - 1)) * 100}%`} stopColor={getColor(p.mins)} />
          ))}
        </linearGradient>
      </defs>

      {/* Goal zone highlight (7h-8h band) */}
      <rect x={padX} y={yFor(goalMins)} width={chartW} height={yFor(420) - yFor(goalMins)}
        fill="rgba(74,222,128,0.04)" rx="4" />

      {/* Grid lines */}
      {gridLines.map((line, i) => {
        const y = yFor(line.mins);
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y}
              stroke={line.color} strokeWidth="0.8"
              strokeDasharray={line.mins === goalMins ? '5 3' : '3 5'} />
            <text x={padX - 5} y={y} textAnchor="end" dominantBaseline="central"
              fill={line.lc} fontSize="8" fontWeight="500">{line.label}</text>
          </g>
        );
      })}

      {/* "META" label next to 8h */}
      <text x={padX + chartW + 4} y={yFor(goalMins)} textAnchor="start" dominantBaseline="central"
        fill="rgba(74,222,128,0.35)" fontSize="7" fontWeight="600">META</text>

      {/* Area fill */}
      {area && <path d={area} fill="url(#sleepAreaGrad)" />}

      {/* Gradient line */}
      {curve && (
        <path d={curve} fill="none" stroke="url(#sleepLineGrad)" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.3))' }} />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          {p.mins > 0 ? (
            <>
              {/* Outer glow */}
              <circle cx={p.x} cy={p.y} r="8" fill={getColor(p.mins)} opacity="0.1" />
              {/* Main dot */}
              <circle cx={p.x} cy={p.y} r="5" fill={getColor(p.mins)}
                stroke="hsl(240 10% 4%)" strokeWidth="2" />
              {/* Value label */}
              <rect x={p.x - 18} y={p.y - 22} width="36" height="14" rx="4"
                fill="rgba(0,0,0,0.5)" />
              <text x={p.x} y={p.y - 14} textAnchor="middle" dominantBaseline="central"
                fill={getColor(p.mins)} fontSize="9" fontWeight="700">
                {Math.floor(p.mins / 60)}h{p.mins % 60 > 0 ? `${p.mins % 60}m` : ''}
              </text>
            </>
          ) : (
            <>
              <line x1={p.x} y1={baseY - 4} x2={p.x} y2={baseY + 4}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx={p.x} cy={baseY} r="2.5" fill="rgba(255,255,255,0.06)"
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </>
          )}
          {/* X label */}
          <text x={p.x} y={H - 5} textAnchor="middle" fill="rgba(255,255,255,0.35)"
            fontSize="9" fontWeight="500">{p.label}</text>
        </g>
      ))}

      {/* Empty state */}
      {active.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="11">
          Registre noites para ver o gráfico
        </text>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// NIGHT FACTORS — Tags for morning check-in
// ═══════════════════════════════════════════════════════════

const NIGHT_FACTORS = [
  { id: 'sex', label: 'Intimidade', icon: '💜', positive: true },
  { id: 'no_interruption', label: 'Sem interrupção', icon: '✨', positive: true },
  { id: 'meditation', label: 'Meditou', icon: '🧘', positive: true },
  { id: 'hot_bath', label: 'Banho quente', icon: '🛁', positive: true },
  { id: 'nightmare', label: 'Pesadelo', icon: '😰', positive: false },
  { id: 'bathroom', label: 'Acordou p/ banheiro', icon: '🚽', positive: false },
  { id: 'screen', label: 'Muita tela', icon: '📱', positive: false },
  { id: 'heavy_meal', label: 'Refeição pesada', icon: '🍔', positive: false },
  { id: 'pain', label: 'Dor', icon: '🤕', positive: false },
  { id: 'stress', label: 'Estresse', icon: '😤', positive: false },
  { id: 'coffee', label: 'Cafeína tarde', icon: '☕', positive: false },
  { id: 'alcohol', label: 'Álcool', icon: '🍷', positive: false },
];

const SLEEP_NOTES = [
  { id: 1, label: 'Péssima', color: '#f87171' },
  { id: 2, label: 'Ruim', color: '#fb923c' },
  { id: 3, label: 'OK', color: '#facc15' },
  { id: 4, label: 'Boa', color: '#818cf8' },
  { id: 5, label: 'Incrível', color: '#4ade80' },
];

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function SonoPage() {
  const { toast } = useToast();
  const { logs, updateLog } = useDailyLog();

  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [sleepRating, setSleepRating] = useState(0);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [chartTab, setChartTab] = useState<'semana' | 'mes'>('semana');
  const [usedPhrases, setUsedPhrases] = useState<Record<string, string[]>>({});

  const goalMins = 480;

  useEffect(() => {
    const h = new Date().getHours();
    const now = format(new Date(), 'HH:mm');
    if (h >= 4 && h < 15) setWakeTime(now); else setBedtime(now);
    try { const s = localStorage.getItem('moooUsedSleepPhrases'); if (s) setUsedPhrases(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('moooUsedSleepPhrases', JSON.stringify(usedPhrases)); } catch {}
  }, [usedPhrases]);

  const getPhrase = (mins: number): string => {
    const h = mins / 60;
    let cat: keyof typeof sleepPhrases;
    if (h >= 7 && h < 10) cat = 'good'; else if (h >= 10) cat = 'tooMuch';
    else if (h > 0 && h < 7) cat = 'little'; else cat = 'general';
    let pool = sleepPhrases[cat].filter(p => !usedPhrases[cat]?.includes(p));
    if (!pool.length) { setUsedPhrases(p => ({ ...p, [cat]: [] })); pool = sleepPhrases[cat]; }
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    setUsedPhrases(p => ({ ...p, [cat]: [...(p[cat] || []), phrase] }));
    return phrase;
  };

  const handleSave = () => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) {
      toast({ title: "Horários inválidos", variant: "destructive" }); return;
    }
    const bed = startOfToday(); bed.setHours(bH, bM, 0, 0);
    const wake = new Date(bed); wake.setHours(wH, wM, 0, 0);
    if (wake <= bed) wake.setDate(wake.getDate() + 1);
    const totalMins = differenceInMinutes(wake, bed);
    if (totalMins <= 0) { toast({ title: "Horários inválidos", variant: "destructive" }); return; }

    const quality = sleepRating > 0 ? sleepRating : Math.max(1, Math.min(5, Math.round((totalMins / goalMins) * 5)));
    const key = format(bed, 'yyyy-MM-dd');

    updateLog(key, {
      sleepLog: {
        id: crypto.randomUUID(),
        date: key,
        bedtime,
        wakeTime,
        totalMinutes: totalMins,
        quality,
      }
    });

    toast({ title: "Sono registrado!", description: getPhrase(totalMins) });
    setShowCheckinModal(false);
    setSelectedFactors([]);
    setSleepRating(0);
  };

  // ── Derived data ──
  const sleepLogs = useMemo(() =>
    Object.values(logs).filter(l => l.sleepLog).map(l => l.sleepLog as SleepLog)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]);

  const last = sleepLogs[0];

  // ── Week data (line chart) ──
  const weekData = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const we = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ws, end: we }).map(d => {
      const log = logs[format(d, 'yyyy-MM-dd')]?.sleepLog;
      return {
        label: format(d, 'EEE', { locale: ptBR }).replace('.', ''),
        mins: log?.totalMinutes || 0,
        score: log?.quality || 0,
      };
    });
  }, [logs]);

  // ── Previous week for comparison ──
  const prevWeekAvg = useMemo(() => {
    const ws = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const we = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: ws, end: we });
    const vals = days.map(d => logs[format(d, 'yyyy-MM-dd')]?.sleepLog?.totalMinutes || 0).filter(m => m > 0);
    return vals.length > 0 ? vals.reduce((s, m) => s + m, 0) / vals.length : null;
  }, [logs]);

  // ── Month data ──
  const monthData = useMemo(() => {
    const ms = startOfMonth(new Date());
    const me = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: ms, end: me });
    const weeks: { mins: number; count: number; score: number }[] = [];
    let wm = 0, wc = 0, ws = 0;
    days.forEach((d, i) => {
      const log = logs[format(d, 'yyyy-MM-dd')]?.sleepLog;
      if (log) { wm += log.totalMinutes; wc++; ws += log.quality; }
      if (getDay(d) === 0 || i === days.length - 1) {
        weeks.push({ mins: wc > 0 ? Math.round(wm / wc) : 0, count: wc, score: wc > 0 ? Math.round(ws / wc) : 0 });
        wm = 0; wc = 0; ws = 0;
      }
    });
    return weeks.map((w, i) => ({ label: `S${i + 1}`, mins: w.mins, score: w.score }));
  }, [logs]);

  // ── Averages ──
  const weekAvg = useMemo(() => {
    const f = weekData.filter(d => d.mins > 0);
    if (!f.length) return null;
    const avg = f.reduce((s, d) => s + d.mins, 0) / f.length;
    return { total: avg, h: Math.floor(avg / 60), m: Math.round(avg % 60) };
  }, [weekData]);

  const monthAvg = useMemo(() => {
    const all = Object.values(logs).filter(l => l.sleepLog).map(l => l.sleepLog!.totalMinutes);
    if (!all.length) return null;
    const avg = all.reduce((s, m) => s + m, 0) / all.length;
    return { total: avg, h: Math.floor(avg / 60), m: Math.round(avg % 60) };
  }, [logs]);

  // ── Sleep Score ──
  const sleepScore = useMemo(() => {
    const f = weekData.filter(d => d.mins > 0);
    if (!f.length) return 0;
    const durationRatio = Math.min(1, (weekAvg?.total || 0) / goalMins);
    const durationScore = durationRatio * 50;
    const consistencyScore = (f.length / 7) * 30;
    const avgQ = f.reduce((s, d) => s + d.score, 0) / f.length;
    const qualityScore = (avgQ / 5) * 20;
    return Math.round(durationScore + consistencyScore + qualityScore);
  }, [weekData, weekAvg, goalMins]);

  const chartData = chartTab === 'semana' ? weekData : monthData;
  const avg = chartTab === 'semana' ? weekAvg : monthAvg;

  // ── Trend ──
  const trendDiff = weekAvg && prevWeekAvg ? (weekAvg.total - prevWeekAvg) / 60 : null;

  return (
    <div className="min-h-screen pb-28">

      {/* ════════════════════════════════════════════
          MANDALA — Flutuando direto no background
          ════════════════════════════════════════════ */}
      <div className="pt-4 pb-2">
        <SleepMandala
          bedtime={bedtime} wakeTime={wakeTime}
          onBedtimeChange={setBedtime} onWakeTimeChange={setWakeTime}
        />
      </div>

      {/* ════════════════════════════════════════════
          INFO DORMIU/ACORDOU + SCORE
          ════════════════════════════════════════════ */}
      <div className="px-5 mt-1">
        <div className="flex items-center gap-4">
          {/* Times */}
          <div className="flex-1 space-y-0">
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Moon className="h-3 w-3 text-indigo-400" />
                </div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Dormiu</span>
              </div>
              <button
                onClick={() => { const v = prompt('Hora de dormir (HH:MM):', bedtime); if (v && /^\d{2}:\d{2}$/.test(v)) setBedtime(v); }}
                className="text-xl font-bold tracking-tight hover:text-primary transition-colors">{bedtime}</button>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Bell className="h-3 w-3 text-amber-400" />
                </div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Acordou</span>
              </div>
              <button
                onClick={() => { const v = prompt('Hora de acordar (HH:MM):', wakeTime); if (v && /^\d{2}:\d{2}$/.test(v)) setWakeTime(v); }}
                className="text-xl font-bold tracking-tight hover:text-primary transition-colors">{wakeTime}</button>
            </div>
          </div>

          {/* Score ring */}
          <div className="shrink-0">
            <SleepScoreRing score={sleepScore} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          BOTÃO REGISTRAR
          ════════════════════════════════════════════ */}
      <div className="px-4 mt-4">
        <Button onClick={() => setShowCheckinModal(true)}
          className="w-full rounded-xl bg-primary font-medium h-12 text-sm">
          Registrar Noite
        </Button>
      </div>

      {/* ════════════════════════════════════════════
          GRÁFICO DE LINHAS — Semana / Mês
          ════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duração do Sono</p>
            {trendDiff !== null && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                trendDiff > 0 ? 'bg-emerald-500/15 text-emerald-400' :
                trendDiff < -0.3 ? 'bg-red-500/15 text-red-400' :
                'bg-white/5 text-white/30'
              }`}>
                {trendDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> :
                 trendDiff < -0.3 ? <TrendingDown className="w-2.5 h-2.5" /> :
                 <Minus className="w-2.5 h-2.5" />}
                {Math.abs(trendDiff).toFixed(1)}h
              </span>
            )}
          </div>
          <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            {(['semana', 'mes'] as const).map(t => (
              <button key={t} onClick={() => setChartTab(t)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  chartTab === t ? 'bg-primary text-white' : 'text-muted-foreground'
                }`}>
                {t === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
        <Card className="claymorphism bg-card/80 border-white/[0.06]">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">Média {chartTab === 'semana' ? 'semanal' : 'mensal'}</span>
              <span className="text-lg font-bold">{avg ? `${avg.h}h ${avg.m}m` : '--'}</span>
            </div>
            <SleepLineChart data={chartData} goalMins={goalMins} />
            {/* Legend */}
            <div className="flex justify-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[8px] text-muted-foreground">8h+ (meta)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-[8px] text-muted-foreground">7-8h</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-[8px] text-muted-foreground">6-7h</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[8px] text-muted-foreground">&lt;6h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════
          ÚLTIMA NOITE
          ════════════════════════════════════════════ */}
      {last && (
        <div className="px-4 mt-5">
          <p className="text-[10px] text-muted-foreground mb-2 px-1 uppercase tracking-wider font-medium">Última noite</p>
          <Card className="claymorphism bg-card/80 border-white/[0.06]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{format(new Date(last.date + 'T00:00:00'), "EEEE, dd MMM", { locale: ptBR })}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">{last.bedtime} → {last.wakeTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{Math.floor(last.totalMinutes / 60)}h {last.totalMinutes % 60}m</p>
                  <div className="flex justify-end mt-0.5 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < last.quality ? 'bg-amber-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════
          RELAXAMENTO
          ════════════════════════════════════════════ */}
      <div className="px-4 mt-5">
        <p className="text-[10px] text-muted-foreground mb-2 px-1 uppercase tracking-wider font-medium">Relaxamento</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/vibe/sono/sons-relaxantes', icon: Music, label: 'Sons', color: 'text-emerald-400' },
            { href: '/vibe/sono/meditacao', icon: Brain, label: 'Meditação', color: 'text-purple-400' },
            { href: '', icon: Wind, label: 'Respiração', color: 'text-sky-400' },
            { href: '', icon: Sparkles, label: 'Histórias', color: 'text-amber-300' },
          ].map(item => {
            const Icon = item.icon;
            const card = (
              <Card className="claymorphism bg-card/80 border-white/[0.06] p-4 flex flex-col items-center justify-center text-center min-h-[80px] hover:border-white/[0.12] transition-colors">
                <Icon className={`h-5 w-5 mb-1.5 ${item.color}`} />
                <p className="text-xs font-medium">{item.label}</p>
              </Card>
            );
            return item.href ? <Link key={item.label} href={item.href}>{card}</Link> : <div key={item.label} className="opacity-40">{card}</div>;
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          HISTÓRICO
          ════════════════════════════════════════════ */}
      {sleepLogs.length > 1 && (
        <div className="px-4 mt-5">
          <p className="text-[10px] text-muted-foreground mb-2 px-1 uppercase tracking-wider font-medium">Histórico</p>
          <div className="space-y-2">
            {sleepLogs.slice(1, 6).map(log => (
              <Card key={log.id} className="claymorphism bg-card/60 border-white/[0.04] p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{format(new Date(log.date + 'T00:00:00'), "EEE, dd MMM", { locale: ptBR })}</p>
                    <p className="text-[11px] text-muted-foreground/50">{log.bedtime} → {log.wakeTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Math.floor(log.totalMinutes / 60)}h {log.totalMinutes % 60}m</p>
                    <div className="flex justify-end gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < log.quality ? 'bg-amber-400' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MORNING CHECK-IN MODAL
          ════════════════════════════════════════════ */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCheckinModal(false)} />
          <div className="relative w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto bg-background/40 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] p-6"
            style={{ animation: 'modalIn 0.3s ease-out' }}>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            <button onClick={() => setShowCheckinModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Sleep Rating */}
            <div className="mb-6">
              <h3 className="text-lg font-bold">Como foi a noite?</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Dê uma nota para sua noite de sono</p>
              <div className="flex gap-2 mt-3">
                {SLEEP_NOTES.map(n => (
                  <button key={n.id} onClick={() => setSleepRating(n.id)}
                    className={`flex-1 py-3 rounded-2xl text-center transition-all border ${
                      sleepRating === n.id
                        ? 'border-white/20 scale-105'
                        : 'border-white/[0.04] bg-white/[0.03]'
                    }`}
                    style={sleepRating === n.id ? { backgroundColor: `${n.color}20`, borderColor: `${n.color}40` } : {}}>
                    <div className="text-lg font-bold" style={{ color: sleepRating === n.id ? n.color : 'rgba(255,255,255,0.3)' }}>{n.id}</div>
                    <div className="text-[8px] mt-0.5" style={{ color: sleepRating === n.id ? n.color : 'rgba(255,255,255,0.2)' }}>{n.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Night Factors */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3">O que marcou sua noite?</p>
              <div className="grid grid-cols-2 gap-2">
                {NIGHT_FACTORS.map(f => {
                  const on = selectedFactors.includes(f.id);
                  return (
                    <button key={f.id}
                      onClick={() => setSelectedFactors(p => on ? p.filter(x => x !== f.id) : [...p, f.id])}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all border ${
                        on
                          ? f.positive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
                          : 'bg-white/[0.04] border-white/[0.04] text-muted-foreground hover:bg-white/[0.08]'
                      }`}>
                      <span className="text-sm">{f.icon}</span>
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save */}
            <Button onClick={handleSave} className="w-full rounded-xl bg-primary font-medium h-12 text-sm">
              Salvar Noite
            </Button>
            <button onClick={() => { setShowCheckinModal(false); handleSave(); }}
              className="w-full text-center text-xs text-muted-foreground mt-3 py-2 hover:text-foreground transition-colors">
              Pular anotações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}