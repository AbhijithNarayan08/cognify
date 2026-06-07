const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Real Firebase Project Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCjtVgkzv1_P2ctnUcaiBCuo0wX3cJ_Veg",
  authDomain: "cognifyapp-9d381.firebaseapp.com",
  projectId: "cognifyapp-9d381",
  storageBucket: "cognifyapp-9d381.firebasestorage.app",
  messagingSenderId: "1007104068828",
  appId: "1:1007104068828:web:e50709239cbef123c1b819",
  measurementId: "G-EZSVYJXQYQ"
};

const uid = "A7FOF5oXjaMGFK4bzBE1VPcvPH62";

async function populateData() {
  console.log(`🚀 [Populator] Initializing Firebase for Project: ${firebaseConfig.projectId}...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // 1. Populate User Profile Details
  console.log("👤 [Populator] Writing User Profile...");
  const userProfile = {
    uid: uid,
    email: "champ.cognify@example.com",
    displayName: "Cognify Champion",
    authProvider: "email",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    appVersion: "1.0.0",
    onboardingCompleted: true,
    intent: "sharpen",
    profile: {
      firstName: "Champion",
      ageRange: "26-35",
      avgSleepBucket: "7-8 hours",
      activityLevel: "most days"
    },
    notificationsEnabled: true,
    reminderTime: "08:00",
    firstSessionCompleted: {
      lighthouse_watch: true,
      context_switch: true,
      pattern_fold: true
    },
    introAnimationSeen: true,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', uid), userProfile);

  // 2. Populate userProgress Aggregates
  console.log("📊 [Populator] Writing userProgress Aggregates...");
  const userProgress = {
    uid: uid,
    cognitiveScore: 735,
    domainScores: {
      memory: 745,
      speed: 710,
      attention: 765,
      executive: 725,
      verbal: 750,
      spatial: 715
    },
    brainAge: 27,
    cohortPercentile: 86,
    personalBests: {
      lighthouse_watch: 810,
      context_switch: 790,
      pattern_fold: 820
    },
    rollingAverages: {
      lighthouse_watch: { score: 735, dPrime: 2.75 },
      context_switch: { score: 710, accuracy: 0.94 },
      pattern_fold: { score: 720, accuracy: 0.91 }
    },
    patternFrequency: {
      LATE_FATIGUE: 2,
      SWITCH_COST_SPIKE: 1
    },
    insightHistory: [
      {
        insightId: "sleep-attention",
        timestamp: new Date().toISOString(),
        helpful: true
      }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'userProgress', uid), userProgress);

  // 3. Populate Streaks
  console.log("🔥 [Populator] Writing Streak Stats...");
  const streaks = {
    uid: uid,
    streakDays: 5,
    longestStreak: 14,
    lastWorkoutDate: new Date().toISOString().split('T')[0],
    freezesOwned: 2,
    freezeUsageLog: [
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    ],
    weeklyActivity: {
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: false,
      Sunday: false
    },
    lifetimeSessions: 38,
    lifetimeDays: 29,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'streaks', uid), streaks);

  // 4. Populate Adaptive Difficulty States
  console.log("⚙️ [Populator] Writing Adaptive Difficulty States...");
  const adaptiveState = {
    uid: uid,
    lighthouse_watch: {
      currentLevel: 3,
      sessionsSinceChange: 4,
      pendingSuggestion: null
    },
    context_switch: {
      currentLevel: 2,
      sessionsSinceChange: 2,
      pendingSuggestion: null
    },
    pattern_fold: {
      currentLevel: 3,
      sessionsSinceChange: 5,
      pendingSuggestion: null
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'adaptiveState', uid), adaptiveState);

  // 5. Populate 10 Historical Gameplay Sessions
  console.log("🎮 [Populator] Writing 10 Historical Sessions...");
  const games = ['lighthouse_watch', 'context_switch', 'pattern_fold'];
  const sessionBaseScores = [690, 700, 710, 720, 715, 730, 740, 725, 750, 760];

  for (let i = 0; i < 10; i++) {
    const dayOffset = 10 - i;
    const sessionDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const game = games[i % games.length];
    const score = sessionBaseScores[i];
    const sessionId = `historical-session-${100 + i}`;

    const sessionDoc = {
      sessionId: sessionId,
      game: game,
      timestamp: sessionDate.toISOString(),
      level: game === 'lighthouse_watch' ? 3 : game === 'context_switch' ? 2 : 3,
      durationActiveMs: 180000,
      abandoned: false,
      score: score,
      metrics: game === 'lighthouse_watch' ? {
        hits: 24, misses: 2, falseAlarms: 1, hitRate: 0.923, faRate: 0.04, dPrime: 2.75
      } : game === 'context_switch' ? {
        accuracy: 0.94, switchAccuracy: 0.92, stayAccuracy: 0.96, switchCostMs: 110.5
      } : {
        spatialEfficiency: 0.91, accuracy: 0.91, eliteSpeedCount: 3
      },
      notes: `sleep: 7.5, mood: good`,
      createdAt: sessionDate.toISOString(),
      updatedAt: sessionDate.toISOString()
    };

    // Save session subdocument
    await setDoc(doc(db, 'users', uid, 'sessions', sessionId), sessionDoc);
    console.log(`  └─ Saved session ${i+1}/10: ${game} (Score: ${score}) for Date: ${sessionDoc.timestamp.split('T')[0]}`);
  }

  console.log("\n🎉 [Populator] All collections successfully populated for user A7FOF5oXjaMGFK4bzBE1VPcvPH62 in Firestore!");
}

populateData().catch((err) => {
  console.error("❌ [Populator] Failed to populate database:", err);
});
