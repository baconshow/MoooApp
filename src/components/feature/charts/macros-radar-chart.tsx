"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type VitalityClass = "biogenic" | "bioactive" | "biostatic" | "biocidic";

interface MacrosRadarChartProps {
  data: {
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  vitalityClass?: VitalityClass;
  calories?: number;
  showCornerBadges?: boolean;
  compact?: boolean;
}

const VITALITY_CONFIG: Record<VitalityClass, { label: string; emoji: string; color: string; bgClass: string; textClass: string; ringClass: string }> = {
  biogenic:  { label: "Biogênico",  emoji: "🌱", color: "hsl(145, 70%, 50%)", bgClass: "bg-emerald-500/15", textClass: "text-emerald-400", ringClass: "ring-emerald-400/50" },
  bioactive: { label: "Bioativo",   emoji: "🥬", color: "hsl(85, 70%, 50%)",  bgClass: "bg-lime-500/15",    textClass: "text-lime-400",    ringClass: "ring-lime-400/50" },
  biostatic: { label: "Bioestático", emoji: "🍳", color: "hsl(38, 90%, 55%)", bgClass: "bg-amber-500/15",   textClass: "text-amber-400",   ringClass: "ring-amber-400/50" },
  biocidic:  { label: "Biocídico",  emoji: "☠️", color: "hsl(0, 80%, 60%)",   bgClass: "bg-red-500/15",     textClass: "text-red-400",     ringClass: "ring-red-400/50" },
};

const getVitalityAura = (vClass: VitalityClass) => {
  switch (vClass) {
    case "biogenic":  return { protein: 30, carbs: 20, fat: 15, fiber: 35, sugar: 5 };
    case "bioactive": return { protein: 25, carbs: 25, fat: 15, fiber: 28, sugar: 8 };
    case "biostatic": return { protein: 20, carbs: 30, fat: 20, fiber: 12, sugar: 18 };
    case "biocidic":  return { protein: 10, carbs: 35, fat: 30, fiber: 5, sugar: 35 };
  }
};

const chartConfig = {
  value: { label: "Gramas" },
  vitality: { label: "Vitalidade", color: "hsl(180, 70%, 50%)" },
  ideal: { label: "Referência", color: "hsl(var(--chart-2))" },
  user: { label: "Sua Refeição", color: "hsl(var(--chart-1))" },
};

export default function MacrosRadarChart({ data, vitalityClass, calories, showCornerBadges = false, compact = false }: MacrosRadarChartProps) {
  const aura = vitalityClass ? getVitalityAura(vitalityClass) : null;
  const vConfig = vitalityClass ? VITALITY_CONFIG[vitalityClass] : null;

  const chartData = [
    { macro: "Proteína",  user: data.protein ?? 0,       ideal: 25, ...(aura && { vitality: aura.protein }) },
    { macro: "Carbs",     user: data.carbohydrates ?? 0,  ideal: 30, ...(aura && { vitality: aura.carbs }) },
    { macro: "Gordura",   user: data.fat ?? 0,            ideal: 15, ...(aura && { vitality: aura.fat }) },
    { macro: "Fibra",     user: data.fiber ?? 0,          ideal: 8,  ...(aura && { vitality: aura.fiber }) },
    { macro: "Açúcar",    user: data.sugar ?? 0,          ideal: 10, ...(aura && { vitality: aura.sugar }) },
  ];

  const chartHeight = compact ? "h-48" : "h-72";

  return (
    <div className="relative">
      {calories !== undefined && !compact && (
        <div className="text-center mb-1">
          <span className="text-3xl font-bold text-primary">{calories}</span>
          <span className="text-sm text-muted-foreground ml-1">kcal</span>
        </div>
      )}

      {vConfig && !compact && (
        <div className="flex justify-center mb-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ring-1",
            vConfig.bgClass, vConfig.textClass, vConfig.ringClass
          )}>
            {vConfig.emoji} {vConfig.label}
          </span>
        </div>
      )}

      <ChartContainer config={chartConfig} className={cn("mx-auto aspect-square", chartHeight)}>
        <ResponsiveContainer>
          <RadarChart data={chartData} outerRadius={compact ? 60 : 80}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarGrid stroke="hsla(0, 0%, 100%, 0.12)" />
            <PolarAngleAxis dataKey="macro" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: compact ? 10 : 12 }} />

            {aura && (
              <Radar name="Vitalidade" dataKey="vitality"
                stroke={vConfig?.color || "hsl(180, 70%, 50%)"}
                fill={vConfig?.color || "hsl(180, 70%, 50%)"}
                fillOpacity={0.15} strokeOpacity={0.4} strokeWidth={1}
              />
            )}

            <Radar name="Referência" dataKey="ideal"
              stroke="var(--color-ideal)" fill="var(--color-ideal)"
              fillOpacity={0.2} strokeDasharray="4 4" strokeWidth={1.5}
            />

            <Radar name="Sua Refeição" dataKey="user"
              stroke="var(--color-user)" fill="var(--color-user)"
              fillOpacity={0.5} strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {showCornerBadges && (
        <>
          {(Object.entries(VITALITY_CONFIG) as [VitalityClass, typeof VITALITY_CONFIG[VitalityClass]][]).map(([key, config], i) => {
            const isActive = vitalityClass === key;
            const positions = ["top-0 left-0", "top-0 right-0", "bottom-8 left-0", "bottom-8 right-0"];
            return (
              <span key={key} className={cn(
                "absolute text-[10px] px-2 py-0.5 rounded-full font-medium transition-all",
                positions[i], config.bgClass, config.textClass,
                isActive && cn("ring-1 brightness-125", config.ringClass),
                !isActive && "opacity-40"
              )}>
                {config.emoji} {config.label}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}

export { VITALITY_CONFIG };