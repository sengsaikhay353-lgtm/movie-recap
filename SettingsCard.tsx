import React, { useState } from 'react';
import {
  Video,
  Mic,
  Wand2,
  Sliders,
  Volume2,
  VolumeX,
  Type,
  Shield,
  Layers,
  Sparkles,
  Music,
  Check,
  Eye,
  Play,
  Square,
  Upload,
} from 'lucide-react';
import {
  RecapSettings,
  AspectRatio,
  Resolution,
  SubtitleLanguage,
  SubtitlePosition,
  VoiceTone,
  BgmStyle,
} from '../types/recap';
import { audioEngine } from '../utils/audioSynth';

interface SettingsCardProps {
  settings: RecapSettings;
  onChange: (updated: Partial<RecapSettings>) => void;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ settings, onChange }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'voice' | 'effects'>('video');
  const [isPlayingBgmSample, setIsPlayingBgmSample] = useState(false);
  const [isSpeakingSample, setIsSpeakingSample] = useState(false);

  const durationOptions: Array<'1' | '3' | '5' | '10' | '15' | '20' | 'custom'> = [
    '1',
    '3',
    '5',
    '10',
    '15',
    '20',
    'custom',
  ];

  const aspectRatios: Array<{ id: AspectRatio; label: string; desc: string }> = [
    { id: '9:16', label: '9:16', desc: 'TikTok / Shorts' },
    { id: '16:9', label: '16:9', desc: 'YouTube Widescreen' },
    { id: '1:1', label: '1:1', desc: 'Square / Feed' },
    { id: '3:4', label: '3:4', desc: 'Portrait' },
  ];

  const resolutions: Array<{ id: Resolution; label: string; sub: string }> = [
    { id: '1080p', label: '1080p', sub: 'FHD High' },
    { id: '720p', label: '720p', sub: 'HD Standard' },
    { id: '480p', label: '480p', sub: 'Fast Render' },
  ];

  const subtitleColors = [
    { hex: '#FFE600', name: 'Yellow (အဝါ)' },
    { hex: '#FFFFFF', name: 'White (အဖြူ)' },
    { hex: '#00E5FF', name: 'Cyan (အပြာနု)' },
    { hex: '#FF2A4D', name: 'Red (နီ)' },
  ];

  // Test BGM sample playback
  const toggleBgmSample = () => {
    if (isPlayingBgmSample) {
      audioEngine.stopBgm();
      setIsPlayingBgmSample(false);
    } else {
      audioEngine.startBgm(settings.bgmStyle, settings.bgmVolume);
      setIsPlayingBgmSample(true);
    }
  };

  // Test Voice sample playback
  const testVoiceSample = () => {
    if (isSpeakingSample) {
      window.speechSynthesis?.cancel();
      setIsSpeakingSample(false);
      return;
    }

    setIsSpeakingSample(true);
    const sampleText =
      settings.narrationLanguage === 'burmese'
        ? 'ဒီဇာတ်လမ်းကတော့ မထင်မှတ်ထားတဲ့ အလှည့်အပြောင်းတွေနဲ့ စိတ်လှုပ်ရှားဖွယ် ဇာတ်လမ်းတစ်ပုဒ်ဖြစ်ပါတယ်။'
        : 'This gripping movie story takes an unexpected turn when mystery unfolds.';

    audioEngine.speakText(
      sampleText,
      settings.narrationLanguage === 'burmese' ? 'my-MM' : 'en-US',
      settings.speechSpeed,
      () => setIsSpeakingSample(false)
    );
  };

  return (
    <div className="w-full bg-slate-950/70 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* 3 Horizontal Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 border-b border-slate-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'video'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video</span>
          <span className="text-[10px] opacity-75 font-burmese">(ဗီဒီယို)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'voice'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice</span>
          <span className="text-[10px] opacity-75 font-burmese">(အသံ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('effects')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'effects'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Effects</span>
          <span className="text-[10px] opacity-75 font-burmese">(အထူးပြု)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4">
        {/* ================= VIDEO TAB ================= */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            {/* Recap Duration Preset */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                  <span>Recap Duration</span>
                  <span className="text-zinc-500 font-burmese text-[11px]">
                    (ဇာတ်လမ်းတို ကြာချိန်)
                  </span>
                </label>
                <span className="text-xs font-mono font-bold text-red-400">
                  {settings.durationPreset === 'custom'
                    ? `${settings.customDurationMinutes} min`
                    : `${settings.durationPreset} min`}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {durationOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange({ durationPreset: opt })}
                    className={`py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                      settings.durationPreset === opt
                        ? 'bg-red-500/20 text-red-400 border-red-500 shadow-[0_0_8px_rgba(255,31,61,0.3)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {opt === 'custom' ? 'Custom' : `${opt}m`}
                  </button>
                ))}
              </div>

              {settings.durationPreset === 'custom' && (
                <div className="mt-2.5 p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>စိတ်ကြိုက်ကြာချိန် ရွေးရန်:</span>
                    <span className="font-mono text-red-400 font-bold">
                      {settings.customDurationMinutes} မိနစ်
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.customDurationMinutes}
                    onChange={(e) =>
                      onChange({ customDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Output Aspect Ratio */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mb-1.5">
                <span>Output Ratio</span>
                <span className="text-zinc-500 font-burmese text-[11px]">
                  (ဗီဒီယို အချိုးအစား)
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => onChange({ aspectRatio: ratio.id })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      settings.aspectRatio === ratio.id
                        ? 'bg-red-500/15 border-red-500 text-white shadow-[0_0_10px_rgba(255,31,61,0.25)]'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-zinc-100">
                        {ratio.label}
                      </span>
                      {settings.aspectRatio === ratio.id && (
                        <Check className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {ratio.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Resolution */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mb-1.5">
                <span>Output Resolution</span>
                <span className="text-zinc-500 font-burmese text-[11px]">
                  (ကြည်လင်ပြတ်သားမှု)
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {resolutions.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => onChange({ resolution: res.id })}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      settings.resolution === res.id
                        ? 'bg-red-500/15 border-red-500 text-white'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-bold font-mono text-zinc-100">
                      {res.label}
                    </p>
                    <p className="text-[10px] text-zinc-500">{res.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Blur Box (Blur Bar) Toggle & Slider */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-red-400" />
                    <span>Blur Box (မကြည်အောင်ဖုံးအုပ်ခြင်း)</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-burmese mt-0.5">
                    မူရင်းစာတန်း သို့မဟုတ် တံဆိပ်ဟောင်းများကို ဝါးသွားစေရန် ဖုံးအုပ်ပေးသည်
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ enableBlurBox: !settings.enableBlurBox })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    settings.enableBlurBox ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.enableBlurBox ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.enableBlurBox && (
                <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Blur Strength (ဝါးမှုအဆင့်):</span>
                    <span className="font-mono text-red-400 font-bold">
                      {settings.blurBoxIntensity}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={settings.blurBoxIntensity}
                    onChange={(e) =>
                      onChange({ blurBoxIntensity: Number(e.target.value) })
                    }
                    className="w-full"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-zinc-400 font-burmese">နေရာ:</span>
                    <button
                      type="button"
                      onClick={() => onChange({ blurBoxPosition: 'bottom-bar' })}
                      className={`px-2 py-0.5 text-[10px] rounded border ${
                        settings.blurBoxPosition === 'bottom-bar'
                          ? 'bg-red-500/20 text-red-300 border-red-500'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      အောက်ခြေ (Bottom Bar)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ blurBoxPosition: 'top-bar' })}
                      className={`px-2 py-0.5 text-[10px] rounded border ${
                        settings.blurBoxPosition === 'top-bar'
                          ? 'bg-red-500/20 text-red-300 border-red-500'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      အပေါ်ပိုင်း (Top Bar)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VOICE TAB ================= */}
        {activeTab === 'voice' && (
          <div className="space-y-4">
            {/* Narration Language */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mb-1.5">
                <span>Narration Language</span>
                <span className="text-zinc-500 font-burmese text-[11px]">
                  (ဇာတ်လမ်းပြော ဘာသာစကား)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ narrationLanguage: 'burmese' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.narrationLanguage === 'burmese'
                      ? 'bg-red-500/15 border-red-500 text-white shadow-[0_0_10px_rgba(255,31,61,0.25)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-burmese">
                      မြန်မာဘာသာ (Burmese)
                    </span>
                    {settings.narrationLanguage === 'burmese' && (
                      <Check className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-burmese mt-0.5">
                    သဘာဝကျကျ ရုပ်ရှင်ပြောဟန်
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ narrationLanguage: 'english' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.narrationLanguage === 'english'
                      ? 'bg-red-500/15 border-red-500 text-white shadow-[0_0_10px_rgba(255,31,61,0.25)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      English (အင်္ဂလိပ်)
                    </span>
                    {settings.narrationLanguage === 'english' && (
                      <Check className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    International Movie Recap
                  </p>
                </button>
              </div>
            </div>

            {/* Voice Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mb-1.5">
                <span>Voice Tone & Style</span>
                <span className="text-zinc-500 font-burmese text-[11px]">
                  (အသံလေသံ ပုံစံ)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dramatic', label: 'Dramatic (ဇာတ်လမ်းဟန်)', desc: 'Emotional Storyteller' },
                  { id: 'thriller', label: 'Thriller (သည်းထိတ်ရင်ဖို)', desc: 'Fast & Suspenseful' },
                  { id: 'deep', label: 'Deep Male (အသံဩဇာ)', desc: 'Movie Trailer Voice' },
                  { id: 'energetic', label: 'Energetic (သွက်လက်)', desc: 'Exciting & Fast Paced' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => onChange({ voiceTone: tone.id as VoiceTone })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      settings.voiceTone === tone.id
                        ? 'bg-red-500/15 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-semibold text-zinc-200 font-burmese">
                      {tone.label}
                    </p>
                    <p className="text-[10px] text-zinc-500">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Narration Speed Slider + Test Speech */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1 font-burmese">
                  <span>စကားပြောနှုန်း (Speech Speed):</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-400 font-bold">
                    {settings.speechSpeed.toFixed(1)}x
                  </span>
                  <button
                    type="button"
                    onClick={testVoiceSample}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium border border-zinc-700 flex items-center gap-1 font-burmese"
                  >
                    {isSpeakingSample ? (
                      <>
                        <Square className="w-2.5 h-2.5 text-red-400 fill-current" />
                        <span>ရပ်မည်</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 text-red-400 fill-current" />
                        <span>အသံစမ်းရန်</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={settings.speechSpeed}
                onChange={(e) => onChange({ speechSpeed: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>0.8x (အေးဆေး)</span>
                <span>1.0x (ပုံမှန်)</span>
                <span>1.5x (သွက်လက်)</span>
              </div>
            </div>

            {/* Background Music (BGM) Panel */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Background Music (BGM နောက်ခံတေး)
                    </p>
                    <p className="text-[10px] text-zinc-400 font-burmese">
                      မူပိုင်ခွင့်လွတ် ရုပ်ရှင်နောက်ခံတေးဂီတ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ enableBgm: !settings.enableBgm })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    settings.enableBgm ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.enableBgm ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.enableBgm && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                  {/* BGM Style Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 font-burmese">တေးပုံစံ:</span>
                    <select
                      value={settings.bgmStyle}
                      onChange={(e) => onChange({ bgmStyle: e.target.value as BgmStyle })}
                      className="bg-zinc-800 text-xs text-white px-2.5 py-1 rounded-lg border border-zinc-700 outline-none"
                    >
                      <option value="suspense">Suspense Thriller (သည်းထိတ်)</option>
                      <option value="action">Action Pulse (လှုပ်ရှားမှု)</option>
                      <option value="drama">Emotional Drama (ဒရာမာ)</option>
                      <option value="mystery">Dark Mystery (လျှို့ဝှက်ဆန်းကြယ်)</option>
                      <option value="chill">Chill Lo-Fi (သက်တောင့်သက်သာ)</option>
                    </select>
                    {/* Live Test BGM Button */}
                    <button
                      type="button"
                      onClick={toggleBgmSample}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${
                        isPlayingBgmSample
                          ? 'bg-red-600 text-white border-red-500 animate-pulse'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {isPlayingBgmSample ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      <span>{isPlayingBgmSample ? 'ရပ်မည်' : 'ဖွင့်စမ်း'}</span>
                    </button>
                  </div>

                  {/* BGM Volume Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>BGM အသံပမာဏ (Volume):</span>
                      <span className="font-mono text-red-400 font-bold">
                        {settings.bgmVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgmVolume}
                      onChange={(e) => onChange({ bgmVolume: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Original Video Volume */}
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>မူရင်းဗီဒီယိုအသံ (Original Audio):</span>
                      <span className="font-mono text-zinc-300 font-bold">
                        {settings.originalVideoVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.originalVideoVolume}
                      onChange={(e) => onChange({ originalVideoVolume: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= EFFECTS TAB ================= */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Subtitle Language Dropdown */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mb-1.5">
                <span>Subtitles (စာတန်းထိုး)</span>
                <span className="text-zinc-500 font-burmese text-[11px]">
                  (ရွေးချယ်ရန်)
                </span>
              </label>

              <select
                value={settings.subtitleLang}
                onChange={(e) => onChange({ subtitleLang: e.target.value as SubtitleLanguage })}
                className="w-full bg-zinc-900 text-xs text-white px-3 py-2 rounded-xl border border-zinc-800 outline-none focus:border-red-500 transition-colors"
              >
                <option value="none">No Subtitles (စာတန်းမထိုးပါ)</option>
                <option value="burmese">Burmese Only (မြန်မာစာတန်း သီးသန့်)</option>
                <option value="english">English Only (အင်္ဂလိပ်စာတန်း သီးသန့်)</option>
                <option value="bilingual">Bilingual (မြန်မာ + အင်္ဂလိပ် နှစ်မျိုးစလုံး)</option>
              </select>
            </div>

            {settings.subtitleLang !== 'none' && (
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                {/* Font Size */}
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>စာလုံးအရွယ်အစား (Font Size):</span>
                    <span className="font-mono text-red-400 font-bold">
                      {settings.subtitleFontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="36"
                    value={settings.subtitleFontSize}
                    onChange={(e) =>
                      onChange({ subtitleFontSize: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                {/* Subtitle Color */}
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1.5 font-burmese">
                    စာလုံးအရောင် (Color):
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {subtitleColors.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onChange({ subtitleColor: c.hex })}
                        className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all ${
                          settings.subtitleColor === c.hex
                            ? 'border-white bg-zinc-800'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/40"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] text-zinc-300 truncate">
                          {c.hex === '#FFE600' ? 'Yellow' : c.hex === '#FFFFFF' ? 'White' : c.hex === '#00E5FF' ? 'Cyan' : 'Red'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Outline & Position */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="outlineCheck"
                      checked={settings.subtitleOutline}
                      onChange={(e) => onChange({ subtitleOutline: e.target.checked })}
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <label
                      htmlFor="outlineCheck"
                      className="text-xs text-zinc-300 font-burmese cursor-pointer"
                    >
                      အနက်ရောင် ဘောင်လိုင်းထည့်မည် (Outline)
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    {(['bottom', 'center', 'top'] as SubtitlePosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => onChange({ subtitlePosition: pos })}
                        className={`px-2 py-0.5 text-[10px] rounded uppercase font-mono border ${
                          settings.subtitlePosition === pos
                            ? 'bg-red-500/20 text-red-300 border-red-500'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Watermark Section */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Watermark (လိုင်းတံဆိပ် / ချန်နယ်အမည်)
                    </p>
                    <p className="text-[10px] text-zinc-400 font-burmese">
                      ဗီဒီယိုခိုးယူမှု ကာကွယ်ရန် တံဆိပ်ထည့်ပါ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ enableWatermark: !settings.enableWatermark })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    settings.enableWatermark ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.enableWatermark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.enableWatermark && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                  {/* Text Watermark Input */}
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1 font-burmese">
                      ချန်နယ်အမည် စာသား (Text):
                    </span>
                    <input
                      type="text"
                      value={settings.watermarkText}
                      onChange={(e) => onChange({ watermarkText: e.target.value })}
                      placeholder="@TeamAlphaRecap"
                      className="w-full bg-zinc-800 text-xs text-white px-3 py-1.5 rounded-lg border border-zinc-700 outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Watermark Opacity */}
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>ကြည်လင်မှုနှုန်း (Opacity):</span>
                      <span className="font-mono text-red-400 font-bold">
                        {settings.watermarkOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={settings.watermarkOpacity}
                      onChange={(e) =>
                        onChange({ watermarkOpacity: Number(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Watermark Position */}
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1 font-burmese">
                      တံဆိပ်နေရာ:
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'top-right', label: 'Top-R' },
                        { id: 'top-left', label: 'Top-L' },
                        { id: 'bottom-right', label: 'Bot-R' },
                        { id: 'bottom-left', label: 'Bot-L' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => onChange({ watermarkPosition: pos.id as any })}
                          className={`py-1 text-[10px] font-mono rounded border ${
                            settings.watermarkPosition === pos.id
                              ? 'bg-red-500/20 text-red-300 border-red-500'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
