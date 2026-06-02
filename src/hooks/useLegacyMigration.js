import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { sessionService } from '../services/firebase/session.service';
import { progressService } from '../services/firebase/progress.service';

const MIGRATION_FLAG_KEY = 'cognify:migrated_to_firebase';

export function useLegacyMigration() {
  const { state } = useApp();
  const uid = state.user?.uid;

  const [migrating, setMigrating] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    async function checkAndMigrate() {
      // Skip if user is not authenticated yet or mock mode is active
      if (!uid || state.user?.uid.startsWith("mock-")) return;

      try {
        const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
        if (alreadyMigrated === 'true') {
          setComplete(true);
          return;
        }

        // 1. Detect if legacy score data exists
        const rawScores = await AsyncStorage.getItem('cognify:scores');
        if (!rawScores) {
          // No legacy data to migrate, mark completed
          await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          setComplete(true);
          return;
        }

        const scoresData = JSON.parse(rawScores);
        const history = scoresData.scoreHistory || [];

        if (history.length === 0) {
          await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          setComplete(true);
          return;
        }

        console.log(`📦 [LegacyMigration] Found ${history.length} historical workout sessions to migrate...`);
        setMigrating(true);

        // 2. Process and migrate sessions sequentially
        let highestScore = 0;
        let migratedCount = 0;
        for (const record of history) {
          if (record.isDummy) {
            continue; // Skip migrating dummy onboarding score records!
          }

          const scoreVal = record.score || 600;
          if (scoreVal > highestScore) highestScore = scoreVal;

          const sessionPayload = {
            game: 'lighthouse_watch', // Fallback game key for historical records
            level: 1,
            durationActiveMs: 180000,
            abandoned: false,
            score: scoreVal,
            migrated: true,
            notes: `Migrated from local storage checkin: sleep: ${record.sleep || 'N/A'}, mood: ${record.mood || 'N/A'}`
          };

          // Save session using batch operations
          await sessionService.saveSession(uid, sessionPayload, []);
          migratedCount++;
        }

        console.log(`📦 [LegacyMigration] Successfully migrated ${migratedCount} real user workouts to Firestore.`);

        // 3. Update Progress baseline with legacy scores (only if real workouts were migrated)
        if (migratedCount > 0) {
          const prevProgress = await progressService.getProgress(uid);
          const prevData = prevProgress.data || {};
          
          await progressService.updateProgress(uid, {
            ...prevData,
            cognitiveScore: scoresData.cognitiveScore || 680,
            personalBests: {
              ...prevData.personalBests,
              lighthouse_watch: Math.max(prevData.personalBests?.lighthouse_watch || 0, highestScore)
            }
          });
        }

        // 4. Mark migration as successfully finished
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        console.log("⚡️ [LegacyMigration] AsyncStorage session history successfully migrated to Firestore!");
        setMigrating(false);
        setComplete(true);
      } catch (err) {
        console.warn("⚠️ [LegacyMigration] Background migration failed. Retrying next startup.", err);
        setMigrating(false);
      }
    }

    checkAndMigrate();
  }, [uid]);

  return { migrating, complete };
}
