import React, { useState } from 'react';
import { ViralPackage } from '../types/recap';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  Youtube,
  Hash,
  MessageSquare,
  Flame,
  Type,
  Video,
} from 'lucide-react';

interface SocialSeoStudioProps {
  movieTitle: string;
  viralData: ViralPackage | null;
  onGenerate: () => void;
  isLoading: boolean;
  onSelectThumbnailText?: (text: string) => void;
}

export const SocialSeoStudio: React.FC<SocialSeoStudioProps> = ({
  movieTitle,
  viralData,
  onGenerate,
  isLoading,
  onSelectThumbnailText,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <span>Viral Titles, Thumbnails & SEO Studio</span>
          </h3>
          <p className="text-xs text-slate-400 font-burmese">
            YouTube, Facebook နှင့် TikTok အတွက် ကြည့်ရှုသူအများဆုံးရရှိစေမည့် ခေါင်းစဉ်နှင့် SEO များ
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={onGenerate}
          className={`px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all font-burmese ${
            isLoading ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>ထုတ်လုပ်နေသည်...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Viral Package ထုတ်လုပ်မည် (Generate)</span>
            </>
          )}
        </button>
      </div>

      {!viralData && !isLoading && (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <Flame className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-300 font-burmese">
            Viral Package မထုတ်လုပ်ရသေးပါ
          </p>
          <p className="text-[11px] text-slate-500 font-burmese">
            "Viral Package ထုတ်လုပ်မည်" ကို နှိပ်ပြီး ခေါင်းစဉ် (၁၀) မျိုး၊ Thumbnail စာသားနှင့် SEO ဖော်ပြချက်များကို ရယူပါ
          </p>
        </div>
      )}

      {viralData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. 10 Viral Titles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5 font-burmese">
                <Flame className="w-4 h-4 text-violet-400" />
                <span>10 Viral Click-Worthy Titles (ဆွဲဆောင်မှုရှိသော ခေါင်းစဉ် ၁၀ မျိုး):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">High CTR</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {viralData.titles.map((titleItem, index) => (
                <div
                  key={index}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 hover:border-violet-500/40 flex items-start justify-between gap-3 text-xs transition-colors"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-violet-600/30 text-violet-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="font-bold text-slate-200 font-burmese">
                        {titleItem.burmese}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-6">
                      {titleItem.english}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `${titleItem.burmese} | ${titleItem.english}`,
                        `title_${index}`
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 border border-slate-800"
                    title="Copy title"
                  >
                    {copiedKey === `title_${index}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Large Thumbnail Headline Texts (2-4 words) */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-burmese">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Thumbnail Headline Text (ပုံရိပ်ပေါ်တင်ရန် စာသားကြီးများ):</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {viralData.thumbnailTexts.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-extrabold text-yellow-300 font-burmese block">
                      "{item.burmese}"
                    </span>
                    <span className="text-[10px] text-slate-400">
                      "{item.english}"
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {onSelectThumbnailText && (
                      <button
                        type="button"
                        onClick={() => onSelectThumbnailText(item.burmese)}
                        className="px-2 py-1 rounded bg-violet-950 text-violet-300 text-[10px] font-semibold border border-violet-800 hover:bg-violet-900 font-burmese"
                        title="Use in Thumbnail Studio"
                      >
                        သုံးမည်
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.burmese, `thumb_${index}`)}
                      className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedKey === `thumb_${index}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Opening Hooks for TikTok / Shorts */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-burmese">
              <Video className="w-4 h-4 text-rose-400" />
              <span>5-Second Viral Video Hooks (ဗီဒီယိုအစ ၅ စက္ကန့် ဆွဲဆောင်မှုစကား):</span>
            </span>
            <div className="space-y-1.5">
              {viralData.viralHooks.map((hook, index) => (
                <div
                  key={index}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 font-burmese flex items-center justify-between gap-2"
                >
                  <p className="line-clamp-2">{hook}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hook, `hook_${index}`)}
                    className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white shrink-0"
                  >
                    {copiedKey === `hook_${index}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. YouTube SEO Description & Tags */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>YouTube SEO Description:</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(viralData.youtubeDescription, 'yt_desc')
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 flex items-center gap-1 font-burmese"
                >
                  {copiedKey === 'yt_desc' ? (
                    <span className="text-emerald-400">ကူးပြီးပါပြီ!</span>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>ကူးမည်</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={viralData.youtubeDescription}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-burmese leading-relaxed"
              />
            </div>

            {/* Tags & Hashtags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Keywords / Tags:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(viralData.tags, 'tags')}
                    className="text-[10px] text-cyan-400 hover:underline font-burmese"
                  >
                    {copiedKey === 'tags' ? 'ကူးပြီး' : 'Copy'}
                  </button>
                </div>
                <input
                  readOnly
                  type="text"
                  value={viralData.tags}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-pink-400" />
                    <span>Hashtags:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(viralData.hashtags, 'hashtags')}
                    className="text-[10px] text-pink-400 hover:underline font-burmese"
                  >
                    {copiedKey === 'hashtags' ? 'ကူးပြီး' : 'Copy'}
                  </button>
                </div>
                <input
                  readOnly
                  type="text"
                  value={viralData.hashtags}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                />
              </div>
            </div>

            {/* TikTok / Reels & Facebook Post */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                    <span>TikTok / Reels Caption:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(viralData.tiktokCaption, 'tiktok')
                    }
                    className="text-[10px] text-violet-400 hover:underline font-burmese"
                  >
                    {copiedKey === 'tiktok' ? 'ကူးပြီး' : 'Copy'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={viralData.tiktokCaption}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-burmese"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Facebook Post / Watch:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(viralData.facebookPost, 'facebook')
                    }
                    className="text-[10px] text-blue-400 hover:underline font-burmese"
                  >
                    {copiedKey === 'facebook' ? 'ကူးပြီး' : 'Copy'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={viralData.facebookPost}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-burmese"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
