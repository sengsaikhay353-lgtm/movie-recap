import React, { useState, useEffect, useRef } from 'react';
import { SavedScript } from '../types/recap';
import { generateSrt, downloadTextFile } from '../utils/subtitleUtils';
import {
  Folder,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Download,
  Upload,
  Clock,
  Sparkles,
  BookOpen,
  FileJson,
} from 'lucide-react';

interface ScriptLibraryProps {
  onLoadScript: (script: SavedScript) => void;
  currentScriptToSave?: {
    title: string;
    durationMinutes: number;
    language: string;
    fullScriptText: string;
    scenes: any[];
    logline: string;
  } | null;
}

const STORAGE_KEY = 'team_alpha_recap_library_v1';

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  onLoadScript,
  currentScriptToSave,
}) => {
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedScripts(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load scripts from localStorage:', err);
    }
  }, []);

  const saveToStorage = (updated: SavedScript[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedScripts(updated);
    } catch (err) {
      alert('Local storage is full or disabled. Could not save script.');
    }
  };

  const handleSaveCurrent = () => {
    if (!currentScriptToSave || !currentScriptToSave.fullScriptText) {
      alert('သိမ်းဆည်းရန် ဇာတ်လမ်းပြော စာသား မရှိသေးပါ (No script generated yet to save)');
      return;
    }

    const newScript: SavedScript = {
      id: 'script_' + Date.now(),
      title: currentScriptToSave.title || 'Untitled Movie Recap',
      createdAt: Date.now(),
      durationMinutes: currentScriptToSave.durationMinutes || 3,
      language: currentScriptToSave.language || 'Burmese',
      fullScriptText: currentScriptToSave.fullScriptText,
      scenes: currentScriptToSave.scenes || [],
      logline: currentScriptToSave.logline || '',
    };

    const updated = [newScript, ...savedScripts];
    saveToStorage(updated);
    setStatusMessage('ဇာတ်လမ်းပြောစာသားအား စာကြည့်တိုက်တွင် သိမ်းဆည်းပြီးပါပြီ! (Saved)');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleDelete = (id: string) => {
    if (confirm('ဤဇာတ်လမ်းအား စာကြည့်တိုက်မှ ဖျက်ရန် သေချာပါသလား? (Delete script?)')) {
      const updated = savedScripts.filter((s) => s.id !== id);
      saveToStorage(updated);
    }
  };

  const handleStartRename = (script: SavedScript) => {
    setEditingId(script.id);
    setEditingTitle(script.title);
  };

  const handleConfirmRename = (id: string) => {
    if (!editingTitle.trim()) return;
    const updated = savedScripts.map((s) =>
      s.id === id ? { ...s, title: editingTitle.trim() } : s
    );
    saveToStorage(updated);
    setEditingId(null);
  };

  // Export entire library as JSON
  const handleExportAllJson = () => {
    if (savedScripts.length === 0) {
      alert('Export ပြုလုပ်ရန် သိမ်းဆည်းထားသော ဇာတ်လမ်း မရှိပါ (No saved scripts to export)');
      return;
    }
    const jsonString = JSON.stringify(savedScripts, null, 2);
    downloadTextFile('team_alpha_scripts_backup.json', jsonString, 'application/json');
  };

  // Export single script as JSON
  const handleExportSingleJson = (script: SavedScript) => {
    const jsonString = JSON.stringify(script, null, 2);
    downloadTextFile(
      `${script.title.replace(/\s+/g, '_')}_data.json`,
      jsonString,
      'application/json'
    );
  };

  // Import scripts from JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedList: SavedScript[] = [];
        if (Array.isArray(parsed)) {
          importedList = parsed;
        } else if (parsed && parsed.title && parsed.fullScriptText) {
          importedList = [parsed];
        } else {
          alert('မမှန်ကန်သော JSON ဖိုင်ဖြစ်ပါသည် (Invalid Script JSON format)');
          return;
        }

        // Merge without duplicate IDs
        const existingIds = new Set(savedScripts.map((s) => s.id));
        const newItems = importedList.map((item, idx) => ({
          ...item,
          id: existingIds.has(item.id) ? `script_${Date.now()}_${idx}` : item.id,
          createdAt: item.createdAt || Date.now(),
        }));

        const merged = [...newItems, ...savedScripts];
        saveToStorage(merged);
        setStatusMessage(
          `JSON ဖိုင်မှ ဇာတ်လမ်း (${newItems.length}) ခု အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ! (Imported)`
        );
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (parseErr) {
        alert('JSON ဖိုင်ဖတ်ရှုရာတွင် အမှားဖြစ်ပေါ်ခဲ့သည် (Failed to parse JSON file)');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredScripts = savedScripts.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.logline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
            <Folder className="w-5 h-5 text-red-400" />
            <span>Script Library (ဇာတ်လမ်း စာကြည့်တိုက်)</span>
            <span className="text-xs font-mono bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.5 rounded-full">
              {savedScripts.length} Saved
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-burmese">
            ဖန်တီးထားသော ဇာတ်လမ်းများကို သိမ်းဆည်းခြင်း၊ ရှာဖွေခြင်း၊ JSON Export/Import ပြုလုပ်ခြင်း
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden JSON file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors font-burmese"
            title="Import Scripts from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllJson}
            disabled={savedScripts.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors font-burmese disabled:opacity-50"
            title="Export All Scripts to JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          {currentScriptToSave?.fullScriptText && (
            <button
              type="button"
              onClick={handleSaveCurrent}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all font-burmese"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ယခုဇာတ်လမ်းကို သိမ်းမည် (Save)</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-burmese">
          {statusMessage}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ရှာဖွေရန် ရုပ်ရှင်အမည် ရိုက်ထည့်ပါ... (Search saved scripts)"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-red-500 font-burmese"
        />
      </div>

      {/* Script List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredScripts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-medium text-slate-400 font-burmese">
              {searchQuery ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော ဇာတ်လမ်း မရှိပါ' : 'သိမ်းဆည်းထားသော ဇာတ်လမ်း မရှိသေးပါ'}
            </p>
            <p className="text-[11px] text-slate-600 font-burmese">
              ဇာတ်လမ်း ထုတ်လုပ်ပြီးပါက "ယခုဇာတ်လမ်းကို သိမ်းမည်" ခလုတ်ဖြင့် သိမ်းဆည်းနိုင်ပါသည်
            </p>
          </div>
        ) : (
          filteredScripts.map((script) => (
            <div
              key={script.id}
              className="bg-slate-950/90 border border-slate-800 hover:border-red-500/40 rounded-xl p-3.5 space-y-2 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                {editingId === script.id ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="bg-slate-900 border border-red-500 text-xs text-white px-2 py-1 rounded font-burmese flex-1 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmRename(script.id)}
                      className="p-1 rounded bg-emerald-600 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded bg-slate-800 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-200 truncate font-burmese">
                      {script.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleStartRename(script)}
                      className="text-slate-500 hover:text-slate-300 p-0.5"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(script.createdAt).toLocaleDateString()}
                </span>
              </div>

              {script.logline && (
                <p className="text-[11px] text-slate-400 font-burmese line-clamp-1">
                  {script.logline}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs flex-wrap gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {script.scenes?.length || 0} Scenes • {script.durationMinutes}m • {script.language}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Load to editor */}
                  <button
                    type="button"
                    onClick={() => onLoadScript(script)}
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 text-[11px] font-semibold border border-red-800/40 transition-colors font-burmese"
                  >
                    ဖွင့်မည် (Load)
                  </button>

                  {/* Download TXT */}
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        `${script.title.replace(/\s+/g, '_')}_script.txt`,
                        script.fullScriptText
                      )
                    }
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    title="Download .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Download SRT */}
                  {script.scenes && script.scenes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const srt = generateSrt(script.scenes, 'burmese');
                        downloadTextFile(
                          `${script.title.replace(/\s+/g, '_')}_subtitles.srt`,
                          srt
                        );
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-800"
                      title="Download .srt subtitles"
                    >
                      SRT
                    </button>
                  )}

                  {/* Download single JSON */}
                  <button
                    type="button"
                    onClick={() => handleExportSingleJson(script)}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800"
                    title="Export single script JSON"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(script.id)}
                    className="p-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
