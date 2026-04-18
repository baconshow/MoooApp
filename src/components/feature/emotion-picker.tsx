"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Check, User, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { emotionQuadrants, contextTags, EmotionQuadrant, Emotion } from '@/lib/emotion-data';
import { cn } from '@/lib/utils';

export interface CheckinResult {
  emotionId: string;
  emotionLabel: string;
  quadrant: string;
  color: string;
  activities: string[];
  people: string[];
  timestamp: string;
}

interface EmotionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: CheckinResult) => void;
}

type Step = 'quadrant' | 'emotion' | 'context';

export default function EmotionPicker({ isOpen, onClose, onSave }: EmotionPickerProps) {
  const [step, setStep] = useState<Step>('quadrant');
  const [selectedQuadrant, setSelectedQuadrant] = useState<EmotionQuadrant | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('quadrant');
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setSelectedActivities([]);
    setSelectedPeople([]);
  };

  const handleSave = () => {
    if (selectedEmotion && selectedQuadrant) {
      onSave({
        emotionId: selectedEmotion.id,
        emotionLabel: selectedEmotion.label,
        quadrant: selectedQuadrant.id,
        color: selectedEmotion.color,
        activities: selectedActivities,
        people: selectedPeople,
        timestamp: new Date().toISOString(),
      });
      handleReset();
      onClose();
    }
  };

  const toggleItem = (id: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(i => i !== id));
    } else {
      setList([...list, id]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b bg-card/50 backdrop-blur-md">
          {step !== 'quadrant' ? (
            <Button variant="ghost" size="icon" onClick={() => setStep(step === 'context' ? 'emotion' : 'quadrant')}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          <h2 className="text-lg font-bold">
            {step === 'quadrant' && 'Como você está?'}
            {step === 'emotion' && selectedQuadrant?.label}
            {step === 'context' && 'O que está rolando?'}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => { handleReset(); onClose(); }}>
            <X className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Quadrants */}
            {step === 'quadrant' && (
              <motion.div
                key="quadrants"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="grid grid-cols-2 gap-4 h-full max-h-[600px]"
              >
                {emotionQuadrants.map((q) => (
                  <Card
                    key={q.id}
                    className="cursor-pointer transition-transform active:scale-95 border-none claymorphism"
                    style={{ backgroundColor: q.color.replace(')', ', 0.15)') }}
                    onClick={() => { setSelectedQuadrant(q); setStep('emotion'); }}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="w-4 h-4 rounded-full mb-4 shadow-[0_0_10px] shadow-current" style={{ backgroundColor: q.color, color: q.color }} />
                      <h3 className="font-bold text-lg leading-tight">{q.label}</h3>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* STEP 2: Specific Emotions */}
            {step === 'emotion' && selectedQuadrant && (
              <motion.div
                key="emotions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                {selectedQuadrant.emotions.map((e) => (
                  <Button
                    key={e.id}
                    variant="outline"
                    className={cn(
                      "h-24 text-lg font-bold claymorphism border-2 transition-all flex flex-col items-center justify-center gap-1",
                      selectedEmotion?.id === e.id ? "ring-2 ring-primary bg-card" : "bg-card/40"
                    )}
                    style={{ borderColor: selectedEmotion?.id === e.id ? e.color : 'transparent' }}
                    onClick={() => { setSelectedEmotion(e); setStep('context'); }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                    {e.label}
                    <span className="text-[10px] font-normal text-muted-foreground">{e.description}</span>
                  </Button>
                ))}
              </motion.div>
            )}

            {/* STEP 3: Context */}
            {step === 'context' && (
              <motion.div
                key="context"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Atividade
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {contextTags.atividades.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleItem(a, selectedActivities, setSelectedActivities)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-xs font-bold",
                          selectedActivities.includes(a) ? "bg-primary/10 border-primary" : "bg-card border-transparent"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Com quem?
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {contextTags.pessoas.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleItem(p, selectedPeople, setSelectedPeople)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-xs font-bold",
                          selectedPeople.includes(p) ? "bg-primary/10 border-primary" : "bg-card border-transparent"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Action */}
        {step === 'context' && (
          <footer className="p-4 border-t bg-card/50">
            <Button className="w-full h-14 text-lg font-bold rounded-2xl animated-gradient-border-send" onClick={handleSave}>
              Salvar Check-in
            </Button>
          </footer>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
