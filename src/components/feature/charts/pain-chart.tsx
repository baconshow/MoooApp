
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyLog } from '@/hooks/use-daily-log';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { HeartPulse } from 'lucide-react';

interface PainChartProps {
    logs: Record<string, DailyLog>;
}

const chartConfig = {
    pain: {
        label: "Nível de Dor",
        color: "hsl(var(--chart-1))",
    },
};

export default function PainChart({ logs }: PainChartProps) {
    const today = new Date();
    
    const chartData = useMemo(() => {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const log = logs[dateKey];
            return {
                date: format(day, 'dd'),
                pain: log?.painLog?.pain ?? 0,
            };
        });
    }, [logs, today]);
    
    const painDays = useMemo(() => {
        return Object.values(logs).filter(l => (l.painLog?.pain ?? 0) > 0).length;
    }, [logs]);

    return (
        <Card className="claymorphism bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-red-400"/>
                    <CardTitle>Dias com Dor</CardTitle>
                </div>
                <CardDescription>{painDays} dias com dor registrados este mês.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                        />
                         <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            domain={[0, 4]}
                            ticks={[0, 1, 2, 3, 4]}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel />}
                        />
                        <Line
                            dataKey="pain"
                            type="monotone"
                            stroke="var(--color-pain)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-pain)", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

    