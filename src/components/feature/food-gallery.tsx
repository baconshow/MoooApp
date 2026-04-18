
"use client";

import { useMemo, useState } from 'react';
import { FoodLog } from '@/hooks/use-daily-log';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { ChevronDown, ImageIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";


interface FoodGalleryProps {
    foodLogs: FoodLog[];
    onImageClick: (log: FoodLog) => void;
}

interface GroupedLogs {
    [year: string]: {
        [month: string]: FoodLog[];
    };
}

export default function FoodGallery({ foodLogs, onImageClick }: FoodGalleryProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const groupedLogs = useMemo(() => {
        return foodLogs.reduce((acc, log) => {
            const date = parseISO(log.timestamp);
            const year = format(date, 'yyyy');
            const month = format(date, 'MMMM', { locale: ptBR });
            
            if (!acc[year]) acc[year] = {};
            if (!acc[year][month]) acc[year][month] = [];
            
            acc[year][month].push(log);
            return acc;
        }, {} as GroupedLogs);
    }, [foodLogs]);
    
    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (foodLogs.length === 0) {
        return (
            <div className="text-center py-10">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground"/>
                <p className="mt-4 text-muted-foreground">Nenhuma refeição registrada ainda.</p>
                <p className="text-xs text-muted-foreground/80">Envie uma foto de um prato para começar sua galeria!</p>
            </div>
        );
    }
    
    const sortedYears = Object.keys(groupedLogs).sort((a, b) => Number(b) - Number(a));

    return (
        <div className="space-y-6">
            {sortedYears.map(year => (
                <Collapsible 
                    key={year}
                    open={openSections[year] ?? true}
                    onOpenChange={() => toggleSection(year)}
                >
                    <CollapsibleTrigger className="w-full">
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted transition-colors">
                            <h2 className="text-xl font-bold">{year}</h2>
                            <ChevronDown className={cn("h-5 w-5 transition-transform", (openSections[year] ?? true) && "rotate-180")} />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="space-y-4 pl-4 pt-2"
                        >
                             {Object.keys(groupedLogs[year]).map(month => (
                                 <Collapsible 
                                     key={`${year}-${month}`}
                                     open={openSections[`${year}-${month}`] ?? true}
                                     onOpenChange={() => toggleSection(`${year}-${month}`)}
                                     className="border-l border-border/50 pl-4"
                                >
                                    <CollapsibleTrigger className="w-full -ml-4">
                                         <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted transition-colors w-full">
                                            <h3 className="text-lg font-semibold capitalize">{month}</h3>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", (openSections[`${year}-${month}`] ?? true) && "rotate-180")} />
                                        </div>
                                    </CollapsibleTrigger>
                                     <CollapsibleContent asChild>
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 pt-2">
                                                {groupedLogs[year][month].map(log => (
                                                    <motion.button
                                                        key={log.id}
                                                        onClick={() => onImageClick(log)}
                                                        className="aspect-square rounded-lg overflow-hidden claymorphism focus:ring-2 ring-primary group relative"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        layout
                                                    >
                                                        <Image
                                                            src={log.imageUrl}
                                                            alt={log.dishName || 'Refeição'}
                                                            width={200}
                                                            height={200}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </CollapsibleContent>
                                </Collapsible>
                             ))}
                        </motion.div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );
}

