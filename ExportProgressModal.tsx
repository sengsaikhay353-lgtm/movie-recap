import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Film,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileVideo,
} from 'lucide-react';
import { RenderProgress } from '../types/recap';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: RenderProgress;
  onCancel: () => void;
  onRestart: () => void;
  aspectRatio: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  onCancel,
  onRestart,
  aspectRatio,
}) => {
  if (!isOpen) return null;

  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121217] w-full max-w-md rounded-2xl border border-zinc-800 shadow-2xl p-5 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex justify-center">
          {isCompleted ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
          ) : isError ? (
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(255,31,61,0.4)]">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,31,61,0.55)] relative">
              <Film className="w-7 h-7 stroke-[2.2]" />
              <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Title & Burmese Message */}
        <div>
          <h3 className="text-base font-extrabold text-white tracking-wide">
            {isCompleted
              ? 'RECAP VIDEO READY!'
              : isError
              ? 'RENDERING FAILED'
              : 'PRODUCING RECAP VIDEO'}
          </h3>
          <p className="text-xs text-red-400 font-burmese font-medium mt-1">
            {progress.messageMy || 'ဗီဒီယို ထုတ်လုပ်နေပါသည်...'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {progress.message}
          </p>
        </div>

        {/* Real Progress Bar */}
        {!isCompleted && !isError && (
          <div className="space-y-2 bg-[#171720] p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                Scene {progress.currentSceneIndex} / {progress.totalScenes}
              </span>
              <span className="text-red-400 font-bold">{progress.progressPercent}%</span>
            </div>

            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,31,61,0.8)]"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span className="font-burmese">ကျန်ရှိချိန်ခန့်မှန်း:</span>
              <span className="font-mono text-zinc-300 font-bold">
                {progress.estimatedSecondsRemaining > 0
                  ? `~${progress.estimatedSecondsRemaining} seconds`
                  : 'Wrapping up container...'}
              </span>
            </div>
          </div>
        )}

        {/* Completed State: Video Preview + Download Action */}
        {isCompleted && progress.downloadUrl && (
          <div className="space-y-3 pt-1">
            {/* Downloadable Video Preview */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-700/80 bg-black aspect-video flex items-center justify-center">
              <video
                src={progress.downloadUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800 font-mono">
              <span>Ratio: {aspectRatio}</span>
              <span>Size: {progress.outputSizeMb || 'N/A'} MB</span>
            </div>

            {/* Direct Download Button */}
            <a
              href={progress.downloadUrl}
              download={`TEAM_ALPHA_Recap_${Date.now()}.mp4`}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,31,61,0.5)] hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>DOWNLOAD MP4 (ဗီဒီယို သိမ်းဆည်းရန်)</span>
            </a>
          </div>
        )}

        {/* Error message detail if error */}
        {isError && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-burmese leading-relaxed">
            {progress.error || 'လုပ်ဆောင်ချက် မအောင်မြင်ပါ (Rendering error occurred)'}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-center gap-3">
          {!isCompleted && !isError && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-burmese transition-colors"
            >
              လုပ်ဆောင်မှု ရပ်တန့်မည် (Cancel)
            </button>
          )}

          {(isCompleted || isError) && (
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 font-burmese transition-colors border border-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>အစမှ ပြန်လည်စတင်မည် (Done / Reset)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
