import React, { useState, useEffect } from 'react';
import { audioEngine } from '../utils/audioSynth';
import { SceneSegment } from '../types/recap';
import {
  Mic,
  Play,
  Pause,
  Square,
  Volume2,
  Sliders,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

interface VoiceoverStudioProps {
  movieTitle: string;
  scenes: SceneSegment[];
  fullScriptText: string;
  defaultLanguage: 'burmese' | 'english';
}

export const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({
  movieTitle,
  scenes,
  fullScriptText,
  defaultLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number | null>(null);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');

  // Gemini Cloud TTS State
  const [isGeneratingCloudTts, setIsGeneratingCloudTts] = useState(false);
  const [cloudAudioUrl, setCloudAudioUrl] = useState<string | null>(null);
  const [cloudTtsStatus, setCloudTtsStatus] = useState<string | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      const voices = audioEngine.getAvailableVoices();
      setSystemVoices(voices);
      if (voices.length > 0 && !selectedVoiceUri) {
        const burmese = voices.find(
          (v) =>
            v.lang.startsWith('my') ||
            v.name.toLowerCase().includes('burmese') ||
            v.name.toLowerCase().includes('myanmar')
        );
        setSelectedVoiceUri(burmese ? burmese.voiceURI : voices[0].voiceURI);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const hasBurmeseVoice = systemVoices.some(
    (v) =>
      v.lang.startsWith('my') ||
      v.name.toLowerCase().includes('burmese') ||
      v.name.toLowerCase().includes('myanmar')
  );

  const handlePlayFull = () => {
    if (isPaused) {
      audioEngine.resumeSpeech();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const textToSpeak = scenes.length > 0
      ? scenes.map((s) => s.scriptMy).join(' ')
      : fullScriptText;

    if (!textToSpeak) {
      alert('အသံထွက်ရန် ဇာတ်လမ်းစာသား မရှိသေးပါ (No script text)');
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    setActiveSceneIndex(null);

    audioEngine.speakText(
      textToSpeak,
      defaultLanguage === 'burmese' ? 'my-MM' : 'en-US',
      speechSpeed,
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      }
    );
  };

  const handlePause = () => {
    audioEngine.pauseSpeech();
    setIsPaused(true);
  };

  const handleStop = () => {
    audioEngine.stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSceneIndex(null);
  };

  const handlePlayScene = (scene: SceneSegment, idx: number) => {
    audioEngine.stopSpeech();
    setIsPlaying(true);
    setIsPaused(false);
    setActiveSceneIndex(idx);

    audioEngine.speakText(
      scene.scriptMy || scene.scriptEn,
      defaultLanguage === 'burmese' ? 'my-MM' : 'en-US',
      speechSpeed,
      () => {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSceneIndex(null);
      }
    );
  };

  const handleGenerateCloudTts = async () => {
    const textToSpeak =
      scenes.length > 0
        ? scenes.map((s) => s.scriptMy).join(' ')
        : fullScriptText;

    if (!textToSpeak) {
      alert('အသံထုတ်လုပ်ရန် ဇာတ်လမ်းစာသား မရှိသေးပါ (No script text)');
      return;
    }

    setIsGeneratingCloudTts(true);
    setCloudTtsStatus('Gemini Cloud TTS စနစ်ဖြင့် အသံဖန်တီးနေပါသည်...');

    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak.slice(0, 800),
          voiceName: 'Kore',
          style: 'Cinematic, dramatic movie recap voiceover',
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.audioBase64) {
        const audioSrc = `data:${resData.mimeType || 'audio/wav'};base64,${resData.audioBase64}`;
        setCloudAudioUrl(audioSrc);
        setCloudTtsStatus('Gemini Neural Voiceover အောင်မြင်စွာ ထုတ်လုပ်ပြီးပါပြီ!');
      } else {
        setCloudTtsStatus(
          resData.error ||
            'Gemini TTS မရရှိနိုင်ပါ။ Browser Speech Synthesis ကို အသုံးပြုနိုင်ပါသည်။'
        );
      }
    } catch (err: any) {
      setCloudTtsStatus('TTS ဝန်ဆောင်မှု အမှားဖြစ်ပေါ်ခဲ့သည် (Network / API Key error)');
    } finally {
      setIsGeneratingCloudTts(false);
    }
  };

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-400" />
            <span>Voiceover Studio (အသံသွင်း / ဇာတ်လမ်းပြော အသံ)</span>
          </h3>
          <p className="text-xs text-slate-400 font-burmese">
            ဇာတ်လမ်းပြောစာသားအား အသံထွက် နားဆင်ခြင်းနှင့် ထိန်းချုပ်ခြင်း
          </p>
        </div>

        {/* Playback Transport Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying || isPaused ? (
            <button
              type="button"
              onClick={handlePlayFull}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all font-burmese"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'ဆက်ဖွင့်မည် (Resume)' : 'အပြည့်အစုံ ဖွင့်မည် (Play)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all font-burmese"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>ခေတ္တရပ်မည် (Pause)</span>
            </button>
          )}

          <button
            type="button"
            disabled={!isPlaying && !isPaused}
            onClick={handleStop}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 transition-colors"
            title="Stop playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Voice Status & Explanation Box */}
      <div
        className={`p-3 rounded-xl border text-xs leading-relaxed font-burmese flex items-start gap-2.5 ${
          hasBurmeseVoice
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
        }`}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          {hasBurmeseVoice ? (
            <span>
              <strong>မြန်မာဘာသာ Speech Voice ထောက်ပံ့ထားပါသည်:</strong> သင့်ဖုန်း/ကွန်ပျူတာပေါ်ရှိ Myanmar TTS Engine ဖြင့် အသံထွက်နိုင်ပါသည်။
            </span>
          ) : (
            <span>
              <strong>သတိပြုရန် (Burmese Voice Info):</strong> စက်အချို့ (Android / Windows) တွင် မြန်မာဘာသာ Speech Synthesis တိုက်ရိုက် မပါဝင်သေးနိုင်ပါ။ ထိုအခါ အင်္ဂလိပ်/ဒေသတွင်း အသံဖြင့် အစားထိုး အသံထွက်ပေးမည် ဖြစ်ပြီး စာသားကို မိမိကိုယ်တိုင် ဖတ်ကြား အသံသွင်းရန်အတွက်လည်း Script Viewer ကို သုံးနိုင်သလို၊ Gemini Cloud TTS ခလုတ်ဖြင့်လည်း Neural Voice ထုတ်လုပ်နိုင်ပါသည်။
            </span>
          )}
        </div>
      </div>

      {/* Cloud Gemini Neural TTS Option */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 font-burmese">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Gemini Neural Cloud TTS (သဘာဝကျသော လူသားအသံ):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">gemini-3.8-flash-lite-tts</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isGeneratingCloudTts}
            onClick={handleGenerateCloudTts}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition-all font-burmese disabled:opacity-50"
          >
            {isGeneratingCloudTts ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>အသံဖန်တီးနေသည်...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Cloud Neural Voiceover ထုတ်ယူမည်</span>
              </>
            )}
          </button>

          {cloudAudioUrl && (
            <audio controls src={cloudAudioUrl} className="h-8 w-full sm:w-64 accent-red-500" />
          )}
        </div>

        {cloudTtsStatus && (
          <p className="text-[11px] text-slate-400 font-burmese">{cloudTtsStatus}</p>
        )}
      </div>

      {/* Speed Slider */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 font-burmese">
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span>စကားပြောနှုန်း (Speech Speed):</span>
          </span>
          <span className="font-mono text-red-400 font-bold">{speechSpeed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.8"
          max="1.5"
          step="0.1"
          value={speechSpeed}
          onChange={(e) => setSpeechSpeed(Number(e.target.value))}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0.8x (Slow)</span>
          <span>1.0x (Normal)</span>
          <span>1.5x (Fast-Paced)</span>
        </div>
      </div>

      {/* Scene by Scene Voice Player */}
      {scenes.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 block font-burmese">
            ဇာတ်ဝင်ခန်းတစ်ခုချင်းစီ အသံနားဆင်ရန် (Scene by Scene):
          </span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                  activeSceneIndex === idx
                    ? 'bg-red-950/40 border-red-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="overflow-hidden space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-400 font-bold text-[11px]">
                      Scene {idx + 1}:
                    </span>
                    <span className="font-bold text-slate-200 font-burmese truncate">
                      {scene.titleMy}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-burmese line-clamp-1">
                    {scene.scriptMy}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlayScene(scene, idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all shrink-0 font-burmese ${
                    activeSceneIndex === idx && isPlaying
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{activeSceneIndex === idx && isPlaying ? 'ဖွင့်နေသည်' : 'ဖွင့်မည်'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
