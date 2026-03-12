import { useState, useRef, useCallback } from 'react';
import { X, Sparkles, Copy, Download, Check, Code, Loader2, FileCode, Video, Play, ImagePlus, Trash2, Upload } from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  serverUrl?: string;
}

interface RemotionGeneratorPanelProps {
  onClose: () => void;
  sessionId?: string;
  onAssetCreated?: () => void;
}

const LOCAL_FFMPEG_URL = 'http://localhost:3333';

export default function RemotionGeneratorPanel({ onClose, sessionId, onAssetCreated }: RemotionGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderSuccess, setRenderSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'code'>('prompt');
  const [duration, setDuration] = useState(8);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for temporary session (created if no main session exists)
  const [tempSessionId, setTempSessionId] = useState<string | null>(null);

  // Get the active session (prefer main session, fall back to temp)
  const activeSessionId = sessionId || tempSessionId;

  // Create a temporary session for Remotion if needed
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (tempSessionId) return tempSessionId;

    try {
      // Create a temporary session for Remotion uploads
      const response = await fetch(`${LOCAL_FFMPEG_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'remotion-temp' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setTempSessionId(data.sessionId);
      return data.sessionId;
    } catch (err) {
      console.error('Failed to create temp session:', err);
      return null;
    }
  }, [sessionId, tempSessionId]);

  // Handle image upload
  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // Ensure we have a session for uploads
      const sid = await ensureSession();
      if (!sid) {
        throw new Error('Could not create upload session');
      }

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        // Create preview
        const preview = URL.createObjectURL(file);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add to state with preview
        const newImage: UploadedImage = {
          id: tempId,
          file,
          preview,
        };
        setUploadedImages(prev => [...prev, newImage]);

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${LOCAL_FFMPEG_URL}/session/${sid}/assets`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const result = await response.json();
        const serverUrl = `${LOCAL_FFMPEG_URL}/session/${sid}/assets/${result.asset.id}/stream`;

        // Update with server URL
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === tempId ? { ...img, id: result.asset.id, serverUrl } : img
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  }, [ensureSession]);

  // Remove uploaded image
  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const examplePrompts = [
    {
      title: '🔥 Subscribe CTA',
      prompt: `Create an 8 second animation for a YouTube subscribe reminder:
- Start with a title scene: "Don't Forget!" in bold orange with zoom-in camera
- Add an emoji scene with 🔔 bell and 👍 thumbs up bouncing
- Show text: "Like & Subscribe" with swipe transition
- End with animated shapes: stars spinning around the text
- Use dark background, vibrant orange and yellow colors
- Add camera movements and smooth transitions between scenes`
    },
    {
      title: '📊 Stats Counter',
      prompt: `Create a 10 second stats showcase animation:
- Title scene: "Our Results" with ken-burns camera effect
- Stats scene with 3 animated counting numbers:
  * "10,000+" subscribers (count from 0)
  * "500+" videos (count from 0)
  * "1M+" views (count from 0)
- Add celebration emojis: 🎉 🚀 ⭐ with pop animations
- Use progress bar chart showing growth
- Purple and blue color scheme, dark background
- Swipe transitions between scenes`
    },
    {
      title: '🎬 Intro Sequence',
      prompt: `Create a 6 second video intro animation:
- Start with shapes: colorful circles and stars floating in from edges
- Title scene: "WELCOME" with dramatic zoom-in
- Subtitle: "Let's Get Started" fading in below
- Add emoji burst: ✨ 🎯 💡 scattered with bounce animation
- End with a countdown from 3 to 1
- Use gradient colors: pink to purple
- Fast-paced transitions, energetic feel`
    },
    {
      title: '📱 Product Features',
      prompt: `Create a 12 second product feature showcase:
- Title: "Why Choose Us?" with pan-right camera
- Features list with icons appearing one by one:
  * "Lightning Fast" ⚡
  * "Easy to Use" 🎯
  * "Always Reliable" 💪
- Comparison scene: Before vs After
- Stats: "99% satisfaction rate" with counting animation
- End with CTA: "Try It Now!" with pulsing effect
- Clean modern look, blue and green colors`
    },
    {
      title: '🎉 Celebration',
      prompt: `Create a 5 second celebration animation:
- Big title: "CONGRATULATIONS!" with shake camera effect
- Emoji explosion: 🎉 🎊 🏆 ⭐ 🔥 scattered everywhere with pop animations
- Confetti-style shapes: colorful stars and circles bouncing
- Text: "You Did It!" sliding in from bottom
- Gold and purple color scheme
- High energy, lots of movement`
    },
    {
      title: '⏰ Countdown Timer',
      prompt: `Create an 8 second countdown animation:
- Dramatic countdown from 5 to 1
- Each number pulses and scales up
- Add ticking clock emoji ⏰ bouncing
- Color transition: red → orange → yellow → green
- Final "GO!" text with zoom explosion effect
- Camera shake on each number
- Dark background with bright glowing numbers`
    },
    {
      title: '📈 Growth Chart',
      prompt: `Create a 10 second business growth animation:
- Title: "Our Journey" with fade transition
- Animated bar chart showing monthly growth
- Stats with counting: Revenue $50K, Users 10K, Rating 4.9
- Line chart showing upward trend
- Celebration emojis at the peak: 📈 🚀 💰
- Professional look: navy blue and gold
- Smooth camera movements throughout`
    },
    {
      title: '💡 Tips & Steps',
      prompt: `Create a 12 second how-to animation:
- Title: "3 Easy Steps" with swipe-right transition
- Step 1: "Download the App" with 📱 emoji
- Step 2: "Create Account" with ✏️ emoji
- Step 3: "Start Creating!" with 🎨 emoji
- Each step slides in with number animation
- End with: "It's That Simple!" and thumbs up 👍
- Friendly colors: teal and orange
- Clean, instructional style`
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);

    try {
      // Use session endpoint if available, otherwise use standalone endpoint
      const url = sessionId
        ? `http://localhost:3333/session/${sessionId}/generate-remotion`
        : `http://localhost:3333/generate-remotion`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate Remotion code');
      }

      const data = await response.json();
      setGeneratedCode(data.code);
      setActiveTab('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RemotionComposition.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUseExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setActiveTab('prompt');
  };

  const handleRenderVideo = async () => {
    if (!prompt.trim()) return;

    setIsRendering(true);
    setError(null);
    setRenderSuccess(null);

    try {
      const url = activeSessionId
        ? `http://localhost:3333/session/${activeSessionId}/render-remotion`
        : `http://localhost:3333/render-remotion`;

      // Collect uploaded image URLs
      const imageUrls = uploadedImages
        .filter(img => img.serverUrl)
        .map(img => ({
          url: img.serverUrl!,
          filename: img.file.name,
        }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: 1920,
          height: 1080,
          fps: 30,
          durationSeconds: duration,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to render video');
      }

      // Check if response is video (no session) or JSON (with session)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('video/mp4')) {
        // Download the video directly
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'remotion-animation.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        setRenderSuccess('Video downloaded successfully!');
      } else {
        // JSON response with asset info
        const data = await response.json();

        // If using temp session (not main session), auto-download the video
        if (!sessionId && data.asset?.id && activeSessionId) {
          // Fetch and download the video from temp session
          const videoUrl = `${LOCAL_FFMPEG_URL}/session/${activeSessionId}/assets/${data.asset.id}/stream`;
          const videoResponse = await fetch(videoUrl);
          const blob = await videoResponse.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = 'remotion-animation.mp4';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          setRenderSuccess(`Video downloaded! ${data.sceneCount} scenes, ${data.renderTime}s render time`);
        } else {
          // Using main session - video is in assets
          setRenderSuccess(`Video rendered! ${data.sceneCount} scenes, ${data.renderTime}s render time`);
          onAssetCreated?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Remotion Generator</h2>
              <p className="text-sm text-zinc-400">Generate animated video compositions with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'prompt'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Prompt
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Generated Code
            {generatedCode && <span className="ml-2 text-green-400">✓</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'prompt' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Describe your Remotion composition
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want: text animations, emojis, shapes, colors, transitions, camera movements..."
                  className="w-full h-36 px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Add Images (optional) - AI will animate them with ken-burns, zooms, etc.
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-zinc-600 hover:border-purple-500 rounded-xl p-4 transition-colors"
                >
                  {uploadedImages.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center py-4 cursor-pointer"
                    >
                      <ImagePlus className="w-8 h-8 text-zinc-500 mb-2" />
                      <p className="text-sm text-zinc-400">Drop images here or click to upload</p>
                      <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WebP supported</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt={img.file.name}
                              className="w-20 h-20 object-cover rounded-lg border border-zinc-600"
                            />
                            <button
                              onClick={() => removeImage(img.id)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                            {!img.serverUrl && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 border-2 border-dashed border-zinc-600 hover:border-purple-500 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <ImagePlus className="w-6 h-6 text-zinc-500" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} added - AI will use these in media scenes
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Duration Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-zinc-300">Duration:</label>
                <div className="flex gap-2">
                  {[5, 8, 10, 15, 20].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Example Prompts */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Click an example to use it</h3>
                <div className="grid grid-cols-4 gap-2">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseExample(example.prompt)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500/50 rounded-lg text-left transition-all"
                    >
                      <span className="text-sm font-medium text-white">{example.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {renderSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {renderSuccess}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {generatedCode ? (
                <>
                  {/* Code Actions */}
                  <div className="flex items-center justify-between p-3 border-b border-zinc-700 bg-zinc-800/50">
                    <span className="text-sm text-zinc-400">RemotionComposition.tsx</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-white transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  {/* Code Display */}
                  <div className="flex-1 overflow-auto p-4 bg-zinc-950">
                    <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                      {generatedCode}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No code generated yet</p>
                    <p className="text-sm mt-1">Enter a prompt and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Generate code to copy, or render directly to video
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRenderVideo}
              disabled={!prompt.trim() || isRendering || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Render Video
                </>
              )}
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || isRendering}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="w-4 h-4" />
                  Generate Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
