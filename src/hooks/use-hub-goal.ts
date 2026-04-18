
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { differenceInDays, parseISO } from 'date-fns';

export interface HubGoal {
  hubName: 'rango' | 'vibe' | 'grana' | 'ciclo' | 'sono' | 'dor';
  objective: string;
  objectiveLabel: string;
  details?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  revisedCount: number;
}

export const useHubGoal = (hubName: HubGoal['hubName']) => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<HubGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const goalRef = doc(db, 'users', user.uid, 'goals', hubName);
    
    const unsubscribe = onSnapshot(goalRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as HubGoal;
        setGoal(data);
        
        // Regra: Revisar a cada 30 dias
        const daysSinceUpdate = differenceInDays(new Date(), parseISO(data.updatedAt));
        if (daysSinceUpdate >= 30) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } else {
        setGoal(null);
        setNeedsOnboarding(true);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching goal for ${hubName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, hubName]);

  const saveGoal = useCallback(async (objective: string, label: string, details?: Record<string, any>) => {
    if (!user || !db) return;

    const goalRef = doc(db, 'users', user.uid, 'goals', hubName);
    const now = new Date().toISOString();
    
    const newGoal: HubGoal = {
      hubName,
      objective,
      objectiveLabel: label,
      details: details || {},
      createdAt: goal?.createdAt || now,
      updatedAt: now,
      revisedCount: (goal?.revisedCount || 0) + 1,
    };

    try {
      await setDoc(goalRef, newGoal);
      // Salvar histórico
      const historyRef = doc(db, 'users', user.uid, 'goals', hubName, 'history', now);
      await setDoc(historyRef, newGoal);
    } catch (e) {
      console.error("Failed to save hub goal:", e);
    }
  }, [user, hubName, goal]);

  return { goal, loading, needsOnboarding, saveGoal, setNeedsOnboarding };
};
