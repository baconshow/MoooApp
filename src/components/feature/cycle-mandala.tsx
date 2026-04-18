"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sprout, Sparkles, Moon, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PhaseId = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

interface PhaseInfo {
  id: PhaseId;
  label: string;
  icon: LucideIcon;
  color: string;
  colorClass: string;
}

const PHASES: Record<PhaseId, PhaseInfo> = {
  menstruation: { id: 'menstruation', label: 'Menstruação', icon: Droplets, color: '#f87171', colorClass: 'text-red-400' },
  follicular: { id: 'follicular', label: 'Folicular', icon: Sprout, color: '#4ade80', colorClass: 'text-green-400' },
  ovulation: { id: 'ovulation', label: 'Ovulação', icon: Sparkles, color: '#fbbf24', colorClass: 'text-amber-400' },
  luteal: { id: 'luteal', label: 'Lútea', icon: Moon, color: '#c084fc', colorClass: 'text-purple-400' },
};

const CONFIG = {
  viewBox: "0 0 220 220",
  center: 110,
  radius: 90,
  strokeWidth: 20,
  trackColor: "hsl(var(--muted) / 0.1)",
  gapDegrees: 4,
};

interface CycleMandalaProps {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  phase: PhaseId;
}

export default function CycleMandala({ cycleDay, cycleLength, periodLength, phase }: CycleMandalaProps) {
  const circumference = 2 * Math.PI * CONFIG.radius;
  
  const phaseArcs = useMemo(() => {
    if (cycleLength === 0) return [];
    const ovulationDay = cycleLength - 14;
    return [
      { id: 'menstruation' as PhaseId, startDay: 1, endDay: periodLength },
      { id: 'follicular' as PhaseId, startDay: periodLength + 1, endDay: ovulationDay - 1 },
      { id: 'ovulation' as PhaseId, startDay: ovulationDay, endDay: ovulationDay + 2 },
      { id: 'luteal' as PhaseId, startDay: ovulationDay + 3, endDay: cycleLength },
    ];
  }, [cycleLength, periodLength]);

  const dayToAngle = (day: number) => -90 + ((day - 1) / (cycleLength || 28)) * 360;

  const currentPhaseInfo = PHASES[phase] || PHASES.follicular;
  const PhaseIcon = currentPhaseInfo.icon;

  if (cycleLength === 0) {
    return (
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
        <svg viewBox={CONFIG.viewBox} className="w-full h-full animate-spin-slow opacity-20">
          <circle
            cx={CONFIG.center}
            cy={CONFIG.center}
            r={CONFIG.radius}
            fill="transparent"
            stroke="white"
            strokeWidth={CONFIG.strokeWidth}
            strokeDasharray={`${circumference * 0.25} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <Droplets className="h-10 w-10 text-muted-foreground mb-2" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-bold">Configurar ciclo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox={CONFIG.viewBox} className="w-full h-full">
        <defs>
          <filter id="cycleDotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={CONFIG.center}
          cy={CONFIG.center}
          r={CONFIG.radius}
          fill="transparent"
          stroke={CONFIG.trackColor}
          strokeWidth={CONFIG.strokeWidth}
        />

        {/* Arcs */}
        {phaseArcs.map((arc) => {
          const info = PHASES[arc.id];
          const startAngle = dayToAngle(arc.startDay);
          const endAngle = dayToAngle(arc.endDay + 1);
          const arcDegrees = endAngle - startAngle;
          const arcLength = (arcDegrees / 360) * circumference;
          const gapPixels = (CONFIG.gapDegrees / 360) * circumference;

          return (
            <motion.circle
              key={arc.id}
              cx={CONFIG.center}
              cy={CONFIG.center}
              r={CONFIG.radius}
              fill="transparent"
              stroke={info.color}
              strokeWidth={CONFIG.strokeWidth}
              strokeDasharray={`${Math.max(0, arcLength - gapPixels)} ${circumference}`}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              transform={`rotate(${startAngle + CONFIG.gapDegrees / 2} ${CONFIG.center} ${CONFIG.center})`}
            />
          );
        })}

        {/* Dot Indicator */}
        {(() => {
          const angle = dayToAngle(cycleDay);
          const rad = (angle * Math.PI) / 180;
          const dotX = CONFIG.center + CONFIG.radius * Math.cos(rad);
          const dotY = CONFIG.center + CONFIG.radius * Math.sin(rad);

          return (
            <motion.circle
              cx={dotX}
              cy={dotY}
              r={5}
              fill="white"
              filter="url(#cycleDotGlow)"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            />
          );
        })()}
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold text-foreground tracking-tighter">{cycleDay}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest font-bold opacity-60">dia do ciclo</span>
        <div className="flex items-center gap-1.5 mt-3">
          <PhaseIcon className={cn("h-4 w-4", currentPhaseInfo.colorClass)} />
          <span className={cn("text-xs font-bold uppercase tracking-widest", currentPhaseInfo.colorClass)}>
            {currentPhaseInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
}
