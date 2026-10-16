import { SceneSegment } from '../types/recap';

/**
 * Format seconds into SRT timestamp: 00:01:23,450
 */
export function formatSrtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Generate standard SRT subtitle format from scenes
 */
export function generateSrt(
  scenes: SceneSegment[],
  lang: 'burmese' | 'english' | 'bilingual' = 'burmese'
): string {
  if (!scenes || scenes.length === 0) return '';

  return scenes
    .map((scene, index) => {
      const startTime = formatSrtTimestamp(scene.startTime);
      const endTime = formatSrtTimestamp(scene.endTime);

      let text = '';
      if (lang === 'burmese') {
        text = scene.scriptMy || scene.titleMy;
      } else if (lang === 'english') {
        text = scene.scriptEn || scene.titleEn;
      } else {
        text = `${scene.scriptMy}\n${scene.scriptEn}`;
      }

      return `${index + 1}\n${startTime} --> ${endTime}\n${text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Trigger download of text file in browser
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
