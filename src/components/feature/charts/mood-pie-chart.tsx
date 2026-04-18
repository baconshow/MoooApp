
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Smile } from 'lucide-react';

interface MoodData {
    mood: string;
    value: number;
    fill: string;
}

interface MoodPieChartProps {
    data: MoodData[];
    totalEntries: number;
}

const chartConfig = {
    value: {
      label: "Entradas",
    },
    Alegre: {
      label: "Alegre",
      color: "hsl(var(--chart-2))",
    },
    Calmo: {
      label: "Calmo",
      color: "hsl(var(--chart-3))",
    },
    Ansioso: {
      label: "Ansioso",
      color: "hsl(var(--chart-4))",
    },
     Triste: {
      label: "Triste",
      color: "hsl(var(--chart-5))",
    },
};

export default function MoodPieChart({ data, totalEntries }: MoodPieChartProps) {
    return (
        <Card className="claymorphism bg-card/80 backdrop-blur-sm flex flex-col">
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-yellow-400"/>
                    <CardTitle>Registros Emocionais</CardTitle>
                </div>
                <CardDescription>{totalEntries} entradas no total</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[250px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="mood" hideLabel />} />
                        <Pie data={data} dataKey="value" nameKey="mood" innerRadius={50} outerRadius={80} strokeWidth={2}>
                             {data.map((entry) => (
                                <Cell key={entry.mood} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="mood" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
    