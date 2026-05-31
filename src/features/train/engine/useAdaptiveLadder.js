// src/features/train/engine/useAdaptiveLadder.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADAPTIVE_LADDER } from '../../../constants/gameConfig';

export function useAdaptiveLadder(gameId) {
  const [currentLevel, setCurrentLevel] = useState(ADAPTIVE_LADDER.min);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLevel() {
      try {
        const storedLevelStr = await AsyncStorage.getItem(`cognify:gameLevel:${gameId}`);
        const lastPlayedDate = await AsyncStorage.getItem(`cognify:lastPlayedDate:${gameId}`);
        
        let level = ADAPTIVE_LADDER.min;
        if (storedLevelStr) {
          level = parseInt(storedLevelStr, 10);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Apply daily warm-up cap at the beginning of a new calendar day
        if (lastPlayedDate !== todayStr) {
          level = Math.min(ADAPTIVE_LADDER.dailyWarmUpCap, level);
        }

        setCurrentLevel(level);
      } catch (err) {
        console.error('[useAdaptiveLadder] Error loading level:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (gameId) {
      loadLevel();
    }
  }, [gameId]);

  const recordCorrect = () => {
    setConsecutiveMisses(0);
    setConsecutiveCorrect((prevCorrect) => {
      const nextCorrect = prevCorrect + 1;
      if (nextCorrect >= ADAPTIVE_LADDER.correctToAdvance) {
        setCurrentLevel((prevLevel) => Math.min(ADAPTIVE_LADDER.max, prevLevel + 1));
        return 0; // reset counter
      }
      return nextCorrect;
    });
  };

  const recordMiss = () => {
    setConsecutiveCorrect(0);
    setConsecutiveMisses((prevMisses) => {
      const nextMisses = prevMisses + 1;
      if (nextMisses >= ADAPTIVE_LADDER.missesToRetreat) {
        setCurrentLevel((prevLevel) => Math.max(ADAPTIVE_LADDER.min, prevLevel - 1));
        return 0; // reset counter
      }
      return nextMisses;
    });
  };

  const saveLevel = async (finalLevel = currentLevel) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`cognify:gameLevel:${gameId}`, String(finalLevel));
      await AsyncStorage.setItem(`cognify:lastPlayedDate:${gameId}`, todayStr);
    } catch (err) {
      console.error('[useAdaptiveLadder] Error saving level:', err);
    }
  };

  return {
    currentLevel,
    consecutiveCorrect,
    consecutiveMisses,
    isLoading,
    recordCorrect,
    recordMiss,
    saveLevel,
  };
}
