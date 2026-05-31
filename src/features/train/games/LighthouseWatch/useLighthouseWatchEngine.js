// src/features/train/games/LighthouseWatch/useLighthouseWatchEngine.js
import { useState, useRef, useEffect } from 'react';
import { LIGHTHOUSE_WATCH } from '../../../../constants/gameConfig';

function getDistractorShapes(distractorSet) {
  switch (distractorSet) {
    case 'clearly_different':
      return ['triangle', 'circle', 'hexagon'];
    case 'similar_family':
      return ['star4pt', 'diamond', 'burst8pt'];
    case 'near_identical':
      return ['star6ptOverlaid'];
    case 'star_variants':
      return ['star6ptContinuous', 'sparkleElongated'];
    case 'five_vs_six_point':
      return ['star6ptMatch'];
    default:
      return ['triangle', 'circle', 'hexagon'];
  }
}

export function generateStream(totalIconSlots, targetFrequency, distractorSet) {
  const targetCount = Math.round(totalIconSlots * targetFrequency);
  const distractorCount = Math.max(1, totalIconSlots - targetCount);
  const distractorShapes = getDistractorShapes(distractorSet);

  const randomDistractor = () => {
    return distractorShapes[Math.floor(Math.random() * distractorShapes.length)];
  };

  const icons = [
    ...Array(targetCount).fill('target'),
    ...Array(distractorCount).fill(null).map(() => randomDistractor()),
  ];

  // Fisher-Yates Shuffle
  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [icons[i], icons[j]] = [icons[j], icons[i]];
  }

  // Constrain targets: at least 2 distractors between any targets
  let adjusted = true;
  let iterations = 0;
  while (adjusted && iterations < 15) {
    adjusted = false;
    iterations++;
    for (let i = 0; i < icons.length - 1; i++) {
      if (icons[i] === 'target') {
        for (let offset = 1; offset <= 2; offset++) {
          if (i + offset < icons.length && icons[i + offset] === 'target') {
            for (let j = i + offset + 1; j < icons.length; j++) {
              if (icons[j] !== 'target') {
                [icons[i + offset], icons[j]] = [icons[j], icons[i + offset]];
                adjusted = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  return icons;
}

export function useLighthouseWatchEngine(level, isActive, onRoundComplete, multiplier) {
  const config = LIGHTHOUSE_WATCH.levels[level] || LIGHTHOUSE_WATCH.levels[1];
  const tierMultiplier = LIGHTHOUSE_WATCH.TIER_MULTIPLIERS[config.tier] || 1.0;

  // Game specific statistics
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const [stream, setStream] = useState([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(null);
  const [roundPhase, setRoundPhase] = useState('isi'); // 'stimulus' | 'isi'
  const [activeFeedback, setActiveFeedback] = useState(null); // { type, points }

  const hasTappedRef = useRef(false);
  const feedbackTimeoutRef = useRef(null);
  const streamIndexRef = useRef(0);

  // Initialize and pre-generate the stream sequence
  useEffect(() => {
    // 60000ms / stimulusDuration gives the estimated slot count
    const totalSlots = Math.floor(62000 / config.stimulusDuration); // slight buffer
    const generated = generateStream(totalSlots, config.targetFrequency, config.distractorSet);
    setStream(generated);
    setStreamIndex(0);
    streamIndexRef.current = 0;
  }, [level]);

  const handleTap = (timestamp) => {
    if (hasTappedRef.current || !isActive) return;
    hasTappedRef.current = true;

    if (roundPhase === 'stimulus' && currentIcon === 'target') {
      // Correct HIT!
      const points = Math.round(100 * tierMultiplier * multiplier);
      setHits((prev) => prev + 1);
      setCurrentStreak((prev) => {
        const next = prev + 1;
        if (next > longestStreak) setLongestStreak(next);
        return next;
      });

      triggerFeedback('hit', points);

      onRoundComplete({
        isCorrect: true,
        scoreProps: { baseScore: 100, speedBonus: 0, maxScore: 100 },
        metrics: {
          isHit: true,
          roundScore: points,
          tier: config.tier,
        },
      });
    } else {
      // Incorrect FALSE ALARM (either tapped distractor or tapped during ISI)
      const penalty = Math.round(-60 * tierMultiplier);
      setFalseAlarms((prev) => prev + 1);
      setCurrentStreak(0);

      triggerFeedback('false_alarm', penalty);

      onRoundComplete({
        isCorrect: false,
        scoreProps: { baseScore: 0, speedBonus: 0, maxScore: 100 },
        metrics: {
          isFalseAlarm: true,
          roundScore: penalty,
          tier: config.tier,
        },
      });
    }
  };

  const handleMiss = () => {
    if (currentIcon === 'target' && !hasTappedRef.current && isActive) {
      // Target departed without being tapped: MISS
      setMisses((prev) => prev + 1);
      setCurrentStreak(0);

      triggerFeedback('miss', 0);

      onRoundComplete({
        isCorrect: false,
        scoreProps: { baseScore: 0, speedBonus: 0, maxScore: 100 },
        metrics: {
          isMiss: true,
          roundScore: 0,
          tier: config.tier,
        },
      });
    }
  };

  const triggerFeedback = (type, points) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActiveFeedback({ type, points, id: Date.now() });

    const duration = type === 'hit' ? 200 : type === 'miss' ? 300 : 400;
    feedbackTimeoutRef.current = setTimeout(() => {
      setActiveFeedback(null);
    }, duration);
  };

  const advanceStream = () => {
    hasTappedRef.current = false;
    const nextIdx = streamIndexRef.current + 1;
    if (nextIdx >= stream.length) {
      // Regenerate stream defensively if we reach the end
      const totalSlots = Math.floor(62000 / config.stimulusDuration);
      const generated = generateStream(totalSlots, config.targetFrequency, config.distractorSet);
      setStream(generated);
      setStreamIndex(0);
      streamIndexRef.current = 0;
      setCurrentIcon(generated[0]);
    } else {
      setStreamIndex(nextIdx);
      streamIndexRef.current = nextIdx;
      setCurrentIcon(stream[nextIdx]);
    }
  };

  return {
    stream,
    streamIndex,
    currentIcon,
    roundPhase,
    setRoundPhase,
    activeFeedback,
    handleTap,
    handleMiss,
    advanceStream,
    hits,
    misses,
    falseAlarms,
    longestStreak,
    config,
  };
}
