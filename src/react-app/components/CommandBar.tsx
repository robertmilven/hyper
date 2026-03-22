import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Type,
  Volume2,
  Scissors,
  Camera,
  Image,
  Zap,
  Layers,
  Code,
  Download,
  Play,
  Film,
  Wand2,
  CornerDownLeft,
} from 'lucide-react';

type CommandId = string;

interface Command {
  id: CommandId;
  label: string;
  description?: string;
  keywords: string[];
  icon: typeof Sparkles;
  color: string;
  category: 'ai' | 'panel' | 'export' | 'action';
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  // Routing callbacks
  onRunCommand: (commandId: CommandId) => void;
}

const COMMANDS: Command[] = [
  // AI Actions
  { id: 'add-captions', label: 'Add captions', description: 'Transcribe and add subtitles', keywords: ['subtitle', 'transcribe', 'text', 'speech'], icon: Type, color: 'text-blue-400', category: 'ai' },
  { id: 'remove-silence', label: 'Remove dead air', description: 'Cut silent sections', keywords: ['silence', 'gaps', 'pauses', 'dead'], icon: Volume2, color: 'text-green-400', category: 'ai' },
  { id: 'generate-thumbnail', label: 'Generate thumbnail', description: 'AI thumbnail creator', keywords: ['thumb', 'cover', 'image', 'youtube'], icon: Camera, color: 'text-orange-400', category: 'ai' },
  { id: 'generate-broll', label: 'Generate B-roll', description: 'AI-powered overlay images', keywords: ['broll', 'overlay', 'images', 'visual'], icon: Image, color: 'text-purple-400', category: 'ai' },
  { id: 'make-viral', label: 'Make it viral', description: 'Apply trending edit patterns', keywords: ['viral', 'trending', 'zoom', 'effects'], icon: Zap, color: 'text-pink-400', category: 'ai' },
  { id: 'create-animation', label: 'Create animation', description: 'Remotion-powered graphics', keywords: ['animation', 'motion', 'graphics', 'remotion'], icon: Sparkles, color: 'text-cyan-400', category: 'ai' },
  { id: 'extract-audio', label: 'Extract audio', description: 'Separate audio track', keywords: ['audio', 'extract', 'separate', 'sound'], icon: Volume2, color: 'text-amber-400', category: 'ai' },

  // Panels
  { id: 'panel:scene', label: 'Open Scene Detection', description: 'Detect scene boundaries', keywords: ['scene', 'detect', 'cuts', 'boundaries'], icon: Layers, color: 'text-blue-400', category: 'panel' },
  { id: 'panel:broll', label: 'Open B-Roll Panel', description: 'AI b-roll suggestions', keywords: ['broll', 'panel', 'overlay'], icon: Image, color: 'text-green-400', category: 'panel' },
  { id: 'panel:thumbnail', label: 'Open Thumbnail Generator', description: 'Create thumbnails', keywords: ['thumbnail', 'panel', 'generator'], icon: Camera, color: 'text-orange-400', category: 'panel' },
  { id: 'panel:viral', label: 'Open Viral Edit Panel', description: 'Viral edit presets', keywords: ['viral', 'panel', 'trending'], icon: Zap, color: 'text-pink-400', category: 'panel' },
  { id: 'panel:repurpose', label: 'Open Content Repurpose', description: 'Turn long to shorts', keywords: ['repurpose', 'shorts', 'tiktok', 'reels'], icon: Scissors, color: 'text-purple-400', category: 'panel' },
  { id: 'panel:remotion', label: 'Open Remotion Generator', description: 'Custom animations', keywords: ['remotion', 'animation', 'generator'], icon: Code, color: 'text-cyan-400', category: 'panel' },

  // Export Presets
  { id: 'export:youtube', label: 'Export for YouTube', description: '1920x1080, -16 LUFS', keywords: ['youtube', 'export', '16:9', 'horizontal'], icon: Download, color: 'text-red-400', category: 'export' },
  { id: 'export:tiktok', label: 'Export for TikTok', description: '1080x1920, -14 LUFS', keywords: ['tiktok', 'export', '9:16', 'vertical', 'shorts'], icon: Download, color: 'text-pink-400', category: 'export' },
  { id: 'export:reels', label: 'Export for Instagram Reels', description: '1080x1920, -14 LUFS', keywords: ['instagram', 'reels', 'export', 'vertical'], icon: Download, color: 'text-purple-400', category: 'export' },
  { id: 'export:square', label: 'Export for Instagram Square', description: '1080x1080, -14 LUFS', keywords: ['instagram', 'square', 'export', '1:1'], icon: Download, color: 'text-orange-400', category: 'export' },
  { id: 'export:twitter', label: 'Export for Twitter/X', description: '1280x720, -14 LUFS', keywords: ['twitter', 'x', 'export'], icon: Download, color: 'text-blue-400', category: 'export' },

  // Quick Actions
  { id: 'play', label: 'Play/Pause', description: 'Toggle playback', keywords: ['play', 'pause', 'space'], icon: Play, color: 'text-green-400', category: 'action' },
  { id: 'generate-image', label: 'Generate image', description: 'AI image generation', keywords: ['image', 'generate', 'ai', 'picture'], icon: Wand2, color: 'text-amber-400', category: 'ai' },
  { id: 'animate-image', label: 'Animate image', description: 'Turn image into video', keywords: ['animate', 'image', 'video', 'motion'], icon: Film, color: 'text-cyan-400', category: 'ai' },
];

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Direct substring match
  if (lowerText.includes(lowerQuery)) return true;

  // Word-by-word match
  const queryWords = lowerQuery.split(/\s+/);
  return queryWords.every(word => lowerText.includes(word));
}

export default function CommandBar({ isOpen, onClose, onRunCommand }: CommandBarProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS;

    return COMMANDS.filter(cmd => {
      // Check label
      if (fuzzyMatch(cmd.label, query)) return true;
      // Check description
      if (cmd.description && fuzzyMatch(cmd.description, query)) return true;
      // Check keywords
      return cmd.keywords.some(kw => fuzzyMatch(kw, query));
    });
  }, [query]);

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      ai: [],
      panel: [],
      export: [],
      action: [],
    };
    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onRunCommand(filteredCommands[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onRunCommand, filteredCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleSelect = (cmd: Command) => {
    onRunCommand(cmd.id);
    onClose();
  };

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Bar */}
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-lg placeholder-zinc-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No commands match "{query}"
            </div>
          ) : (
            <>
              {/* AI Actions */}
              {groupedCommands.ai.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    AI Actions
                  </div>
                  {groupedCommands.ai.map((cmd) => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-purple-500/20 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cmd.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-[10px] text-zinc-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {isSelected && <CornerDownLeft className="w-4 h-4 text-zinc-500" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Panels */}
              {groupedCommands.panel.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Panels
                  </div>
                  {groupedCommands.panel.map((cmd) => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-purple-500/20 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cmd.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-[10px] text-zinc-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {isSelected && <CornerDownLeft className="w-4 h-4 text-zinc-500" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Export */}
              {groupedCommands.export.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Export
                  </div>
                  {groupedCommands.export.map((cmd) => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-purple-500/20 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cmd.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-[10px] text-zinc-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {isSelected && <CornerDownLeft className="w-4 h-4 text-zinc-500" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              {groupedCommands.action.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Actions
                  </div>
                  {groupedCommands.action.map((cmd) => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-purple-500/20 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cmd.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-[10px] text-zinc-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {isSelected && <CornerDownLeft className="w-4 h-4 text-zinc-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">esc</kbd>
              Close
            </span>
          </div>
          <span className="text-zinc-600">{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}
