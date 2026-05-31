// src/features/train/games/SignalChain/SignalChainGrid.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SignalChainNode from './SignalChainNode';

export default function SignalChainGrid({
  gridDim,
  nodeSize,
  activeNodeIndex,
  phase,
  onNodeTap,
  feedbackColor,
  Colors,
  disabled,
  nodePoints,
  lastCorrectTapIndex,
}) {
  const totalNodes = gridDim * gridDim;
  const nodes = Array.from({ length: totalNodes }, (_, i) => i);

  return (
    <View
      style={[
        styles.grid,
        {
          width: gridDim * nodeSize + (gridDim - 1) * 8,
          gap: 8,
        },
      ]}
    >
      {nodes.map((idx) => {
        const row = Math.floor(idx / gridDim) + 1;
        const col = (idx % gridDim) + 1;

        const isActive = activeNodeIndex === idx && phase === 'watching';
        const isCorrectFlash = feedbackColor === '#3DC27A' && activeNodeIndex === idx;
        const isErrorFlash = feedbackColor === '#F4A041' && activeNodeIndex === idx;

        const isTappedCorrectly = lastCorrectTapIndex === idx;

        return (
          <SignalChainNode
            key={idx}
            index={idx}
            row={row}
            col={col}
            size={nodeSize}
            isActive={isActive}
            isCorrectFlash={isCorrectFlash}
            isErrorFlash={isErrorFlash}
            feedbackColor={feedbackColor && activeNodeIndex === idx ? feedbackColor : null}
            onPress={() => onNodeTap(idx)}
            disabled={disabled || phase !== 'recall'}
            Colors={Colors}
            nodePoints={nodePoints}
            isTappedCorrectly={isTappedCorrectly}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
