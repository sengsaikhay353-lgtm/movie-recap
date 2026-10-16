import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoUploadPanel } from './components/VideoUploadPanel';
import { SettingsCard } from './components/SettingsCard';
import { ActionButtons } from './components/ActionButtons';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { ThumbnailStudio } from './components/ThumbnailStudio';
import { ScriptLibrary } from './components/ScriptLibrary';
import { SocialSeoStudio } from './components/SocialSeoStudio';
import { SubtitleStudio } from './components/SubtitleStudio';
import { VoiceoverStudio } from './components/VoiceoverStudio';
import {
  VideoMetadata,
  RecapSettings,
  SceneSegment,
  RenderProgress,
  RecapLength,
  ViralPackage,
  SavedScript,
} from './types/recap';
import { videoProcessor } from './utils/videoProcessor';
import { audioEngine } from './utils/audioSynth';
import {
  Clapperboard,
  Sliders,
  Sparkles,
  Copy,
  Check,
  Download,
  Film,
  Play,
  Pause,
  Volume2,
  Square,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit3,
  Share2,
  Image as ImageIcon,
  Folder,
  Mic,
  Info,
  Flame,
  CheckCircle2,
  FileVideo,
} from 'lucide-react';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // System & API Status
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  const [quotaStatus, setQuotaStatus] = useState('active');

  // Active Studio Tool Tab
  const [activeTool, setActiveTool] = useState<
    'recap' | 'subtitles' | 'thumbnails' | 'seo' | 'voiceover' | 'library'
  >('recap');

  // Movie Title & Core Plot Input
  const [movieTitle, setMovieTitle] = useState('');
  const [storyNotes, setStoryNotes] = useState('');
  const [recapLength, setRecapLength] = useState<RecapLength>('medium');

  // Video State
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [analysisMethodBadge, setAnalysisMethodBadge] = useState<string | null>(null);
  const [sampleFrameBase64, setSampleFrameBase64] = useState<string | undefined>(undefined);

  // Settings State
  const [settings, setSettings] = useState<RecapSettings>({
    durationPreset: '3',
    customDurationMinutes: 3,
    aspectRatio: '9:16',
    resolution: '720p',
    enableBlurBox: false,
    blurBoxIntensity: 15,
    blurBoxPosition: 'bottom-bar',

    narrationLanguage: 'burmese',
    voiceTone: 'dramatic',
    speechSpeed: 1.0,
    enableBgm: true,
    bgmStyle: 'suspense',
    bgmVolume: 35,
    originalVideoVolume: 65,

    subtitleLang: 'burmese',
    subtitleFontSize: 24,
    subtitleColor: '#FFE600',
    subtitleOutline: true,
    subtitlePosition: 'bottom',
    enableWatermark: true,
    watermarkText: '@TeamAlphaRecap',
    watermarkOpacity: 75,
    watermarkPosition: 'top-right',
  });

  // Script & Scenes State
  const [scenes, setScenes] = useState<SceneSegment[]>([]);
  const [fullScriptText, setFullScriptText] = useState<string>('');
  const [loglineMy, setLoglineMy] = useState<string>('');
  const [viralData, setViralData] = useState<ViralPackage | null>(null);
  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [selectedThumbnailHook, setSelectedThumbnailHook] = useState<string>('');

  // UI & Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [isSpeakingFullScript, setIsSpeakingFullScript] = useState(false);

  // Real Render Progress State
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    status: 'idle',
    progressPercent: 0,
    currentSceneIndex: 0,
    totalScenes: 0,
    message: '',
    messageMy: '',
    estimatedSecondsRemaining: 0,
  });

  // Check system status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
        setQuotaStatus(data.quotaStatus || 'active');
      })
      .catch(() => {
        setHasGeminiKey(false);
        setQuotaStatus('local_only');
      });
  }, []);

  const handleSettingsChange = (updated: Partial<RecapSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleVideoLoaded = async (meta: VideoMetadata) => {
    setVideoMeta(meta);
    if (!movieTitle) {
      setMovieTitle(meta.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    // Extract a representative frame for thumbnail preview
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          const frames = await videoProcessor.extractKeyframes(videoRef.current, 1);
          if (frames.length > 0) {
            setSampleFrameBase64(frames[0].base64);
          }
        } catch (_) {}
      }
    }, 500);
  };

  const handleClearVideo = () => {
    if (videoMeta?.objectUrl) {
      URL.revokeObjectURL(videoMeta.objectUrl);
    }
    setVideoMeta(null);
    setSampleFrameBase64(undefined);
    setAnalysisMethodBadge(null);
  };

  // Target duration calculation
  const targetDurationMinutes =
    recapLength === 'short'
      ? 2
      : recapLength === 'long'
      ? 12
      : settings.durationPreset === 'custom'
      ? settings.customDurationMinutes
      : Number(settings.durationPreset);

  const totalSelectedSceneSeconds =
    scenes.length > 0
      ? scenes.reduce((acc, s) => acc + Math.max(1, s.endTime - s.startTime), 0)
      : targetDurationMinutes * 60;
  const estimatedSeconds = Math.round(totalSelectedSceneSeconds * 1.15);

  // Generate Recap Script (AI Recap Pro)
  const handleGenerateRecap = async (isV2: boolean = false) => {
    let currentMeta = videoMeta;

    setIsProcessing(true);
    setProcessingStage(
      isV2
        ? 'ဇာတ်လမ်း အဆင့်မြင့် ခွဲခြမ်းစိတ်ဖြာနေသည် (Story Recap V2)...'
        : 'ဇာတ်လမ်းပြော စာသား ရေးဖွဲ့နေသည် (Generating AI Recap Script)...'
    );

    // If user hasn't uploaded video, auto-load sample video for instant preview
    if (!currentMeta) {
      try {
        const sampleUrl =
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        const sampleRes = await fetch(sampleUrl);
        const sampleBlob = await sampleRes.blob();
        const sampleFile = new File([sampleBlob], 'Action_Movie_Sample.mp4', {
          type: 'video/mp4',
        });
        const objUrl = URL.createObjectURL(sampleFile);
        currentMeta = {
          file: sampleFile,
          objectUrl: objUrl,
          name: sampleFile.name,
          sizeBytes: sampleFile.size,
          duration: 15,
          width: 1280,
          height: 720,
          aspectRatio: '16:9',
        };
        setVideoMeta(currentMeta);
        if (!movieTitle) {
          setMovieTitle('Avatar: The Way of Water');
        }
      } catch (_) {
        currentMeta = {
          file: new File([], 'Movie_Recap.mp4'),
          objectUrl: '',
          name: 'Movie_Recap.mp4',
          sizeBytes: 10000000,
          duration: targetDurationMinutes * 60,
          width: 1920,
          height: 1080,
          aspectRatio: '16:9',
        };
        setVideoMeta(currentMeta);
      }
    }

    try {
      // 1. Extract genuine sample frame thumbnails if video is ready
      let keyframes: Array<{ timestamp: number; base64: string }> = [];
      if (videoRef.current && currentMeta.objectUrl) {
        try {
          keyframes = await videoProcessor.extractKeyframes(videoRef.current, 4);
          if (keyframes.length > 0) {
            setSampleFrameBase64(keyframes[0].base64);
          }
        } catch (frameErr) {
          console.warn('Frame extraction skipped:', frameErr);
        }
      }

      // 2. Call server-side Gemini API
      const effectiveTitle = movieTitle.trim() || currentMeta.name;
      const response = await fetch('/api/analyze-movie-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieTitle: effectiveTitle,
          recapLength,
          durationMinutes: targetDurationMinutes,
          tone: settings.voiceTone,
          outputLanguage: settings.narrationLanguage,
          videoDuration: Math.floor(currentMeta.duration),
          extractedFrames: keyframes,
          storyNotes,
          isV2,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setScenes(data.scenes || []);
        setLoglineMy(data.loglineMy || '');
        if (data.titleMy) setMovieTitle(data.titleMy);

        // Honest analysis method reporting
        if (result.analysisMethod === 'multimodal_vision_keyframes') {
          setAnalysisMethodBadge(
            `Genuine Multimodal Analysis (${result.framesAnalyzed} Video Keyframes Processed)`
          );
        } else {
          setAnalysisMethodBadge('Transcript & Plot Analysis (No Video Frames Uploaded)');
        }

        // Build full formatted text if provided or format from scenes
        if (data.fullScriptText) {
          setFullScriptText(data.fullScriptText);
        } else {
          const formatted =
            `=== TEAM ALPHA AI: ${data.titleMy || effectiveTitle} ===\n\n` +
            `【အဓိက ဆွဲဆောင်မှု (Hook)】: ${data.loglineMy || ''}\n\n` +
            (data.scenes || [])
              .map(
                (sc: SceneSegment, idx: number) =>
                  `[${formatTimecode(sc.startTime)}] ဇာတ်ဝင်ခန်း ${idx + 1}: ${sc.titleMy}\n` +
                  `[Voiceover]: ${sc.scriptMy}\n` +
                  `[Subtitle]: ${sc.scriptEn}\n`
              )
              .join('\n');
          setFullScriptText(formatted);
        }

        setIsProcessing(false);
      } else {
        generateFallbackLocalScenes(isV2, effectiveTitle);
      }
    } catch (err) {
      console.warn('API error, falling back to local script generator:', err);
      generateFallbackLocalScenes(isV2, movieTitle || 'Movie Story');
    }
  };

  // Generate Viral Titles & SEO Package
  const handleGenerateViralPackage = async () => {
    setIsGeneratingViral(true);
    try {
      const response = await fetch('/api/generate-viral-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieTitle: movieTitle || 'Movie Recap',
          plotSummary: loglineMy || storyNotes || '',
          tone: settings.voiceTone,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setViralData(result.data);
      } else {
        alert('Could not generate viral package. Please check network/key.');
      }
    } catch (err) {
      console.warn('Failed to generate viral package:', err);
    } finally {
      setIsGeneratingViral(false);
    }
  };

  // Helper timecode formatter
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Intelligent local fallback if API quota is reached
  const generateFallbackLocalScenes = (isV2: boolean, title: string) => {
    const dur = videoMeta?.duration || targetDurationMinutes * 60;
    const sceneCount = recapLength === 'short' ? 3 : recapLength === 'long' ? 9 : 5;
    const step = dur / sceneCount;

    const fallbackBurmese = [
      'ဇာတ်လမ်းအစမှာတင် မထင်မှတ်ထားတဲ့ အဖြစ်ဆိုးကြီးတစ်ခု စတင်ဖြစ်ပွားလာခဲ့ပါတယ်...',
      'ဒီလူဟာ မိမိရဲ့ မိသားစုကို ကယ်တင်ဖို့အတွက် ဘယ်သူမှ မသွားဝံ့တဲ့ နေရာတစ်ခုဆီကို ခရီးစတင်ခဲ့ရတယ်...',
      'အဲဒီအချိန်မှာ လူတိုင်းကို အံ့အားသင့်သွားစေမယ့် လျှို့ဝှက်ချက်ကြီး ပေါ်ပေါက်လာပါတော့တယ်...',
      'အရာအားလုံး ပြီးဆုံးသွားပြီလို့ ထင်ရတဲ့ အခိုက်အတန့်မှာပဲ အခြေအနေက ပိုမိုတင်းမာလာခဲ့တယ်...',
      'နောက်ဆုံးမှာတော့ အားလုံး မျှော်လင့်မထားတဲ့ မယုံနိုင်စရာ အဖြေတစ်ခုနဲ့ ဇာတ်သိမ်းသွားခဲ့ပါတော့တယ်...',
    ];

    const fallbackScenes: SceneSegment[] = [];
    for (let i = 0; i < sceneCount; i++) {
      const s = Math.round(i * step);
      const e = Math.round(Math.min(dur, (i + 1) * step));
      fallbackScenes.push({
        id: `sc_${i + 1}`,
        startTime: s,
        endTime: e,
        titleMy: `ဇာတ်ဝင်ခန်း ${i + 1}`,
        titleEn: `Scene ${i + 1}`,
        scriptMy: fallbackBurmese[i % fallbackBurmese.length],
        scriptEn: `Scene ${i + 1}: The dramatic suspense unfolds with intense emotional stakes.`,
        emotionalBeat: i === 0 ? 'Hook Intro' : i === sceneCount - 1 ? 'Climax Twist' : 'Tension',
      });
    }

    setScenes(fallbackScenes);
    setLoglineMy('မထင်မှတ်ထားသော အလှည့်အပြောင်းများနှင့် ပြည့်နှက်နေသော မြန်မာဘာသာ ရုပ်ရှင်သုံးသပ်ချက်');
    const formatted =
      `=== TEAM ALPHA AI: ${title} ===\n\n` +
      `【အဓိက ဆွဲဆောင်မှု (Hook)】: မထင်မှတ်ထားသော အလှည့်အပြောင်းများနှင့် ပြည့်နှက်နေသော ရုပ်ရှင်သုံးသပ်ချက်\n\n` +
      fallbackScenes
        .map(
          (sc, idx) =>
            `[${formatTimecode(sc.startTime)}] ဇာတ်ဝင်ခန်း ${idx + 1}: ${sc.titleMy}\n` +
            `[Voiceover]: ${sc.scriptMy}\n` +
            `[Subtitle]: ${sc.scriptEn}\n`
        )
        .join('\n');
    setFullScriptText(formatted);
    setAnalysisMethodBadge('Heuristic Local Engine (Script Generated)');
    setIsProcessing(false);
  };

  // Copy Full Script to Clipboard
  const handleCopyScript = () => {
    if (!fullScriptText) return;
    navigator.clipboard.writeText(fullScriptText);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  // Download Script as .txt file
  const handleDownloadTxt = () => {
    if (!fullScriptText) return;
    const blob = new Blob([fullScriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(movieTitle || 'Movie_Recap').replace(/\s+/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Speak full Burmese script voiceover
  const toggleSpeechPlayback = () => {
    if (isSpeakingFullScript) {
      audioEngine.stopSpeech();
      setIsSpeakingFullScript(false);
      return;
    }

    const narrationText = scenes.map((s) => s.scriptMy).join(' ');
    if (!narrationText) return;

    setIsSpeakingFullScript(true);
    audioEngine.speakText(
      narrationText,
      settings.narrationLanguage === 'burmese' ? 'my-MM' : 'en-US',
      settings.speechSpeed,
      () => setIsSpeakingFullScript(false)
    );
  };

  // Load Script from Library
  const handleLoadSavedScript = (saved: SavedScript) => {
    setMovieTitle(saved.title);
    setFullScriptText(saved.fullScriptText);
    setScenes(saved.scenes || []);
    setLoglineMy(saved.logline || '');
    setActiveTool('recap');
  };

  // Preview Scene in video
  const handlePreviewScene = (startTime: number, endTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play();

    const durationMs = (endTime - startTime) * 1000;
    setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }, durationMs);
  };

  // Launch Video Export
  const handleExportVideo = async () => {
    if (!videoMeta || !videoRef.current) return;

    if (scenes.length === 0) {
      await handleGenerateRecap(false);
      return;
    }

    setIsExportModalOpen(true);
    setRenderProgress({
      status: 'rendering',
      progressPercent: 0,
      currentSceneIndex: 1,
      totalScenes: scenes.length,
      message: 'Preparing rendering canvas and audio pipeline...',
      messageMy: 'ဗီဒီယို ပေါင်းစပ်ရေးဆွဲမှု စတင်နေပါသည်...',
      estimatedSecondsRemaining: estimatedSeconds,
    });

    try {
      await videoProcessor.renderRecapVideo(videoRef.current, scenes, settings, {
        onProgress: (p) => setRenderProgress(p),
        onError: (err) => {
          setRenderProgress((prev) => ({
            ...prev,
            status: 'error',
            error: err,
            message: 'Render failed',
            messageMy: 'ဗီဒီယို ထုတ်လုပ်မှု အမှားဖြစ်ပေါ်ခဲ့သည်',
          }));
        },
        onSuccess: (url, sizeMb) => {
          setRenderProgress((prev) => ({
            ...prev,
            status: 'completed',
            progressPercent: 100,
            downloadUrl: url,
            outputSizeMb: sizeMb,
            message: 'Video rendering finished!',
            messageMy: 'ဗီဒီယို အောင်မြင်စွာ ထုတ်လုပ်ပြီးပါပြီ!',
          }));
        },
      });
    } catch (err: any) {
      setRenderProgress((prev) => ({
        ...prev,
        status: 'error',
        error: err?.message || 'Rendering pipeline interrupted',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Header */}
      <Header hasGeminiKey={hasGeminiKey} quotaStatus={quotaStatus} />

      {/* Studio Navigation Tabs Strip */}
      <nav aria-label="Studio Tools Navigation" className="border-b border-slate-800 bg-slate-900/60 sticky top-[57px] z-40 backdrop-blur-md overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-2 min-w-max">
          {[
            { id: 'recap', label: 'AI Recap Pro', sub: 'ဇာတ်လမ်းပြော', icon: Clapperboard },
            { id: 'subtitles', label: 'Subtitle Studio', sub: '.SRT စာတန်းထိုး', icon: FileText },
            { id: 'thumbnails', label: 'Thumbnail Studio', sub: 'ပုံရိပ်ဖန်တီးမှု', icon: ImageIcon },
            { id: 'seo', label: 'Viral & SEO', sub: 'ခေါင်းစဉ်/Tags', icon: Share2 },
            { id: 'voiceover', label: 'Voiceover Studio', sub: 'အသံထိန်းချုပ်မှု', icon: Mic },
            { id: 'library', label: 'Script Library', sub: 'စာကြည့်တိုက်', icon: Folder },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTool === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTool(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-burmese font-normal">
                  ({tab.sub})
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Studio Viewport */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-4 py-6 sm:py-8 flex-1 w-full">
        {/* ================= 1. AI RECAP PRO TAB ================= */}
        {activeTool === 'recap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Form Controls */}
            <section className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-violet-400">
                    <Sliders className="w-5 h-5" />
                    <span>Recap Configuration</span>
                  </h2>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                    Pro Studio
                  </span>
                </div>

                {/* Video Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-burmese">
                    Upload Movie / Video File (ဗီဒီယို တင်ရန်)
                  </label>
                  <VideoUploadPanel
                    metadata={videoMeta}
                    onVideoLoaded={handleVideoLoaded}
                    onClearVideo={handleClearVideo}
                    videoRef={videoRef}
                  />
                </div>

                {/* Movie Title & Plot Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Movie Title & Core Plot (ရုပ်ရှင်အမည်နှင့် ဇာတ်လမ်း)
                  </label>
                  <input
                    type="text"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="e.g., Avatar (2009), Inception, Interstellar..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition placeholder-slate-600 font-burmese"
                  />
                </div>

                {/* Recap Length (Short, Medium, Long) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-burmese">
                    Recap Length (ကြာချိန် / အလျား):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'short', label: 'Quick Short', sub: '1-2m / ~350w' },
                      { id: 'medium', label: 'Standard', sub: '3-5m / ~850w' },
                      { id: 'long', label: 'Deep Dive', sub: '10-15m / ~1600w' },
                    ].map((len) => (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setRecapLength(len.id as RecapLength)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          recapLength === len.id
                            ? 'bg-violet-950 border-violet-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <p className="text-xs font-bold font-burmese">{len.label}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{len.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language & Tone Selection */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-burmese">
                      Output Language
                    </label>
                    <select
                      value={settings.narrationLanguage}
                      onChange={(e) =>
                        handleSettingsChange({ narrationLanguage: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition font-burmese"
                    >
                      <option value="burmese">မြန်မာဘာသာ (Burmese)</option>
                      <option value="english">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-burmese">
                      Recap Style / Tone
                    </label>
                    <select
                      value={settings.voiceTone}
                      onChange={(e) =>
                        handleSettingsChange({ voiceTone: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition font-burmese"
                    >
                      <option value="dramatic">Cinematic & Dramatic (ဒရာမာ)</option>
                      <option value="thriller">Suspenseful & Thrilling (သည်းထိတ်)</option>
                      <option value="energetic">Fast-Paced & Hype (သွက်လက်)</option>
                      <option value="deep">Emotional & Deep (ရင်ထိရှ)</option>
                      <option value="female">Casual & Entertaining (ပေါ့ပါး)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Transcript / Scene Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-burmese">
                    Transcript / Scene Notes (စိတ်ကြိုက် ဇာတ်ကွက်မှတ်စုများ - Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={storyNotes}
                    onChange={(e) => setStoryNotes(e.target.value)}
                    placeholder="ဗီဒီယိုမတင်လိုပါက ဇာတ်လမ်းမှတ်စု သို့မဟုတ် စာတိုများကို ဤနေရာတွင် ထည့်သွင်းနိုင်ပါသည်..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-violet-500 font-burmese"
                  />
                </div>

                {/* Settings Tabs (Video, Voice, Effects) */}
                <SettingsCard settings={settings} onChange={handleSettingsChange} />

                {/* Main Action Buttons */}
                <ActionButtons
                  onGenerateRecap={handleGenerateRecap}
                  onExportVideo={handleExportVideo}
                  hasVideo={Boolean(videoMeta)}
                  hasScenes={scenes.length > 0}
                  sceneCount={scenes.length}
                  estimatedSeconds={estimatedSeconds}
                  isProcessing={isProcessing}
                  processingStage={processingStage}
                />
              </div>
            </section>

            {/* Right Column: Output & Script Viewer */}
            <section className="lg:col-span-7 flex flex-col space-y-4">
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm flex-1 flex flex-col">
                {/* Header: Title + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                        <span>Generated Script</span>
                        {scenes.length > 0 && (
                          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                            {scenes.length} Scenes
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-400 font-burmese">
                        မြန်မာဘာသာ ဇာတ်လမ်းပြောစာသားနှင့် ဇာတ်ဝင်ခန်းအသေးစိတ်
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {fullScriptText && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 font-burmese"
                      >
                        {scriptCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadTxt}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.TXT</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleSpeechPlayback}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 font-burmese ${
                          isSpeakingFullScript
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isSpeakingFullScript ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current text-white" />
                            <span>ရပ်မည်</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>နားဆင်</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsScriptModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 font-burmese"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                        <span>ပြင်ဆင် (Edit)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Analysis Method Badge (Honest Reporting) */}
                {analysisMethodBadge && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{analysisMethodBadge}</span>
                  </div>
                )}

                {/* Output Window */}
                <div className="flex-1 bg-slate-950 border border-slate-800/90 rounded-xl p-4 sm:p-5 min-h-[420px] max-h-[620px] overflow-y-auto text-sm leading-relaxed text-slate-300 flex flex-col">
                  {!fullScriptText && !isProcessing && (
                    <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                        <Film className="w-8 h-8" />
                      </div>
                      <div className="max-w-sm space-y-1">
                        <p className="font-semibold text-slate-300">
                          Your AI-generated movie recap script will appear here.
                        </p>
                        <p className="text-xs text-slate-500 font-burmese">
                          ရုပ်ရှင်အမည် ရိုက်ထည့်ပါ (သို့) ဗီဒီယိုတင်ပြီး Generate ကို နှိပ်ပါ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGenerateRecap(false)}
                        className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold border border-violet-500/40 transition-colors flex items-center gap-2 font-burmese"
                      >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span>နမူနာဇာတ်လမ်းဖြင့် စမ်းသပ်ထုတ်လုပ်မည် (Try Demo)</span>
                      </button>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="h-full flex-1 flex flex-col items-center justify-center space-y-4 py-20 text-center">
                      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-violet-400">
                          Generating cinematic script with Gemini AI...
                        </p>
                        <p className="text-xs text-slate-400 font-burmese">
                          {processingStage || 'မြန်မာဘာသာ ဇာတ်လမ်းပြော ရေးဖွဲ့နေသည်...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {fullScriptText && !isProcessing && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {loglineMy && (
                        <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-900/40 text-xs text-slate-200">
                          <span className="font-bold text-violet-400 block font-burmese mb-0.5">
                            အဓိက ဆွဲဆောင်မှု (Catchy Hook):
                          </span>
                          <p className="font-burmese leading-relaxed text-slate-300">
                            {loglineMy}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4 whitespace-pre-wrap font-burmese text-slate-200 leading-relaxed text-sm bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        {fullScriptText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= 2. SUBTITLE STUDIO TAB ================= */}
        {activeTool === 'subtitles' && (
          <div className="max-w-4xl mx-auto">
            <SubtitleStudio
              movieTitle={movieTitle}
              scenes={scenes}
              onUpdateScenes={(updated) => setScenes(updated)}
              videoDuration={videoMeta?.duration || targetDurationMinutes * 60}
              hasRealVideo={Boolean(videoMeta?.objectUrl)}
            />
          </div>
        )}

        {/* ================= 3. THUMBNAIL STUDIO TAB ================= */}
        {activeTool === 'thumbnails' && (
          <div className="max-w-4xl mx-auto">
            <ThumbnailStudio
              movieTitle={movieTitle}
              defaultHookText={
                selectedThumbnailHook ||
                viralData?.thumbnailTexts?.[0]?.burmese ||
                viralData?.viralHooks?.[0] ||
                loglineMy ||
                'မထင်မှတ်ထားတဲ့ အမှန်တရား!'
              }
              sampleFrameBase64={sampleFrameBase64}
              viralData={viralData}
            />
          </div>
        )}

        {/* ================= 4. VIRAL & SEO TAB ================= */}
        {activeTool === 'seo' && (
          <div className="max-w-4xl mx-auto">
            <SocialSeoStudio
              movieTitle={movieTitle}
              viralData={viralData}
              onGenerate={handleGenerateViralPackage}
              isLoading={isGeneratingViral}
              onSelectThumbnailText={(text) => {
                setSelectedThumbnailHook(text);
                setActiveTool('thumbnails');
              }}
            />
          </div>
        )}

        {/* ================= 5. VOICEOVER STUDIO TAB ================= */}
        {activeTool === 'voiceover' && (
          <div className="max-w-4xl mx-auto">
            <VoiceoverStudio
              movieTitle={movieTitle}
              scenes={scenes}
              fullScriptText={fullScriptText}
              defaultLanguage={settings.narrationLanguage}
            />
          </div>
        )}

        {/* ================= 6. SCRIPT LIBRARY TAB ================= */}
        {activeTool === 'library' && (
          <div className="max-w-4xl mx-auto">
            <ScriptLibrary
              onLoadScript={handleLoadSavedScript}
              currentScriptToSave={
                fullScriptText
                  ? {
                      title: movieTitle,
                      durationMinutes: targetDurationMinutes,
                      language: settings.narrationLanguage,
                      fullScriptText,
                      scenes,
                      logline: loglineMy,
                    }
                  : null
              }
            />
          </div>
        )}
      </main>

      {/* Script & Timeline Full Editor Modal */}
      <ScriptEditorModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        scenes={scenes}
        movieTitle={movieTitle}
        loglineMy={loglineMy}
        onSaveScenes={(updated) => setScenes(updated)}
        onPreviewScene={handlePreviewScene}
        videoDuration={videoMeta?.duration || 180}
      />

      {/* Export Progress & Download Modal */}
      <ExportProgressModal
        isOpen={isExportModalOpen}
        progress={renderProgress}
        onCancel={() => {
          videoProcessor.cancel();
          setIsExportModalOpen(false);
        }}
        onRestart={() => {
          setIsExportModalOpen(false);
          setRenderProgress({
            status: 'idle',
            progressPercent: 0,
            currentSceneIndex: 0,
            totalScenes: 0,
            message: '',
            messageMy: '',
            estimatedSecondsRemaining: 0,
          });
        }}
        aspectRatio={settings.aspectRatio}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-3.5 px-4 text-center text-[11px] text-slate-500 font-burmese space-y-1">
        <p>TEAM ALPHA AI • Premium AI Movie Recap Studio for Professional Video Production</p>
        <p className="text-[10px] text-slate-600">
          All videos remain local in your browser • Server-side Gemini API key protected
        </p>
      </footer>
    </div>
  );
}
