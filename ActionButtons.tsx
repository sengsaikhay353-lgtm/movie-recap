import React from 'react';
import { Play, Download, Sparkles, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ActionButtonsProps {
  onGenerateRecap: (isV2: boolean) => void;
  onExportVideo: () => void;
  hasVideo: boolean;
  hasScenes: boolean;
  sceneCount: number;
  estimatedSeconds: number;
  isProcessing: boolean;
  processingStage?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onGenerateRecap,
  onExportVideo,
  hasVideo,
  hasScenes,
  sceneCount,
  estimatedSeconds,
  isProcessing,
  processingStage,
}) => {
  const formatEstimatedTime = (secs: number) => {
    if (secs < 60) return `~${secs} seconds`;
    const mins = Math.ceil(secs / 60);
    return `~${mins} min`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Estimated Time and Scene Info Strip */}
      <div className="bg-[#111116] rounded-xl border border-zinc-800/80 px-3.5 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-red-400" />
          <span className="font-burmese">ခန့်မှန်းကြာချိန်:</span>
          <span className="font-mono font-bold text-zinc-200">
            {hasVideo ? formatEstimatedTime(estimatedSeconds) : '--'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasScenes ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1 font-burmese">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ဇာတ်ဝင်ခန်း {sceneCount} ခု အသင့်ရှိ</span>
            </span>
          ) : (
            <span className="text-zinc-500 font-burmese">
              {hasVideo ? 'ဇာတ်လမ်းခွဲခြမ်းရန် အသင့်ရှိ' : 'ဗီဒီယို မတင်ရသေးပါ'}
            </span>
          )}
        </div>
      </div>

      {/* Main 3 Action Buttons */}
      <div className="space-y-2.5">
        {/* 1. Generate AI Recap Script Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onGenerateRecap(false)}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-600/30 active:scale-[0.99] border border-cyan-400/30'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="font-burmese">{processingStage || 'လုပ်ဆောင်နေပါသည်...'}</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current text-cyan-200" />
              <span>Generate AI Recap Script</span>
              <span className="text-xs font-normal opacity-90 font-burmese">
                (ဇာတ်လမ်းပြော ရေးဖွဲ့မည်)
              </span>
            </>
          )}
        </button>

        {/* 2. Export Video Button */}
        <button
          type="button"
          disabled={!hasVideo || !hasScenes || isProcessing}
          onClick={onExportVideo}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
            !hasVideo || !hasScenes || isProcessing
              ? 'bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white hover:brightness-110 active:scale-[0.99] border border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
          }`}
        >
          <Download className="w-4 h-4 stroke-[2.4]" />
          <span>Export Video (MP4 ထုတ်ယူမည်)</span>
        </button>

        {/* 3. Story Recap V2 Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onGenerateRecap(true)}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
            isProcessing
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              : 'bg-slate-950/80 hover:bg-slate-900 text-cyan-400 hover:text-cyan-300 border border-violet-500/30 hover:border-violet-500 shadow-sm active:scale-[0.99]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>STORY RECAP V2</span>
          <span className="text-[11px] font-normal text-slate-400 font-burmese">
            (အဆင့်မြင့် ဇာတ်လမ်းအလှည့်အပြောင်း)
          </span>
        </button>
      </div>
    </div>
  );
};
