import React, { useState } from 'react';
import { SceneSegment } from '../types/recap';
import { generateSrt, downloadTextFile } from '../utils/subtitleUtils';
import {
  FileText,
  Download,
  Copy,
  Check,
  Clock,
  Layers,
  Edit2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SubtitleStudioProps {
  movieTitle: string;
  scenes: SceneSegment[];
  onUpdateScenes: (updated: SceneSegment[]) => void;
  videoDuration: number;
  hasRealVideo?: boolean;
}

export const SubtitleStudio: React.FC<SubtitleStudioProps> = ({
  movieTitle,
  scenes,
  onUpdateScenes,
  videoDuration,
  hasRealVideo = true,
}) => {
  const [lang, setLang] = useState<'burmese' | 'english' | 'bilingual'>('burmese');
  const [isCopied, setIsCopied] = useState(false);

  const srtContent = generateSrt(scenes, lang);

  const isVerified =
    hasRealVideo &&
    videoDuration > 0 &&
    scenes.length > 0 &&
    scenes[scenes.length - 1].endTime <= Math.ceil(videoDuration) + 2;

  const handleCopySrt = () => {
    if (!srtContent) return;
    navigator.clipboard.writeText(srtContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSrt = () => {
    if (!srtContent) return;
    const filename = `${(movieTitle || 'Movie_Recap').replace(/\s+/g, '_')}_${lang}.srt`;
    downloadTextFile(filename, srtContent, 'application/x-subrip;charset=utf-8');
  };

  const handleDownloadTxt = () => {
    if (!scenes || scenes.length === 0) return;
    const txt = scenes
      .map(
        (s, i) =>
          `[Scene ${i + 1}] (${s.startTime}s - ${s.endTime}s)\n${
            lang === 'burmese'
              ? s.scriptMy
              : lang === 'english'
              ? s.scriptEn
              : `${s.scriptMy}\n(${s.scriptEn})`
          }`
      )
      .join('\n\n');

    const filename = `${(movieTitle || 'Movie_Recap').replace(/\s+/g, '_')}_subtitles.txt`;
    downloadTextFile(filename, txt);
  };

  const handleResyncTimestamps = () => {
    if (scenes.length === 0 || !videoDuration) return;
    const step = videoDuration / scenes.length;
    const updated = scenes.map((sc, idx) => ({
      ...sc,
      startTime: Math.round(idx * step),
      endTime: Math.round(Math.min(videoDuration, (idx + 1) * step)),
    }));
    onUpdateScenes(updated);
  };

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>AI Subtitle Studio (စာတန်းထိုး စတူဒီယို)</span>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
              {scenes.length} Subtitle Blocks
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-burmese">
            အသံနှင့် ကိုက်ညီသော စာတန်းထိုးများကို SRT နှင့် TXT ဖိုင်များအဖြစ် ထုတ်ယူရန်
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-slate-950 text-xs text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg outline-none font-burmese"
          >
            <option value="burmese">မြန်မာစာတန်း (Burmese SRT)</option>
            <option value="english">English Subtitles (SRT)</option>
            <option value="bilingual">Bilingual (နှစ်မျိုးစလုံး)</option>
          </select>

          <button
            type="button"
            disabled={!srtContent}
            onClick={handleCopySrt}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1 font-burmese transition-colors disabled:opacity-50"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SRT</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!srtContent}
            onClick={handleDownloadSrt}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .SRT</span>
          </button>

          <button
            type="button"
            disabled={!srtContent}
            onClick={handleDownloadTxt}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center gap-1 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Timestamp Status Banner: Distinguishing Verified vs Estimated */}
      <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-burmese text-xs">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                အချိန်မှတ် အမျိုးအစား: <strong className="text-emerald-300">Verified Video Timestamps</strong> (တင်သွင်းထားသော ဗီဒီယိုဖိုင် ကြာချိန်နှင့် အတိအကျ ကိုက်ညီပါသည်)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                အချိန်မှတ် အမျိုးအစား: <strong className="text-amber-300">AI Estimated Story Timestamps</strong> (ခန့်မှန်းခြေ ဇာတ်လမ်း အချိန်မှတ်များ ဖြစ်သည်)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">
            Duration: {Math.floor(videoDuration)}s
          </span>
          {videoDuration > 0 && scenes.length > 0 && (
            <button
              type="button"
              onClick={handleResyncTimestamps}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
              title="Resync timestamps evenly to video duration"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>ချိန်ညှိမည် (Resync)</span>
            </button>
          )}
        </div>
      </div>

      {/* SRT Display / Editor Window */}
      {scenes.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-300 font-burmese">
            စာတန်းထိုး မရှိသေးပါ
          </p>
          <p className="text-[11px] text-slate-500 font-burmese">
            "Generate Recap" ဖြင့် ဇာတ်လမ်းထုတ်လုပ်ပါက အချိန်မှတ်များနှင့်တကွ စာတန်းထိုးများ အလိုအလျောက် ထွက်ရှိလာပါမည်
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {srtContent}
          </div>

          {/* Subtitle Scene Preview List with start/end editing */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block font-burmese">
              စာတန်းထိုး အပိုင်းများနှင့် အချိန်မှတ် တည်းဖြတ်ရန် (Edit Text & Timestamps):
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-cyan-400 font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <input
                        type="number"
                        min="0"
                        value={scene.startTime}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updated = scenes.map((s) =>
                            s.id === scene.id ? { ...s, startTime: val } : s
                          );
                          onUpdateScenes(updated);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 text-center py-0.5 rounded text-cyan-300 outline-none"
                      />
                      <span>s -</span>
                      <input
                        type="number"
                        min="1"
                        value={scene.endTime}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updated = scenes.map((s) =>
                            s.id === scene.id ? { ...s, endTime: val } : s
                          );
                          onUpdateScenes(updated);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 text-center py-0.5 rounded text-cyan-300 outline-none"
                      />
                      <span>s</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={lang === 'english' ? scene.scriptEn : scene.scriptMy}
                    onChange={(e) => {
                      const updated = scenes.map((s) =>
                        s.id === scene.id
                          ? {
                              ...s,
                              [lang === 'english' ? 'scriptEn' : 'scriptMy']: e.target.value,
                            }
                          : s
                      );
                      onUpdateScenes(updated);
                    }}
                    className="bg-slate-900/60 border border-slate-800 focus:border-cyan-500 rounded px-2.5 py-1 text-slate-200 outline-none flex-1 font-burmese"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
