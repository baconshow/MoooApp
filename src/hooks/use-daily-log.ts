
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';

// --- DATA TYPES ---

export interface Point {
  x: number;
  y: number;
}

export interface PainLog {
    pain?: number; // 0-4
    symptoms?: string[];
    bodyMapPoints?: Point[];
    notes?: string;
}

export interface SleepLog {
    id: string;
    date: string; // YYYY-MM-DD
    bedtime: string; // HH:mm
    wakeTime: string; // HH:mm
    totalMinutes: number;
    quality: number; // 1-5 stars
}

export interface Expense {
    id: string;
    amount: number;
    category: 'Comida' | 'Uber' | 'Diversos' | 'Contas' | 'Comprinhas' | 'Lazer';
    date: string; // ISO string
}

export interface Reminder {
    id: string;
    date: Date;
    time: string;
    text: string;
    completed: boolean;
}

export interface FoodLog {
    id: string;
    imageUrl: string; 
    timestamp: string; // ISO string
    dishName?: string;
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    healthScore?: number;
    analysisText?: string;
    vitalityClass?: 'biogenic' | 'bioactive' | 'biostatic' | 'biocidic';
}

export interface CycleLog {
    flow: 'none' | 'light' | 'medium' | 'heavy';
    symptoms: string[];
    mood: string;
    notes?: string;
}

export interface DailyLog {
    painLog?: PainLog;
    sleepLog?: SleepLog;
    expenses?: Expense[];
    foodLogs?: FoodLog[];
    bowelMovement?: boolean;
    reminders?: Reminder[];
    mood?: string;
    junkFood?: boolean;
    meditationCompleted?: boolean;
    checkins?: Array<{
        emotionId: string;
        emotionLabel: string;
        quadrant: string;
        color: string;
        activities: string[];
        people: string[];
        timestamp: string;
    }>;
    waterCups?: number;
    cycleLog?: CycleLog;
}

type LogState = Record<string, DailyLog>;

export const useDailyLog = () => {
    const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
    const [logs, setLogs] = useState<LogState>({});
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- MIGRATION LOGIC (localStorage -> Firestore) ---
    useEffect(() => {
        if (!isClient || !user || !isFirebaseEnabled) return;

        const migrateData = async () => {
            const localData = localStorage.getItem('moooDailyLogs');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    const migrationPromises = Object.entries(parsed).map(async ([dateKey, logData]) => {
                        const logDocRef = doc(db, 'users', user.uid, 'logs', dateKey);
                        const docSnap = await getDoc(logDocRef);
                        
                        // Only migrate if Firestore doesn't have data for this day yet
                        if (!docSnap.exists()) {
                            await setDoc(logDocRef, logData as any, { merge: true });
                        }
                    });

                    await Promise.all(migrationPromises);
                    localStorage.setItem('moooDailyLogs_migrated_v2', localData); // Backup
                    localStorage.removeItem('moooDailyLogs'); // Clean up
                    // Migration complete: localStorage -> Firestore
                } catch (e) {
                    console.error('Migration error:', e);
                }
            }
        };

        migrateData();
    }, [user, isClient, isFirebaseEnabled]);

    const updateLog = useCallback(async (dateKey: string, data: Partial<DailyLog>) => {
        const currentLogForDate = logs[dateKey] || {};
        
        const updatedLog: DailyLog = {
            ...currentLogForDate,
            ...data,
            painLog: {
                ...currentLogForDate.painLog,
                ...data.painLog,
            },
            expenses: data.expenses !== undefined ? data.expenses : currentLogForDate.expenses,
            foodLogs: data.foodLogs !== undefined ? data.foodLogs : currentLogForDate.foodLogs,
            checkins: data.checkins !== undefined ? data.checkins : currentLogForDate.checkins,
            cycleLog: data.cycleLog !== undefined ? data.cycleLog : currentLogForDate.cycleLog,
        };

         Object.keys(updatedLog).forEach(key => {
            const typedKey = key as keyof DailyLog;
            if (updatedLog[typedKey] === undefined) {
                delete updatedLog[typedKey];
            }
        });
        
        setLogs(prevLogs => ({
            ...prevLogs,
            [dateKey]: updatedLog
        }));

        if (!isFirebaseEnabled) {
             if (typeof window !== 'undefined') {
                localStorage.setItem('moooDailyLogs', JSON.stringify({ ...logs, [dateKey]: updatedLog }));
            }
            return;
        }

        if (!user) return;

        try {
            const logDocRef = doc(db, 'users', user.uid, 'logs', dateKey);
            await setDoc(logDocRef, updatedLog, { merge: true });
        } catch (error) {
            console.error("Error updating log in Firestore:", error);
        }

    }, [logs, user, isFirebaseEnabled]);

    useEffect(() => {
        if (!isClient) return;

        if (!isFirebaseEnabled) {
            const savedState = localStorage.getItem('moooDailyLogs');
            if (savedState) {
                try {
                    setLogs(JSON.parse(savedState));
                } catch (e) {
                    console.error("Failed to parse logs from localStorage", e);
                }
            }
            setLoading(false);
            return;
        }

        if (authLoading) return;

        if (!user) {
            setLogs({});
            setLoading(false);
            return;
        }

        setLoading(true);
        const logsCollectionRef = collection(db, 'users', user.uid, 'logs');
        
        const unsubscribe = onSnapshot(logsCollectionRef, (snapshot) => {
            const newLogs: LogState = {};
            snapshot.forEach((doc) => {
                newLogs[doc.id] = doc.data() as DailyLog;
            });
            setLogs(newLogs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching logs from Firestore:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, isFirebaseEnabled, isClient]);
    
    const getLogForDate = useCallback((date: Date): DailyLog | null => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return logs[dateKey] || null;
    }, [logs]);

    return { logs, updateLog, getLogForDate, loading };
};
