import { useState, useCallback, useRef } from 'react';
import type { TimelineClip } from './useProject';

export interface UndoSnapshot {
  id: string;
  timestamp: number;
  clips: TimelineClip[];
  label: string;
}

interface UseUndoHistoryReturn {
  snapshots: UndoSnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushSnapshot: (clips: TimelineClip[], label: string) => void;
  undo: () => TimelineClip[] | null;
  redo: () => TimelineClip[] | null;
  goToSnapshot: (index: number) => TimelineClip[] | null;
  clear: () => void;
}

export function useUndoHistory(maxSnapshots = 20): UseUndoHistoryReturn {
  const [snapshots, setSnapshots] = useState<UndoSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);

  const pushSnapshot = useCallback((clips: TimelineClip[], label: string) => {
    // Don't push if we're in the middle of restoring
    if (isRestoringRef.current) return;

    const snapshot: UndoSnapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      clips: structuredClone(clips),
      label,
    };

    setSnapshots(prev => {
      // If we're not at the end, truncate future snapshots
      const truncated = prev.slice(0, currentIndex + 1);
      // Add new snapshot and trim to max
      const updated = [...truncated, snapshot].slice(-maxSnapshots);
      return updated;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxSnapshots - 1));
  }, [currentIndex, maxSnapshots]);

  const undo = useCallback((): TimelineClip[] | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    isRestoringRef.current = true;
    setTimeout(() => { isRestoringRef.current = false; }, 100);

    return snapshots[newIndex]?.clips ? structuredClone(snapshots[newIndex].clips) : null;
  }, [currentIndex, snapshots]);

  const redo = useCallback((): TimelineClip[] | null => {
    if (currentIndex >= snapshots.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    isRestoringRef.current = true;
    setTimeout(() => { isRestoringRef.current = false; }, 100);

    return snapshots[newIndex]?.clips ? structuredClone(snapshots[newIndex].clips) : null;
  }, [currentIndex, snapshots]);

  const goToSnapshot = useCallback((index: number): TimelineClip[] | null => {
    if (index < 0 || index >= snapshots.length) return null;

    setCurrentIndex(index);
    isRestoringRef.current = true;
    setTimeout(() => { isRestoringRef.current = false; }, 100);

    return snapshots[index]?.clips ? structuredClone(snapshots[index].clips) : null;
  }, [snapshots]);

  const clear = useCallback(() => {
    setSnapshots([]);
    setCurrentIndex(-1);
  }, []);

  return {
    snapshots,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < snapshots.length - 1,
    pushSnapshot,
    undo,
    redo,
    goToSnapshot,
    clear,
  };
}
