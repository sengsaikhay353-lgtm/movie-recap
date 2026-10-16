import { AspectRatio, Resolution, RecapSettings, SceneSegment, RenderProgress } from '../types/recap';
import { audioEngine } from './audioSynth';

export interface ExportCallbacks {
  onProgress: (progress: RenderProgress) => void;
  onError: (err: string) => void;
  onSuccess: (url: string, sizeMb: number) => void;
}

export class VideoProcessingEngine {
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Extract video frame thumbnails at regular intervals for AI analysis
   */
  public async extractKeyframes(
    videoEl: HTMLVideoElement,
    count: number = 5
  ): Promise<Array<{ timestamp: number; base64: string }>> {
    const duration = videoEl.duration;
    if (!duration || duration <= 0) return [];

    const keyframes: Array<{ timestamp: number; base64: string }> = [];
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const step = duration / (count + 1);
    const originalTime = videoEl.currentTime;

    for (let i = 1; i <= count; i++) {
      const targetTime = step * i;
      await this.seekVideo(videoEl, targetTime);
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.65);
      keyframes.push({ timestamp: Math.round(targetTime), base64 });
    }

    videoEl.currentTime = originalTime;
    return keyframes;
  }

  private seekVideo(videoEl: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        resolve();
      };
      videoEl.addEventListener('seeked', onSeeked);
      videoEl.currentTime = time;
    });
  }

  /**
   * Determine canvas resolution based on aspect ratio and resolution setting
   */
  public getCanvasDimensions(ratio: AspectRatio, resolution: Resolution): { width: number; height: number } {
    const isMobileFriendly = window.innerWidth < 768;
    // Android chrome optimization: use optimized raster dimensions for smooth encoding
    let scale = 1;
    if (resolution === '1080p') scale = 1;
    else if (resolution === '720p') scale = 0.666;
    else scale = 0.444; // 480p

    if (isMobileFriendly && resolution === '1080p') {
      // In mobile browser memory constraints, scale slightly to prevent tab crash
      scale = 0.666;
    }

    switch (ratio) {
      case '9:16':
        return {
          width: Math.round(1080 * scale),
          height: Math.round(1920 * scale),
        };
      case '1:1':
        return {
          width: Math.round(1080 * scale),
          height: Math.round(1080 * scale),
        };
      case '3:4':
        return {
          width: Math.round(1080 * scale),
          height: Math.round(1440 * scale),
        };
      case '16:9':
      default:
        return {
          width: Math.round(1920 * scale),
          height: Math.round(1080 * scale),
        };
    }
  }

  /**
   * Real video render & export engine
   */
  public async renderRecapVideo(
    sourceVideoEl: HTMLVideoElement,
    scenes: SceneSegment[],
    settings: RecapSettings,
    callbacks: ExportCallbacks
  ): Promise<void> {
    this.isCancelled = false;

    if (!scenes || scenes.length === 0) {
      callbacks.onError('ကျေးဇူးပြု၍ အနည်းဆုံး ဇာတ်ဝင်ခန်းတစ်ခု ရွေးချယ်ပါ (No scenes selected)');
      return;
    }

    const { width, height } = this.getCanvasDimensions(settings.aspectRatio, settings.resolution);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      callbacks.onError('Browser Canvas 2D Context could not be initialized');
      return;
    }

    // Prepare Watermark Image if present
    let watermarkImg: HTMLImageElement | null = null;
    if (settings.enableWatermark && settings.watermarkImage) {
      watermarkImg = new Image();
      watermarkImg.src = settings.watermarkImage;
      await new Promise((res) => {
        if (!watermarkImg) return res(null);
        watermarkImg.onload = () => res(null);
        watermarkImg.onerror = () => res(null);
      });
    }

    // Audio mixing context setup
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const dest = audioCtx.createMediaStreamDestination();

    // Source video audio hook
    let sourceNode: MediaElementAudioSourceNode | null = null;
    try {
      sourceNode = audioCtx.createMediaElementSource(sourceVideoEl);
      const videoGain = audioCtx.createGain();
      videoGain.gain.setValueAtTime(settings.originalVideoVolume / 100, audioCtx.currentTime);
      sourceNode.connect(videoGain);
      videoGain.connect(dest);
    } catch (_) {
      // In case element is already connected or has CORS issue
    }

    // Background music procedural track
    let bgmGain: GainNode | null = null;
    let bgmOsc: OscillatorNode | null = null;
    if (settings.enableBgm && settings.bgmVolume > 0) {
      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime((settings.bgmVolume / 100) * 0.15, audioCtx.currentTime);

      bgmOsc = audioCtx.createOscillator();
      bgmOsc.type = 'sawtooth';
      bgmOsc.frequency.setValueAtTime(settings.bgmStyle === 'action' ? 65.41 : 55, audioCtx.currentTime);

      const bgmFilter = audioCtx.createBiquadFilter();
      bgmFilter.type = 'lowpass';
      bgmFilter.frequency.setValueAtTime(150, audioCtx.currentTime);

      bgmOsc.connect(bgmFilter);
      bgmFilter.connect(bgmGain);
      bgmGain.connect(dest);
      bgmOsc.start();
    }

    // Combine Video Canvas Stream + Mixed Audio Stream
    const canvasStream = canvas.captureStream(30);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }

    // Select supported MediaRecorder MIME type
    const mimeTypes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMime = type;
        break;
      }
    }

    if (!selectedMime) {
      callbacks.onError('Your browser does not support MediaRecorder video capture.');
      return;
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: settings.resolution === '1080p' ? 5000000 : 2500000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.start(250);

    // Calculate total duration
    const totalRecapSeconds = scenes.reduce((acc, sc) => acc + Math.max(0.5, sc.endTime - sc.startTime), 0);
    let elapsedSeconds = 0;
    const startTimeRecord = performance.now();

    // Iterate through scenes sequentially
    try {
      for (let sIndex = 0; sIndex < scenes.length; sIndex++) {
        if (this.isCancelled) {
          mediaRecorder.stop();
          callbacks.onError('Rendering cancelled by user.');
          return;
        }

        const scene = scenes[sIndex];
        const sceneDuration = Math.max(0.5, scene.endTime - scene.startTime);

        // Seek video to scene start
        await this.seekVideo(sourceVideoEl, scene.startTime);
        await sourceVideoEl.play();

        // Scene frame loop
        const sceneStartStamp = performance.now();
        while (performance.now() - sceneStartStamp < sceneDuration * 1000) {
          if (this.isCancelled) {
            sourceVideoEl.pause();
            mediaRecorder.stop();
            callbacks.onError('Rendering cancelled.');
            return;
          }

          // 1. Draw Background & Video Frame
          this.drawVideoFrame(ctx, sourceVideoEl, width, height, settings.aspectRatio);

          // 2. Draw Blur Box if enabled
          if (settings.enableBlurBox) {
            this.drawBlurBox(ctx, width, height, settings);
          }

          // 3. Draw Subtitles
          if (settings.subtitleLang !== 'none') {
            this.drawSubtitles(ctx, width, height, scene, settings);
          }

          // 4. Draw Watermark
          if (settings.enableWatermark) {
            this.drawWatermark(ctx, width, height, settings, watermarkImg);
          }

          // Calculate progress
          const currentSceneElapsed = (performance.now() - sceneStartStamp) / 1000;
          const currentTotalElapsed = elapsedSeconds + currentSceneElapsed;
          const progressPercent = Math.min(99, Math.round((currentTotalElapsed / totalRecapSeconds) * 100));
          const actualDurationSpent = (performance.now() - startTimeRecord) / 1000;
          const remainingSec = Math.max(
            0,
            Math.round((actualDurationSpent / Math.max(1, currentTotalElapsed)) * (totalRecapSeconds - currentTotalElapsed))
          );

          callbacks.onProgress({
            status: 'rendering',
            progressPercent,
            currentSceneIndex: sIndex + 1,
            totalScenes: scenes.length,
            message: `Rendering Scene ${sIndex + 1}/${scenes.length} (${Math.round(currentSceneElapsed)}s/${Math.round(sceneDuration)}s)`,
            messageMy: `ဇာတ်ဝင်ခန်း (${sIndex + 1}/${scenes.length}) ကို ဗီဒီယိုအဖြစ် ထုတ်လုပ်နေပါသည်...`,
            estimatedSecondsRemaining: remainingSec,
          });

          // Yield to next animation frame
          await new Promise((r) => requestAnimationFrame(r));
        }

        sourceVideoEl.pause();
        elapsedSeconds += sceneDuration;
      }

      // Finish recording
      callbacks.onProgress({
        status: 'encoding',
        progressPercent: 99,
        currentSceneIndex: scenes.length,
        totalScenes: scenes.length,
        message: 'Finalizing MP4 video export container...',
        messageMy: 'ဗီဒီယိုဖိုင်အား အပြီးသတ် ချုံ့တွဲနေပါသည်...',
        estimatedSecondsRemaining: 2,
      });

      mediaRecorder.onstop = () => {
        if (bgmOsc) {
          try {
            bgmOsc.stop();
          } catch (_) {}
        }

        const finalBlob = new Blob(recordedChunks, { type: selectedMime });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const sizeMb = Number((finalBlob.size / (1024 * 1024)).toFixed(2));

        callbacks.onProgress({
          status: 'completed',
          progressPercent: 100,
          currentSceneIndex: scenes.length,
          totalScenes: scenes.length,
          message: 'Video rendering completed successfully!',
          messageMy: 'ဗီဒီယို အောင်မြင်စွာ ထုတ်လုပ်ပြီးပါပြီ!',
          estimatedSecondsRemaining: 0,
          downloadUrl,
          outputSizeMb: sizeMb,
        });

        callbacks.onSuccess(downloadUrl, sizeMb);
      };

      mediaRecorder.stop();
    } catch (err: any) {
      callbacks.onError(err?.message || 'Error occurred while rendering frames');
    }
  }

  private drawVideoFrame(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    canvasW: number,
    canvasH: number,
    ratio: AspectRatio
  ): void {
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;

    if (ratio === '9:16') {
      // Modern vertical video recap layout:
      // Blurred background video + centered sharp video frame
      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.4)';
      const bgScale = Math.max(canvasW / vw, canvasH / vh);
      const bgW = vw * bgScale;
      const bgH = vh * bgScale;
      const bgX = (canvasW - bgW) / 2;
      const bgY = (canvasH - bgH) / 2;
      ctx.drawImage(video, bgX, bgY, bgW, bgH);
      ctx.restore();

      // Sharp centered foreground
      const fgScale = canvasW / vw;
      const fgW = canvasW;
      const fgH = vh * fgScale;
      const fgY = (canvasH - fgH) / 2;

      // Draw subtle drop shadow for cinematic punch
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 16;
      ctx.drawImage(video, 0, fgY, fgW, fgH);
      ctx.restore();
    } else {
      // Standard contain / fill with proper aspect ratio
      const scale = Math.min(canvasW / vw, canvasH / vh);
      const drawW = vw * scale;
      const drawH = vh * scale;
      const drawX = (canvasW - drawW) / 2;
      const drawY = (canvasH - drawH) / 2;

      ctx.drawImage(video, drawX, drawY, drawW, drawH);
    }
  }

  private drawBlurBox(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    settings: RecapSettings
  ): void {
    ctx.save();
    const boxHeight = canvasH * 0.12;

    let yPos = canvasH - boxHeight - 20; // bottom bar by default
    if (settings.blurBoxPosition === 'top-bar') {
      yPos = 20;
    }

    // Draw frosted glass tint
    const gradient = ctx.createLinearGradient(0, yPos, 0, yPos + boxHeight);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(10, 10, 15, 0.9)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, yPos, canvasW, boxHeight);

    // Accent hairline
    ctx.strokeStyle = 'rgba(255, 31, 61, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, yPos, canvasW, boxHeight);
    ctx.restore();
  }

  private drawSubtitles(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    scene: SceneSegment,
    settings: RecapSettings
  ): void {
    let text = '';
    if (settings.subtitleLang === 'burmese') {
      text = scene.scriptMy || scene.titleMy;
    } else if (settings.subtitleLang === 'english') {
      text = scene.scriptEn || scene.titleEn;
    } else if (settings.subtitleLang === 'bilingual') {
      text = `${scene.scriptMy}\n(${scene.scriptEn})`;
    }

    if (!text) return;

    ctx.save();
    const scaleFactor = canvasW / 1080;
    const fontSize = Math.round(settings.subtitleFontSize * scaleFactor * 1.3);

    ctx.font = `700 ${fontSize}px 'Padauk', 'Myanmar Text', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let y = canvasH * 0.88; // bottom
    if (settings.subtitlePosition === 'center') {
      y = canvasH * 0.5;
    } else if (settings.subtitlePosition === 'top') {
      y = canvasH * 0.15;
    }

    // Word wrapping
    const maxTextWidth = canvasW * 0.88;
    const lines = this.wrapText(ctx, text, maxTextWidth);
    const lineHeight = fontSize * 1.35;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;

      // Dark background pill/scrim behind text for readability
      if (line.trim()) {
        const textMetrics = ctx.measureText(line);
        const paddingX = 14 * scaleFactor;
        const paddingY = 6 * scaleFactor;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(
          canvasW / 2 - textMetrics.width / 2 - paddingX,
          lineY - fontSize / 2 - paddingY,
          textMetrics.width + paddingX * 2,
          fontSize + paddingY * 2
        );
      }

      // Black text outline stroke
      if (settings.subtitleOutline) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, Math.round(5 * scaleFactor));
        ctx.strokeText(line, canvasW / 2, lineY);
      }

      // Text color fill
      ctx.fillStyle = settings.subtitleColor || '#FFE600';
      ctx.fillText(line, canvasW / 2, lineY);
    });

    ctx.restore();
  }

  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    settings: RecapSettings,
    watermarkImg: HTMLImageElement | null
  ): void {
    ctx.save();
    ctx.globalAlpha = (settings.watermarkOpacity || 70) / 100;

    const scaleFactor = canvasW / 1080;
    const padding = 24 * scaleFactor;

    if (watermarkImg && watermarkImg.complete) {
      const imgW = 120 * scaleFactor;
      const imgH = (watermarkImg.height / watermarkImg.width) * imgW;
      let x = canvasW - imgW - padding;
      let y = padding;

      if (settings.watermarkPosition === 'top-left') {
        x = padding;
      } else if (settings.watermarkPosition === 'bottom-right') {
        y = canvasH - imgH - padding;
      } else if (settings.watermarkPosition === 'bottom-left') {
        x = padding;
        y = canvasH - imgH - padding;
      }

      ctx.drawImage(watermarkImg, x, y, imgW, imgH);
    } else if (settings.watermarkText) {
      const fontSize = Math.round(18 * scaleFactor);
      ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = '#ffffff';

      let x = canvasW - padding;
      let y = padding + fontSize;
      ctx.textAlign = 'right';

      if (settings.watermarkPosition === 'top-left') {
        x = padding;
        ctx.textAlign = 'left';
      } else if (settings.watermarkPosition === 'bottom-right') {
        y = canvasH - padding;
      } else if (settings.watermarkPosition === 'bottom-left') {
        x = padding;
        y = canvasH - padding;
        ctx.textAlign = 'left';
      }

      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(settings.watermarkText, x, y);
    }

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const rawLines = text.split('\n');
    const resultLines: string[] = [];

    for (const rawLine of rawLines) {
      const words = rawLine.split(' ');
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          resultLines.push(currentLine);
          currentLine = words[n];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        resultLines.push(currentLine);
      }
    }

    return resultLines.slice(0, 3); // Max 3 subtitle lines per frame for video clarity
  }
}

export const videoProcessor = new VideoProcessingEngine();
