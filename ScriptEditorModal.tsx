import React, { useState } from 'react';
import {
  X,
  Play,
  Volume2,
  Trash2,
  Plus,
  Clock,
  Sparkles,
  Check,
  Edit3,
  Layers,
  Square,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { SceneSegment } from '../types/recap';
import { audioEngine } from '../utils/audioSynth';

interface ScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: SceneSegment[];
  movieTitle: string;
  loglineMy: string;
  onSaveScenes: (scenes: SceneSegment[]) => void;
  onPreviewScene: (startTime: number, endTime: number) => void;
  videoDuration: number;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  isOpen,
  onClose,
  scenes: initialScenes,
  movieTitle,
  loglineMy,
  onSaveScenes,
  onPreviewScene,
  videoDuration,
}) => {
  const [scenes, setScenes] = useState<SceneSegment[]>(initialScenes);
  const [speakingSceneId, setSpeakingSceneId] = useState<string | null>(null);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleCopyFullScript = () => {
    const fullText = scenes
      .map(
        (sc, idx) =>
          `[Scene ${idx + 1} (${sc.startTime}s - ${sc.endTime}s) : ${sc.titleMy}]\n${sc.scriptMy}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyScene = (scene: SceneSegment) => {
    navigator.clipboard.writeText(scene.scriptMy);
    setCopiedSceneId(scene.id);
    setTimeout(() => setCopiedSceneId(null), 2000);
  };

  const handleUpdateScene = (id: string, updates: Partial<SceneSegment>) => {
    setScenes((prev) =>
      prev.map((sc) => (sc.id === id ? { ...sc, ...updates } : sc))
    );
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) {
      alert('အနည်းဆုံး ဇာတ်ဝင်ခန်းတစ်ခု လိုအပ်ပါသည် (Minimum 1 scene required)');
      return;
    }
    setScenes((prev) => prev.filter((sc) => sc.id !== id));
  };

  const handleAddScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newStart = lastScene ? Math.min(videoDuration - 5, lastScene.endTime) : 0;
    const newEnd = Math.min(videoDuration, newStart + 15);
    const newScene: SceneSegment = {
      id: 'scene_' + Date.now(),
      startTime: Math.round(newStart),
      endTime: Math.round(newEnd),
      titleMy: `ဇာတ်ဝင်ခန်း ${scenes.length + 1}`,
      titleEn: `Scene ${scenes.length + 1}`,
      scriptMy: 'ဒီအချိန်မှာတော့ အခြေအနေတွေက ပိုမိုဆိုးရွားလာခဲ့ပါပြီ...',
      scriptEn: 'At this critical moment, things became increasingly tense...',
      emotionalBeat: 'Suspense',
    };
    setScenes([...scenes, newScene]);
  };

  const handleSpeak = (scene: SceneSegment) => {
    if (speakingSceneId === scene.id) {
      window.speechSynthesis?.cancel();
      setSpeakingSceneId(null);
      return;
    }

    setSpeakingSceneId(scene.id);
    audioEngine.speakText(
      scene.scriptMy || scene.scriptEn,
      'my-MM',
      1.0,
      () => setSpeakingSceneId(null)
    );
  };

  const handleSaveAndProceed = () => {
    onSaveScenes(scenes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#121217] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#16161d] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>RECAP SCRIPT & TIMELINES</span>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded border border-red-500/30">
                  {scenes.length} Scenes
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-burmese -mt-0.5">
                ဇာတ်လမ်းပြောစာသားနှင့် ဇာတ်ဝင်ခန်းဖြတ်တောက်မှု ပြင်ဆင်ရန်
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFullScript}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors font-burmese"
              title="Copy all Burmese script to clipboard"
            >
              {copiedAll ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">ကူးပြီးပါပြီ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>စာသားအားလုံးကူးယူမည် (Copy)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hook / Logline Banner */}
        {loglineMy && (
          <div className="px-4 py-2.5 bg-red-950/30 border-b border-red-900/40 text-xs text-red-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-burmese text-red-400 block">
                အဓိက ဇာတ်လမ်းဆွဲဆောင်မှု (Hook):
              </span>
              <p className="font-burmese leading-relaxed text-zinc-200">{loglineMy}</p>
            </div>
          </div>
        )}

        {/* Scene List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className="bg-[#171720] rounded-xl border border-zinc-800 hover:border-zinc-700 p-3.5 space-y-3 transition-colors shadow-sm"
            >
              {/* Scene Title & Action Header */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={scene.titleMy}
                    onChange={(e) => handleUpdateScene(scene.id, { titleMy: e.target.value })}
                    className="bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-red-500 outline-none px-1 py-0.5 font-burmese"
                    placeholder="ဇာတ်ဝင်ခန်း အမည်"
                  />
                  {scene.emotionalBeat && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
                      {scene.emotionalBeat}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Preview Video Clip Button */}
                  <button
                    type="button"
                    onClick={() => onPreviewScene(scene.startTime, scene.endTime)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
                    title="Preview this video segment"
                  >
                    <Play className="w-2.5 h-2.5 fill-current text-red-400" />
                    <span>ဗီဒီယိုစမ်းဖွင့်</span>
                  </button>

                  {/* Listen Voiceover Button */}
                  <button
                    type="button"
                    onClick={() => handleSpeak(scene)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                      speakingSceneId === scene.id
                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    }`}
                    title="Listen to narration"
                  >
                    {speakingSceneId === scene.id ? (
                      <Square className="w-2.5 h-2.5 fill-current text-white" />
                    ) : (
                      <Volume2 className="w-2.5 h-2.5 text-zinc-300" />
                    )}
                    <span>{speakingSceneId === scene.id ? 'ရပ်မည်' : 'အသံနားဆင်'}</span>
                  </button>

                  {/* Copy Scene Script Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyScene(scene)}
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                    title="Copy this scene script"
                  >
                    {copiedSceneId === scene.id ? (
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteScene(scene.id)}
                    className="p-1 rounded bg-zinc-800/50 hover:bg-red-950/50 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Timestamp Controls */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-[11px] font-burmese">စတင်ချိန်:</span>
                  <input
                    type="number"
                    min="0"
                    max={scene.endTime - 1}
                    value={scene.startTime}
                    onChange={(e) =>
                      handleUpdateScene(scene.id, { startTime: Number(e.target.value) })
                    }
                    className="w-16 bg-zinc-800 text-white px-2 py-1 rounded border border-zinc-700 font-mono text-center outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500">sec</span>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-zinc-400 text-[11px] font-burmese">ပြီးဆုံးချိန်:</span>
                  <input
                    type="number"
                    min={scene.startTime + 1}
                    max={Math.floor(videoDuration)}
                    value={scene.endTime}
                    onChange={(e) =>
                      handleUpdateScene(scene.id, { endTime: Number(e.target.value) })
                    }
                    className="w-16 bg-zinc-800 text-white px-2 py-1 rounded border border-zinc-700 font-mono text-center outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500">sec</span>
                </div>
              </div>

              {/* Editable Burmese Script */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1 font-burmese">
                  မြန်မာဘာသာ ဇာတ်လမ်းပြောစာသား (Burmese Narration):
                </label>
                <textarea
                  rows={2}
                  value={scene.scriptMy}
                  onChange={(e) => handleUpdateScene(scene.id, { scriptMy: e.target.value })}
                  placeholder="ဒီဇာတ်ဝင်ခန်းအတွက် ဇာတ်လမ်းပြော စာသား ရိုက်ထည့်ပါ..."
                  className="w-full bg-zinc-900/90 text-xs text-white p-2.5 rounded-lg border border-zinc-700/80 outline-none focus:border-red-500 font-burmese leading-relaxed"
                />
              </div>

              {/* Optional English Subtitle */}
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-0.5">
                  English Subtitle / Translation:
                </label>
                <input
                  type="text"
                  value={scene.scriptEn}
                  onChange={(e) => handleUpdateScene(scene.id, { scriptEn: e.target.value })}
                  placeholder="English subtitle..."
                  className="w-full bg-zinc-900/60 text-xs text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-800 outline-none focus:border-red-500"
                />
              </div>
            </div>
          ))}

          {/* Add Scene Button */}
          <button
            type="button"
            onClick={handleAddScene}
            className="w-full py-2.5 border-2 border-dashed border-zinc-800 hover:border-red-500/50 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 flex items-center justify-center gap-1.5 transition-colors font-burmese"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ဇာတ်ဝင်ခန်းအသစ် ထပ်ထည့်မည် (Add Scene)</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#16161d] border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 font-burmese">
            စုစုပေါင်း ကြာချိန်:{' '}
            <span className="font-mono font-bold text-red-400">
              {scenes.reduce((acc, s) => acc + Math.max(0, s.endTime - s.startTime), 0)}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 font-burmese transition-colors"
            >
              ပယ်ဖျက်မည်
            </button>
            <button
              type="button"
              onClick={handleSaveAndProceed}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,31,61,0.4)] hover:brightness-110 flex items-center gap-1.5 font-burmese transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>အတည်ပြု၍ သိမ်းမည် (Confirm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
