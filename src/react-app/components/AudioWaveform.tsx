import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioWaveformProps {
  sessionId: string;
  assetId: string;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

interface WaveformData {
  assetId: string;
  duration: number;
  samples: number[];
  sampleCount: number;
}

// Cache waveform data in memory to avoid re-fetching
const waveformCache = new Map<string, WaveformData>();

export default function AudioWaveform({
  sessionId,
  assetId,
  width,
  height,
  color = 'rgba(255, 255, 255, 0.8)',
  backgroundColor = 'transparent',
  className = '',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch waveform data
  const fetchWaveform = useCallback(async () => {
    const cacheKey = `${sessionId}:${assetId}`;

    // Check cache first
    if (waveformCache.has(cacheKey)) {
      setWaveformData(waveformCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate optimal number of samples based on width
      const samples = Math.min(Math.max(Math.floor(width / 2), 50), 500);
      const response = await fetch(
        `http://localhost:3333/session/${sessionId}/assets/${assetId}/waveform?samples=${samples}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch waveform: ${response.status}`);
      }

      const data: WaveformData = await response.json();
      waveformCache.set(cacheKey, data);
      setWaveformData(data);
    } catch (err) {
      console.error('Waveform fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load waveform');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, assetId, width]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (sessionId && assetId) {
      fetchWaveform();
    }
  }, [sessionId, assetId, fetchWaveform]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData?.samples?.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform bars
    const samples = waveformData.samples;
    const barWidth = Math.max(width / samples.length - 1, 1);
    const gap = 1;
    const centerY = height / 2;
    const maxBarHeight = height * 0.9;

    ctx.fillStyle = color;

    for (let i = 0; i < samples.length; i++) {
      const x = i * (barWidth + gap);
      const amplitude = samples[i];
      const barHeight = Math.max(amplitude * maxBarHeight, 2);

      // Draw bar centered vertically
      const y = centerY - barHeight / 2;

      // Rounded bars
      const radius = Math.min(barWidth / 2, 1);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }
  }, [waveformData, width, height, color, backgroundColor]);

  // Show placeholder while loading
  if (isLoading || error || !waveformData) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        {/* Simple animated placeholder bars */}
        <div className="flex items-center gap-px h-full opacity-40">
          {Array.from({ length: Math.min(Math.floor(width / 4), 20) }, (_, i) => (
            <div
              key={i}
              className="w-0.5 bg-white/60 rounded-full animate-pulse"
              style={{
                height: `${30 + Math.sin(i * 0.5) * 20}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width,
        height,
        display: 'block',
      }}
    />
  );
}

// Hook for preloading waveforms (call when clips are added)
export function usePreloadWaveform(sessionId: string, assetId: string) {
  useEffect(() => {
    const cacheKey = `${sessionId}:${assetId}`;
    if (waveformCache.has(cacheKey)) return;

    // Preload in background
    fetch(`http://localhost:3333/session/${sessionId}/assets/${assetId}/waveform?samples=200`)
      .then((res) => res.json())
      .then((data) => {
        waveformCache.set(cacheKey, data);
      })
      .catch(() => {
        // Ignore preload errors
      });
  }, [sessionId, assetId]);
}

// Clear cache for a specific asset (call when asset is deleted)
export function clearWaveformCache(sessionId: string, assetId: string) {
  const cacheKey = `${sessionId}:${assetId}`;
  waveformCache.delete(cacheKey);
}
