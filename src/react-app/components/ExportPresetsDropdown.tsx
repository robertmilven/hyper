import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Youtube, Instagram, Twitter } from 'lucide-react';

export interface ExportPreset {
  id: string;
  label: string;
  icon: typeof Youtube;
  width: number;
  height: number;
  aspectRatio: string;
  lufs: number;
  color: string;
  description: string;
}

const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    lufs: -16,
    color: 'text-red-500',
    description: '1920x1080, -16 LUFS',
  },
  {
    id: 'tiktok',
    label: 'TikTok / Shorts',
    icon: Download,
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    lufs: -14,
    color: 'text-pink-400',
    description: '1080x1920, -14 LUFS',
  },
  {
    id: 'reels',
    label: 'Instagram Reels',
    icon: Instagram,
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    lufs: -14,
    color: 'text-purple-400',
    description: '1080x1920, -14 LUFS',
  },
  {
    id: 'square',
    label: 'Instagram Square',
    icon: Instagram,
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    lufs: -14,
    color: 'text-orange-400',
    description: '1080x1080, -14 LUFS',
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    icon: Twitter,
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    lufs: -14,
    color: 'text-blue-400',
    description: '1280x720, -14 LUFS',
  },
];

interface ExportPresetsDropdownProps {
  onExport: (preset: ExportPreset) => void;
  disabled?: boolean;
}

export default function ExportPresetsDropdown({ onExport, disabled }: ExportPresetsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (preset: ExportPreset) => {
    onExport(preset);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          disabled
            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            : isOpen
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
        }`}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <span className="text-xs font-medium text-zinc-400">Export Presets</span>
          </div>

          {/* Preset List */}
          <div className="p-2">
            {EXPORT_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-zinc-800 text-zinc-300"
                >
                  <Icon className={`w-4 h-4 ${preset.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{preset.label}</div>
                    <div className="text-[10px] text-zinc-500">{preset.description}</div>
                  </div>
                  <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800 rounded">
                    {preset.aspectRatio}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Export */}
          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={() => {
                // Default export (current settings)
                onExport(EXPORT_PRESETS[0]); // YouTube preset as default
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-zinc-800 text-zinc-400"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Custom Export...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { EXPORT_PRESETS };
