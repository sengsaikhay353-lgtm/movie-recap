import React, { useRef, useState } from 'react';
import {
  Plus,
  Video,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  FileVideo,
  UploadCloud,
  X,
} from 'lucide-react';
import { VideoMetadata } from '../types/recap';

interface VideoUploadPanelProps {
  metadata: VideoMetadata | null;
  onVideoLoaded: (meta: VideoMetadata) => void;
  onClearVideo: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VideoUploadPanel: React.FC<VideoUploadPanelProps> = ({
  metadata,
  onVideoLoaded,
  onClearVideo,
  videoRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext)) || file.type.startsWith('video/');

    if (!isValid) {
      setErrorMessage('ဖိုင်အမျိုးအစား မမှန်ကန်ပါ (MP4, MOV သို့မဟုတ် WebM သာ လက်ခံပါသည်)');
      return;
    }

    // 2GB safety limit for personal browser memory
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setErrorMessage('ဖိုင်ဆိုဒ် ကြီးလွန်းပါသည် (အများဆုံး 2GB အထိ သာ လက်ခံပါသည်)');
      return;
    }

    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);

    // Create temporary video element to extract dimensions & duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      const width = tempVideo.videoWidth;
      const height = tempVideo.videoHeight;
      const ratio = `${width}:${height}`;

      onVideoLoaded({
        file,
        objectUrl,
        name: file.name,
        sizeBytes: file.size,
        duration,
        width,
        height,
        aspectRatio: ratio,
      });

      setIsLoading(false);
    };

    tempVideo.onerror = () => {
      setIsLoading(false);
      setErrorMessage('ဗီဒီယိုဖိုင်အား ဖွင့်မရပါ (Failed to parse video metadata)');
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Quick Demo Video option (loads a free sample trailer for instant testing)
  const loadSampleVideo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Big Buck Bunny sample trailer for instant testing
      const sampleUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const sampleFile = new File([blob], 'Action_Movie_Sample.mp4', { type: 'video/mp4' });
      handleFile(sampleFile);
    } catch (_) {
      setIsLoading(false);
      setErrorMessage('နမူနာဗီဒီယို ဖွင့်မရပါ (Please upload your local file)');
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {!metadata ? (
        // Empty Dropzone State matching user HTML
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/60 group ${
            isDragging
              ? 'border-violet-500 bg-violet-950/20'
              : 'border-slate-700 hover:border-violet-500'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="w-10 h-10 text-violet-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <p className="text-sm font-medium text-slate-200">
              Drag & drop your video here
            </p>
            <p className="text-xs text-slate-400 font-burmese mt-0.5">
              ဗီဒီယို တင်ရန် နှိပ်ပါ (သို့) ဖိုင်ကို ဆွဲထည့်ပါ
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports MP4, MKV, MOV
            </p>

            {/* Quick Demo Video Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadSampleVideo();
              }}
              className="mt-3.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>နမူနာ ဗီဒီယို စမ်းသပ်ရန် (Load Sample Video)</span>
            </button>
          </div>
        </div>
      ) : (
        // File Loaded State
        <div className="space-y-3">
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileVideo className="w-6 h-6 text-violet-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-sm font-medium truncate text-slate-200 block">
                  {metadata.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {metadata.width}×{metadata.height} • {formatDuration(metadata.duration)} • {formatSize(metadata.sizeBytes)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearVideo}
              className="text-red-400 hover:text-red-300 text-sm p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Video Player */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center group">
            <video
              ref={videoRef}
              src={metadata.objectUrl}
              playsInline
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-violet-600 transition-all duration-200 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mt-2 p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-burmese">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
