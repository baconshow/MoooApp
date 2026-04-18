
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { format, sub } from 'date-fns';

const GetUserLogsInputSchema = z.object({
  uid: z.string().describe("The user's unique ID. This is required."),
  timeRange: z.enum(['last_7_days', 'last_30_days', 'this_month', 'all'])
    .optional()
    .describe("The time range for which to fetch logs. Defaults to 'last_30_days'."),
  logType: z.enum(['pain', 'sleep', 'expenses', 'food', 'mood', 'all'])
    .optional()
    .describe("The specific type of log to retrieve. Defaults to 'all'."),
});

/**
 * Tool to fetch user logs from Firestore using the Admin SDK.
 */
export const getUserLogs = ai.defineTool(
  {
    name: 'getUserLogs',
    description: "Fetches a user's daily logs (pain, sleep, expenses, food, mood) from the database for a specified time range.",
    inputSchema: GetUserLogsInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    if (!adminDb) {
      throw new Error("Firestore Admin DB is not initialized.");
    }
    if (!input.uid) {
      throw new Error("User ID (uid) is required to fetch logs.");
    }

    const logsCollectionRef = adminDb.collection(`users/${input.uid}/logs`);

    const now = new Date();
    let startDate: Date;

    switch (input.timeRange) {
      case 'last_7_days':
        startDate = sub(now, { days: 7 });
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = sub(now, { years: 1 });
        break;
      case 'last_30_days':
      default:
        startDate = sub(now, { days: 30 });
        break;
    }
    
    const startDateKey = format(startDate, 'yyyy-MM-dd');

    try {
      // Using Admin SDK syntax: collection.where().orderBy().get()
      const querySnapshot = await logsCollectionRef
        .where('__name__', '>=', startDateKey)
        .orderBy('__name__', 'desc')
        .get();

      const logs: Record<string, any> = {};
      
      querySnapshot.forEach(doc => {
        const logData = doc.data();
        
        if (input.logType && input.logType !== 'all') {
          const keyMap = {
              'pain': 'painLog',
              'sleep': 'sleepLog',
              'expenses': 'expenses',
              'food': 'foodLogs',
              'mood': 'mood'
          };
          const logKey = keyMap[input.logType as keyof typeof keyMap];
          if (logKey && logData[logKey]) {
              logs[doc.id] = { [logKey]: logData[logKey] };
          }
        } else {
          logs[doc.id] = logData;
        }
      });
      
      return logs;

    } catch (error) {
      console.error("[Tool:getUserLogs] Error fetching user logs:", error);
      return { error: "Failed to fetch user logs from the database." };
    }
  }
);
