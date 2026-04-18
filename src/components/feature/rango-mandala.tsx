"use client";

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export interface RangoMandalaProps {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  fiber: number;
  fiberGoal: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
}

export interface WeeklyMandalaDay {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isToday?: boolean;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const VIEW = 220;
const CX = VIEW / 2;

const RINGS = {
  lg: [
    { r: 98, sw: 16 },
    { r: 78, sw: 14 },
    { r: 60, sw: 12 },
    { r: 44, sw: 10 },
    { r: 30, sw: 8 },
  ],
  md: [
    { r: 90, sw: 14 },
    { r: 72, sw: 12 },
    { r: 56, sw: 10 },
    { r: 42, sw: 8 },
    { r: 30, sw: 6 },
  ],
  sm: [
    { r: 82, sw: 10 },
    { r: 68, sw: 8 },
    { r: 56, sw: 7 },
    { r: 45, sw: 6 },
    { r: 36, sw: 5 },
  ],
};

const SIZES = { lg: 'w-64 h-64', md: 'w-52 h-52', sm: 'w-12 h-12' };

export const COLORS = [
  { label: 'Calorias',     hexStart: '#7bed9f', hexEnd: '#00b894' },
  { label: 'Carboidratos', hexStart: '#74b9ff', hexEnd: '#4834d4' },
  { label: 'Proteinas',    hexStart: '#fd79a8', hexEnd: '#e84393' },
  { label: 'Gorduras',     hexStart: '#ffeaa7', hexEnd: '#d4a017' },
  { label: 'Fibras',       hexStart: '#81ecec', hexEnd: '#00897b' },
];

const EXCESS_START = '#fb923c';
const EXCESS_END = '#dc2626';

// ═══════════════════════════════════════════════════
// COLOR MATH
// ═══════════════════════════════════════════════════

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('');
}
function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1), [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function polar(r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CX + r * Math.sin(rad) };
}

// ═══════════════════════════════════════════════════
// SEGMENTED ARC — gradient along the stroke path
// ═══════════════════════════════════════════════════

const SEG_DEG = 4;

function SegmentedArc({ r, sw, startDeg, endDeg, hexStart, hexEnd, cw, opacity = 1 }: {
  r: number; sw: number; startDeg: number; endDeg: number;
  hexStart: string; hexEnd: string; cw: boolean; opacity?: number;
}) {
  if (endDeg - startDeg < 0.5) return null;
  const totalDeg = endDeg - startDeg;
  const segments = Math.max(1, Math.ceil(totalDeg / SEG_DEG));
  const step = totalDeg / segments;
  const paths = [];
  for (let i = 0; i < segments; i++) {
    const s = startDeg + i * step;
    const e = Math.min(startDeg + (i + 1) * step + 0.3, endDeg);
    const t = segments === 1 ? 0.5 : i / (segments - 1);
    const color = lerpColor(hexStart, hexEnd, t);
    const p1 = polar(r, e), p2 = polar(r, s);
    const large = (e - s) > 180 ? 1 : 0;
    const d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 0 ${p2.x} ${p2.y}`;
    paths.push(
      <path key={i} d={d} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap={i === 0 || i === segments - 1 ? 'round' : 'butt'} opacity={opacity} />
    );
  }
  return <g transform={cw ? '' : `scale(-1,1) translate(${-VIEW},0)`}>{paths}</g>;
}

// ═══════════════════════════════════════════════════
// ANIMATED RING (lg / md)
// ═══════════════════════════════════════════════════

function AnimRing({ r, sw, value, goal, hexStart, hexEnd, cw }: {
  idx: number; r: number; sw: number;
  value: number; goal: number; hexStart: string; hexEnd: string; cw: boolean;
}) {
  const [a, setA] = useState(0);
  const t = goal > 0 ? Math.min(value / goal, 1.5) : 0;
  useEffect(() => {
    let f: number;
    const d = 800, t0 = performance.now(), from = a;
    function tick(now: number) {
      const p = Math.min((now - t0) / d, 1);
      setA(from + (t - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) f = requestAnimationFrame(tick);
    }
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  const norm = Math.min(a * 360, 359.9);
  const excess = a > 1 ? Math.min((a - 1) * 360, 179.9) : 0;
  const cap = polar(r, 0);
  return (
    <g>
      <circle cx={CX} cy={CX} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
      {norm > 0.5 && <SegmentedArc r={r} sw={sw} startDeg={0} endDeg={norm} hexStart={hexStart} hexEnd={hexEnd} cw={cw} />}
      {excess > 0.5 && <SegmentedArc r={r} sw={sw} startDeg={0} endDeg={excess} hexStart={EXCESS_START} hexEnd={EXCESS_END} cw={cw} opacity={0.9} />}
      {value > 0 && <circle cx={cap.x} cy={cap.y} r={sw / 2 - 1} fill={hexStart} opacity={0.6} />}
    </g>
  );
}

// ═══════════════════════════════════════════════════
// STATIC RING (sm)
// ═══════════════════════════════════════════════════

function StatRing({ r, sw, value, goal, hexStart, hexEnd, cw }: {
  idx: number; r: number; sw: number;
  value: number; goal: number; hexStart: string; hexEnd: string; cw: boolean;
}) {
  const p = goal > 0 ? Math.min(value / goal, 1.5) : 0;
  const a = Math.min(p * 360, 359.9);
  const ex = p > 1 ? Math.min((p - 1) * 360, 179.9) : 0;
  return (
    <g>
      <circle cx={CX} cy={CX} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />
      {a > 0.5 && <SegmentedArc r={r} sw={sw} startDeg={0} endDeg={a} hexStart={hexStart} hexEnd={hexEnd} cw={cw} />}
      {ex > 0.5 && <SegmentedArc r={r} sw={sw} startDeg={0} endDeg={ex} hexStart={EXCESS_START} hexEnd={EXCESS_END} cw={cw} opacity={0.9} />}
    </g>
  );
}

// ═══════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════

function EmptyState({ rings }: { rings: { r: number; sw: number }[] }) {
  const c = 2 * Math.PI * rings[0].r;
  return (
    <svg className="w-full h-full animate-spin-slow" viewBox={`0 0 ${VIEW} ${VIEW}`} style={{ opacity: 0.35 }}>
      <defs>
        <linearGradient id="rango-empty" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.7} />
          <stop offset="70%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
        </linearGradient>
      </defs>
      {rings.map((ring, i) => (
        <circle key={i} cx={CX} cy={CX} r={ring.r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={ring.sw} />
      ))}
      <circle cx={CX} cy={CX} r={rings[0].r} fill="none" stroke="url(#rango-empty)" strokeWidth={rings[0].sw}
        strokeDasharray={`${c * 0.6} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${CX} ${CX})`} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function RangoMandala({
  calories, caloriesGoal, protein, proteinGoal,
  carbs, carbsGoal, fat, fatGoal, fiber, fiberGoal,
  size = 'lg', className, showLabels = true,
}: RangoMandalaProps) {
  const rings = RINGS[size];
  const macros = useMemo(() => [
    { value: calories, goal: caloriesGoal },
    { value: carbs,    goal: carbsGoal },
    { value: protein,  goal: proteinGoal },
    { value: fat,      goal: fatGoal },
    { value: fiber,    goal: fiberGoal },
  ], [calories, caloriesGoal, carbs, carbsGoal, protein, proteinGoal, fat, fatGoal, fiber, fiberGoal]);

  const empty = macros.every(m => m.value === 0);
  const Ring = size === 'sm' ? StatRing : AnimRing;

  return (
    <div className={cn('relative mx-auto flex flex-col items-center', SIZES[size], className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        {empty ? <EmptyState rings={rings} /> : (
          <svg className="w-full h-full" viewBox={`0 0 ${VIEW} ${VIEW}`}>
            {rings.map((ring, i) => (
              <Ring key={i} idx={i} r={ring.r} sw={ring.sw}
                value={macros[i].value} goal={macros[i].goal}
                hexStart={COLORS[i].hexStart} hexEnd={COLORS[i].hexEnd}
                cw={i % 2 === 0} />
            ))}
          </svg>
        )}
      </div>

      {/* Center: just the number + "kcal" */}
      {size !== 'sm' && (
        <div className="z-10 flex flex-col items-center justify-center h-full">
          <span className="text-2xl font-bold tabular-nums text-foreground tracking-tight">
            {calories.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-muted-foreground/40 mt-0.5">kcal</span>
        </div>
      )}

      {/* Labels inside subtle card — 3 cols grid, dot + name + % */}
      {showLabels && size === 'lg' && (
        <div className="w-full mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
            {COLORS.map((c, i) => {
              const pct = macros[i].goal > 0 ? Math.round((macros[i].value / macros[i].goal) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <div className="w-[6px] h-[6px] rounded-[2px] shrink-0"
                    style={{ background: `linear-gradient(135deg, ${c.hexStart}, ${c.hexEnd})` }} />
                  <span className="text-[9px] text-muted-foreground/50 truncate flex-1">{c.label}</span>
                  <span className={cn('text-[9px] font-semibold tabular-nums shrink-0',
                    pct > 100 ? 'text-amber-400' : 'text-foreground/50')}>{pct}%</span>
                </div>
              );
            })}
            {/* 6th slot: Vitalidade */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-[6px] h-[6px] rounded-[2px] shrink-0 bg-gradient-to-br from-violet-400 to-violet-700" />
              <span className="text-[9px] text-muted-foreground/50 truncate flex-1">Vitalidade</span>
              <span className="text-[9px] font-semibold tabular-nums shrink-0 text-primary">--</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// WEEKLY MINI MANDALAS
// ═══════════════════════════════════════════════════

export function WeeklyMandalas({ days, goals, className }: {
  days: WeeklyMandalaDay[]; goals: MacroGoals; className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-1', className)}>
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <RangoMandala
            calories={d.calories} caloriesGoal={goals.calories}
            protein={d.protein} proteinGoal={goals.protein}
            carbs={d.carbs} carbsGoal={goals.carbs}
            fat={d.fat} fatGoal={goals.fat}
            fiber={d.fiber} fiberGoal={goals.fiber}
            size="sm" showLabels={false}
          />
          <span className="text-[9px] text-muted-foreground/30">{d.label}</span>
        </div>
      ))}
    </div>
  );
}