import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  Image as ImageIcon,
  Type,
  Palette,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Layers,
  FileImage,
  Flame,
} from 'lucide-react';
import { ViralPackage } from '../types/recap';

interface ThumbnailStudioProps {
  movieTitle: string;
  defaultHookText?: string;
  sampleFrameBase64?: string;
  viralData?: ViralPackage | null;
}

export const ThumbnailStudio: React.FC<ThumbnailStudioProps> = ({
  movieTitle,
  defaultHookText = 'မထင်မှတ်ထားတဲ့ အမှန်တရား!',
  sampleFrameBase64,
  viralData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headlineText, setHeadlineText] = useState(defaultHookText || 'မထင်မှတ်ထားတဲ့ အမှန်တရား!');
  const [subText, setSubText] = useState(movieTitle || 'MOVIE RECAP');
  const [bgStyle, setBgStyle] = useState<
    'gradient-violet' | 'gradient-crimson' | 'gradient-cyber' | 'frame' | 'ai-image'
  >(sampleFrameBase64 ? 'frame' : 'gradient-violet');
  const [badgeText, setBadgeText] = useState('TEAM ALPHA AI');

  // AI Generated Image State
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [aiImageStatus, setAiImageStatus] = useState<string | null>(null);
  const [aiImageError, setAiImageError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (defaultHookText) {
      setHeadlineText(defaultHookText);
    }
  }, [defaultHookText]);

  useEffect(() => {
    if (movieTitle) {
      setSubText(movieTitle);
    }
  }, [movieTitle]);

  useEffect(() => {
    drawThumbnail();
  }, [headlineText, subText, bgStyle, badgeText, sampleFrameBase64, aiImageBase64]);

  const drawThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background: AI Image
    if (bgStyle === 'ai-image' && aiImageBase64) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        // Vignette & dark scrim for text readability
        const scrim = ctx.createLinearGradient(0, 0, width, height);
        scrim.addColorStop(0, 'rgba(5, 5, 10, 0.35)');
        scrim.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);
        renderOverlays(ctx, width, height);
      };
      img.src = aiImageBase64;
      return;
    }

    // 2. Draw Background: Extracted Video Frame
    if (bgStyle === 'frame' && sampleFrameBase64) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const scrim = ctx.createLinearGradient(0, 0, width, height);
        scrim.addColorStop(0, 'rgba(5, 5, 10, 0.4)');
        scrim.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);
        renderOverlays(ctx, width, height);
      };
      img.src = sampleFrameBase64;
      return;
    }

    // 3. Fallback: Procedural Gradients
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (bgStyle === 'gradient-crimson') {
      grad.addColorStop(0, '#450a0a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#030712');
    } else if (bgStyle === 'gradient-cyber') {
      grad.addColorStop(0, '#083344');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#030712');
    } else {
      // Violet
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#030712');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative cinematic lighting shapes
    ctx.save();
    ctx.filter = 'blur(60px)';
    ctx.fillStyle =
      bgStyle === 'gradient-crimson'
        ? 'rgba(239, 68, 68, 0.35)'
        : 'rgba(139, 92, 246, 0.35)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.35, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.65, 350, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    renderOverlays(ctx, width, height);
  };

  const renderOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 2. Red / Violet Corner Accent Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 3. Top Brand Badge
    if (badgeText) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(50, 50, 260, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, 180, 74);
    }

    // 4. Large Punchy Thumbnail Headline Text
    ctx.save();
    ctx.font = 'bold 78px "Padauk", "Myanmar Text", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Yellow or Neon White text with thick black drop stroke for ultimate contrast on YouTube
    const textY = height * 0.52;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(headlineText, 60, textY);

    ctx.fillStyle = '#fde047'; // High-CTR YouTube Yellow
    ctx.fillText(headlineText, 60, textY);
    ctx.restore();

    // 5. Secondary Title / Plot Subtext
    if (subText) {
      ctx.save();
      ctx.font = 'bold 44px "Plus Jakarta Sans", "Padauk", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#020617';
      ctx.strokeText(subText, 60, height * 0.72);
      ctx.fillText(subText, 60, height * 0.72);
      ctx.restore();
    }

    // 6. 4K / HD Quality Badge in Bottom-Right
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(width - 180, height - 100, 120, 44);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 180, height - 100, 120, 44);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('4K ULTRA', width - 120, height - 78);
  };

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(subText || 'Movie_Recap').replace(/\s+/g, '_')}_thumbnail.jpg`;
    link.click();
  };

  const handleGenerateAiImage = async () => {
    setIsGeneratingAiImage(true);
    setAiImageError(null);
    setAiImageStatus('Imagen 3 ဖြင့် AI ပိုစတာ ရေးဆွဲနေပါသည်...');

    try {
      const response = await fetch('/api/generate-ai-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieTitle: subText || movieTitle || 'Movie Recap',
          prompt: customPrompt.trim(),
          aspectRatio: '16:9',
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.imageBase64) {
        setAiImageBase64(resData.imageBase64);
        setBgStyle('ai-image');
        setAiImageStatus('AI Poster အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ (Imagen 3)!');
        setAiImageError(null);
      } else {
        setAiImageError(
          resData.error ||
            'AI Image Generation မရရှိနိုင်ပါ (API quota သို့မဟုတ် ဒေသကန့်သတ်ချက်ကြောင့် ဖြစ်နိုင်သည်)။ ဗီဒီယိုဖရိမ် သို့မဟုတ် Studio Gradient ကို အသုံးပြုထားပါသည်။'
        );
        setAiImageStatus(null);
      }
    } catch (err: any) {
      setAiImageError(
        'AI Image ဝန်ဆောင်မှု ချိတ်ဆက်မရပါ (Network/API error)။ ဗီဒီယို ဖရိမ်ကို အသုံးပြုနိုင်ပါသည်။'
      );
      setAiImageStatus(null);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-400" />
            <span>Viral Thumbnail Studio (ပုံရိပ် ဖန်တီးမှု)</span>
          </h3>
          <p className="text-xs text-slate-400 font-burmese">
            YouTube / Facebook / TikTok အတွက် High-CTR Thumbnail များကို စက္ကန့်ပိုင်းအတွင်း ဖန်တီးပါ
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadThumbnail}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all font-burmese"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Image (JPG)</span>
        </button>
      </div>

      {/* Honest Status Badge */}
      <div className="bg-black/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2 font-burmese">
        <div className="flex items-center gap-2">
          {bgStyle === 'ai-image' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>အခြေအနေ: Imagen 3 ဖြင့် ဖန်တီးထားသော တကယ့် AI Poster ပုံရိပ်</span>
            </span>
          ) : bgStyle === 'frame' ? (
            <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold">
              <FileImage className="w-3.5 h-3.5" />
              <span>အခြေအနေ: သင့်ဗီဒီယိုမှ တိုက်ရိုက်ရယူထားသော High-Res Video Keyframe</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>အခြေအနေ: Studio Cinematic Procedural Lighting & Gradients</span>
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">1280 × 720 (16:9 HD)</span>
      </div>

      {/* Live Canvas Preview */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative flex items-center justify-center shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>

      {/* AI Image Generation Section */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 font-burmese">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>AI Image / Poster Generation (Imagen 3):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Optional AI Background</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`AI ပိုစတာ ဖန်တီးရန် prompt ရိုက်ထည့်ပါ (ဥပမာ- Dramatic action movie poster for ${subText || 'Movie'})...`}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-red-500 font-burmese"
          />
          <button
            type="button"
            disabled={isGeneratingAiImage}
            onClick={handleGenerateAiImage}
            className="px-3.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all font-burmese disabled:opacity-50 shrink-0"
          >
            {isGeneratingAiImage ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>ရေးဆွဲနေသည်...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Poster ထုတ်လုပ်မည်</span>
              </>
            )}
          </button>
        </div>

        {aiImageStatus && (
          <p className="text-[11px] text-emerald-400 font-burmese">{aiImageStatus}</p>
        )}
        {aiImageError && (
          <p className="text-[11px] text-amber-400/90 font-burmese flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{aiImageError}</span>
          </p>
        )}
      </div>

      {/* Quick Hook Picker from Viral Package */}
      {viralData?.thumbnailTexts && viralData.thumbnailTexts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 font-burmese">
            <Flame className="w-3 h-3 text-red-500" />
            <span>အသင့်သုံး ဆွဲဆောင်မှုရှိသော Thumbnail စာသားများ (Click to apply):</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {viralData.thumbnailTexts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setHeadlineText(item.burmese)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/60 text-[11px] text-slate-300 font-burmese transition-colors text-left"
              >
                {item.burmese}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Headline Text Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 font-burmese">
            အဓိက စာသားကြီး (Large Headline - 2-4 Words):
          </label>
          <input
            type="text"
            value={headlineText}
            onChange={(e) => setHeadlineText(e.target.value)}
            placeholder="မထင်မှတ်ထားတဲ့ အမှန်တရား!"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-red-500 font-burmese"
          />
        </div>

        {/* Subtext Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 font-burmese">
            ရုပ်ရှင်အမည် / စာတန်းငယ် (Movie Title):
          </label>
          <input
            type="text"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Avatar (2009) Recap"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-red-500 font-burmese"
          />
        </div>

        {/* Background Style */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 font-burmese">
            နောက်ခံ စတိုင် (Background Theme):
          </label>
          <select
            value={bgStyle}
            onChange={(e) => setBgStyle(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-red-500 font-burmese"
          >
            {aiImageBase64 && <option value="ai-image">AI Generated Poster (Imagen 3)</option>}
            {sampleFrameBase64 && <option value="frame">Source Video Keyframe (Frame Capture)</option>}
            <option value="gradient-crimson">Blood Crimson Thriller</option>
            <option value="gradient-violet">Cinematic Violet Glow</option>
            <option value="gradient-cyber">Cyber Blue Mystery</option>
          </select>
        </div>

        {/* Top Badge */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Top Badge Text:
          </label>
          <input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="TEAM ALPHA AI"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-red-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
};
