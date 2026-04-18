
"use client";

import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { CheckinResult } from './emotion-picker';

// --- CONFIGURATION ---
const MAX_CHECKINS = 7;
const STROKE_WIDTH = 20;
const RADIUS = 90; // Ajustado para caber bem no viewBox 220
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 5; // graus

// Gradientes com contraste REAL — mapeados para os IDs de quadrante do app
const MOOD_COLORS: { [key: string]: { start: string; end: string } } = {
  'high-unpleasant': { start: '#ff6b6b', end: '#c0392b' }, // Raiva, ansiedade
  'high-pleasant': { start: '#ffd32a', end: '#e17055' },   // Alegria, empolgação
  'low-pleasant': { start: '#7bed9f', end: '#00b894' },    // Calma, paz
  'low-unpleasant': { start: '#74b9ff', end: '#4834d4' },   // Tristeza, cansaço
  'default': { start: '#a29bfe', end: '#6c5ce7' },         // Roxo padrão
};

interface CheckinDonutProps {
  checkins: CheckinResult[];
  onCheckinClick: () => void;
}

// Auxiliares para cálculo de arco SVG
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function CheckinDonut({ checkins = [], onCheckinClick }: CheckinDonutProps) {
  const checkinCount = checkins.length;

  const renderInitialState = () => {
    const initialArcLength = (CIRCUMFERENCE * 225) / 360;
    return (
      <svg className="w-full h-full animate-spin-slow" viewBox="0 0 220 220" style={{ opacity: 0.80 }}>
        <defs>
          <linearGradient id="initialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
            <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle
          cx="110" cy="110" r={RADIUS}
          fill="transparent"
          stroke="hsl(var(--muted) / 0.1)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx="110" cy="110" r={RADIUS}
          fill="transparent"
          stroke="url(#initialGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${initialArcLength} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 110 110)"
        />
      </svg>
    );
  };

  const renderActiveState = () => {
    const segmentAngle = 360 / MAX_CHECKINS;
    const arcAngle = segmentAngle - SEGMENT_GAP;

    return (
      <svg className="w-full h-full" viewBox="0 0 220 220">
        <defs>
          {checkins.slice(0, MAX_CHECKINS).map((checkin, index) => {
            const color = MOOD_COLORS[checkin.quadrant] || MOOD_COLORS.default;
            const gradientId = `mood-gradient-${index}`;
            const startAngleDeg = -90 + index * segmentAngle;
            
            const gradStart = polarToCartesian(110, 110, RADIUS, startAngleDeg);
            const gradEnd = polarToCartesian(110, 110, RADIUS, startAngleDeg + arcAngle);

            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1={gradStart.x}
                y1={gradStart.y}
                x2={gradEnd.x}
                y2={gradEnd.y}
              >
                <stop offset="0%" stopColor={color.start} />
                <stop offset="100%" stopColor={color.end} />
              </linearGradient>
            );
          })}
        </defs>

        <circle
          cx="110" cy="110" r={RADIUS}
          fill="transparent"
          stroke="hsl(var(--muted) / 0.1)"
          strokeWidth={STROKE_WIDTH}
        />

        {checkins.slice(0, MAX_CHECKINS).map((checkin, index) => {
          const startAngleDeg = -90 + index * segmentAngle;
          const gradientId = `mood-gradient-${index}`;

          return (
            <path
              key={index}
              d={describeArc(110, 110, RADIUS, startAngleDeg, startAngleDeg + arcAngle)}
              fill="transparent"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          );
        })}

        {Array.from({ length: Math.max(0, MAX_CHECKINS - checkinCount) }).map((_, i) => {
          const emptyIndex = checkinCount + i;
          const startAngleDeg = -90 + emptyIndex * segmentAngle;

          return (
            <path
              key={`empty-${i}`}
              d={describeArc(110, 110, RADIUS, startAngleDeg, startAngleDeg + arcAngle)}
              fill="transparent"
              stroke="hsl(var(--muted) / 0.06)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="relative w-64 h-64 mx-auto flex flex-col items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        {checkinCount === 0 ? renderInitialState() : renderActiveState()}
      </div>

      <Link 
        href="/home" 
        onClick={(e) => { e.preventDefault(); onCheckinClick(); }}
        className="z-10 flex flex-col items-center justify-center group"
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 active:scale-95">
          <Plus className="h-8 w-8 text-black" />
        </div>
        <span className="mt-4 text-lg font-bold text-foreground">
            {checkinCount === 0 ? 'Como você está?' : 'Check-in'}
        </span>
      </Link>
    </div>
  );
}
