// src/features/train/games/LighthouseWatch/LighthouseWatchIcon.js
import React from 'react';
import { ICONS } from './LighthouseWatchIcons';

/**
 * LighthouseWatchIcon renders the vector shape based on current slot state
 * @param {{ type: string, color: string, size?: number }} props
 */
export default function LighthouseWatchIcon({ type, color, size = 48 }) {
  const icon = ICONS[type] || ICONS.target;
  return icon.render(color, size);
}
