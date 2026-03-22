import { Undo2, Redo2, Clock, Trash2 } from 'lucide-react';
import type { UndoSnapshot } from '@/react-app/hooks/useUndoHistory';

interface UndoHistoryPanelProps {
  snapshots: UndoSnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGoToSnapshot: (index: number) => void;
  onClear: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function UndoHistoryPanel({
  snapshots,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGoToSnapshot,
  onClear,
}: UndoHistoryPanelProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border-b border-zinc-800/50">
        <Clock className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-[10px] text-zinc-600">No history yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900/50 border-b border-zinc-800/50">
      {/* Undo/Redo Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-3.5 h-3.5 text-zinc-400" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-zinc-700" />

      {/* History Strip */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {snapshots.map((snapshot, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <button
              key={snapshot.id}
              onClick={() => onGoToSnapshot(index)}
              className={`flex-shrink-0 px-2 py-1 rounded text-[10px] transition-all ${
                isCurrent
                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50'
                  : isPast
                    ? 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                    : 'bg-zinc-800/30 text-zinc-500 hover:bg-zinc-700/30 opacity-60'
              }`}
              title={`${snapshot.label}\n${formatTimeAgo(snapshot.timestamp)}`}
            >
              <span className="truncate max-w-[80px] block">
                {snapshot.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
        title="Clear history"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* History Count */}
      <span className="text-[9px] text-zinc-600 min-w-[30px] text-right">
        {currentIndex + 1}/{snapshots.length}
      </span>
    </div>
  );
}
