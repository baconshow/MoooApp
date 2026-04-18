
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: (data: any, update: (val: any) => void) => React.ReactNode;
}

interface HubOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  hubName: string;
  steps: OnboardingStep[];
  onComplete: (data: any) => void;
}

export default function HubOnboarding({ isOpen, onClose, hubName, steps, onComplete }: HubOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data);
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateData = (stepId: string, value: any) => {
    setData(prev => ({ ...prev, [stepId]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="claymorphism bg-background/40 backdrop-blur-2xl border-none shadow-2xl rounded-[2.5rem] max-w-[90vw] sm:max-w-[450px] p-0 overflow-hidden">
        {/* Header Acessível (Invisível mas presente para leitores de tela) */}
        <DialogHeader className="sr-only">
          <DialogTitle>Configuração do Hub {hubName}</DialogTitle>
          <DialogDescription>Responda algumas perguntas para personalizar sua experiência no MoooApp.</DialogDescription>
        </DialogHeader>

        <div className="absolute top-6 right-6 z-50">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/5 hover:bg-white/10">
                <X className="h-4 w-4" />
            </Button>
        </div>

        <div className="p-8 pt-10">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Passo {currentStep + 1} de {steps.length}</span>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <Progress value={progress} className="h-1.5 bg-white/5" indicatorClassName="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{steps[currentStep].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{steps[currentStep].description}</p>
              </div>

              <div className="py-4 min-h-[200px]">
                {steps[currentStep].component(data[steps[currentStep].id], (val) => updateData(steps[currentStep].id, val))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="h-12 rounded-xl flex-1 border-white/5 bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            )}
            <Button onClick={handleNext} className="h-12 rounded-xl flex-[2] bg-primary font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              {isLastStep ? 'Começar a acompanhar' : 'Próximo'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
