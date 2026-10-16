import React from 'react';
import { Clapperboard, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  hasGeminiKey: boolean;
  quotaStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ hasGeminiKey }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-row justify-between items-center gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-violet-600 via-rose-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-violet-500/20 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-violet-400 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
                TEAM ALPHA AI
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium font-burmese">
              Cinematic Movie Recap Generator (ရုပ်ရှင် ဇာတ်လမ်းပြော စတူဒီယို)
            </p>
          </div>
        </div>

        {/* Engine Ready Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-200 block leading-tight">
              Gemini AI
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Ready • Free Studio
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

